/**
 * Nexus — São Lázaro: Ponte de armazenamento (Apps Script)
 *
 * Recebe arquivo (Base64) + metadados via doPost(e),
 * grava o original no Google Drive da conta do Nexus,
 * retorna drive_file_id e metadados para o Nexus registrar no Supabase.
 *
 * doGet(e): retorna o conteúdo de um arquivo do Drive (para regeneração de derivados)
 *
 * Deploy: Executar como "eu" (conta do Nexus) + acesso "Qualquer pessoa"
 *
 * Validações server-side:
 * - Tipos de arquivo permitidos
 * - Tamanho máximo por tipo
 * - Rejeição de executáveis
 * - Sanitização de nome de arquivo
 * - Honeypot (campo anti-bot)
 */

// === CONFIGURAÇÃO ===

var ALLOWED_MIME = {
  'image/jpeg': { ext: 'jpg', maxSize: 10 * 1024 * 1024 },
  'image/png':  { ext: 'png', maxSize: 10 * 1024 * 1024 },
  'image/webp': { ext: 'webp', maxSize: 10 * 1024 * 1024 },
  'application/pdf': { ext: 'pdf', maxSize: 5 * 1024 * 1024 }
};

var BLOCKED_EXTENSIONS = ['exe', 'bat', 'sh', 'js', 'html', 'htm', 'php', 'py', 'rb', 'cmd', 'com', 'scr', 'vbs', 'msi', 'apk', 'app'];

var ROOT_FOLDER_NAME = 'NEXUS';
var FOLDER_MAP = {
  'fotografia': 'Fotografias',
  'edital': 'Editais',
  'documento': 'Documentos',
  'oportunidade': 'Submissões',
  'default': 'Submissões'
};

// === doPost: RECEBER ARQUIVO E GRAVAR NO DRIVE ===

function doPost(e) {
  try {
    var body;
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else {
      return jsonOut({ success: false, error: 'Corpo da requisição vazio.' });
    }

    // Honeypot: se o campo "website" foi preenchido, é bot
    if (body.website && body.website.length > 0) {
      return jsonOut({ success: true, drive_file_id: '', message: 'ok' });
    }

    // Validações obrigatórias
    if (!body.file_data || !body.file_name || !body.mime_type) {
      return jsonOut({ success: false, error: 'Arquivo, nome e tipo são obrigatórios.' });
    }

    var mimeType = body.mime_type;
    var fileName = body.file_name;
    var fileType = body.file_type || 'default';

    // Validar MIME type
    var allowed = ALLOWED_MIME[mimeType];
    if (!allowed) {
      return jsonOut({ success: false, error: 'Tipo de arquivo não permitido: ' + mimeType });
    }

    // Decodificar Base64 e verificar tamanho
    var bytes = Utilities.base64Decode(body.file_data, Utilities.Charset.UTF_8);
    var sizeBytes = bytes.length;

    if (sizeBytes > allowed.maxSize) {
      var maxMB = Math.round(allowed.maxSize / (1024 * 1024));
      var sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
      return jsonOut({ success: false, error: 'Arquivo muito grande: ' + sizeMB + ' MB. Máximo: ' + maxMB + ' MB.' });
    }

    // Sanitizar nome de arquivo
    var safeName = sanitizeFileName(fileName);
    var ext = getFileExtension(fileName);
    if (BLOCKED_EXTENSIONS.indexOf(ext.toLowerCase()) !== -1) {
      return jsonOut({ success: false, error: 'Extensão não permitida: .' + ext });
    }

    // Determinar pasta de destino
    var folderName = FOLDER_MAP[fileType] || FOLDER_MAP['default'];
    var folder = getOrCreateFolder(folderName);

    // Criar arquivo no Drive
    var blob = Utilities.newBlob(bytes, mimeType, safeName);
    var file = folder.createFile(blob);
    file.setDescription(JSON.stringify({
      uploaded_at: new Date().toISOString(),
      original_name: fileName,
      mime_type: mimeType,
      file_size: sizeBytes,
      checksum: body.checksum || null,
      sender_name: body.sender_name || null,
      submission_type: fileType
    }));

    return jsonOut({
      success: true,
      drive_file_id: file.getId(),
      drive_file_name: file.getName(),
      drive_folder: 'NEXUS/' + folderName,
      mime_type: mimeType,
      file_size: sizeBytes,
      uploaded_at: new Date().toISOString()
    });

  } catch (err) {
    return jsonOut({ success: false, error: 'Erro interno: ' + err.toString() });
  }
}

// === doGet: RETORNAR ARQUIVO DO DRIVE (para regeneração) ===

function doGet(e) {
  try {
    // Teste de saúde
    if (!e || !e.parameter || !e.parameter.file_id) {
      return jsonOut({
        success: true,
        message: 'Ponte de armazenamento do Nexus ativa.',
        version: '0.1.0-test'
      });
    }

    var fileId = e.parameter.file_id;
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    var bytes = blob.getBytes();
    var base64 = Utilities.base64Encode(bytes, Utilities.Charset.UTF_8);

    return jsonOut({
      success: true,
      file_id: fileId,
      file_name: file.getName(),
      mime_type: blob.getContentType(),
      file_size: bytes.length,
      base64_data: base64
    });

  } catch (err) {
    return jsonOut({ success: false, error: 'Erro ao ler arquivo: ' + err.toString() });
  }
}

// === HELPERS ===

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sanitizeFileName(name) {
  name = name.replace(/\.\.\//g, '').replace(/\.\./g, '').replace(/\//g, '');
  name = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (name.length > 100) {
    var ext = getFileExtension(name);
    name = name.substring(0, 95) + (ext ? '.' + ext : '');
  }
  return name;
}

function getFileExtension(name) {
  var parts = name.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function getOrCreateFolder(folderName) {
  var root = getOrCreateRootFolder();
  var year = new Date().getFullYear().toString();

  var folders = root.getFoldersByName(folderName);
  var typeFolder = folders.hasNext() ? folders.next() : root.createFolder(folderName);

  var yearFolders = typeFolder.getFoldersByName(year);
  var yearFolder = yearFolders.hasNext() ? yearFolders.next() : typeFolder.createFolder(year);

  return yearFolder;
}

function getOrCreateRootFolder() {
  var it = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(ROOT_FOLDER_NAME);
}
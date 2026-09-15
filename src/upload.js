/**
 * Nexus — Módulo de Upload (teste E2E)
 *
 * Fluxo: Formulário → Apps Script (Drive) → Supabase (catálogo + submissão)
 * Painel: listar pendentes → aprovar → gerar derivado → publicar
 *         → apagar derivado → regenerar do original → reaparecer
 *
 * Validações client-side:
 * - Tipo de arquivo (MIME)
 * - Tamanho máximo por tipo
 * - Rejeição de executáveis
 * - Honeypot
 * - Geração de checksum (SHA-256)
 */

import { supabase, isSupabaseConfigured } from './auth.js';

// === CONFIGURAÇÃO ===

// URL do Apps Script (substituir pela URL real após deploy)
const APPS_SCRIPT_URL = import.meta.env?.VITE_APPS_SCRIPT_URL || '';

const ALLOWED_TYPES = {
  'image/jpeg': { label: 'JPEG', maxSize: 10 * 1024 * 1024, category: 'fotografia' },
  'image/png':  { label: 'PNG',  maxSize: 10 * 1024 * 1024, category: 'fotografia' },
  'image/webp': { label: 'WebP', maxSize: 10 * 1024 * 1024, category: 'fotografia' },
  'application/pdf': { label: 'PDF', maxSize: 5 * 1024 * 1024, category: 'documento' },
};

const BLOCKED_EXTENSIONS = ['exe','bat','sh','js','html','htm','php','py','rb','cmd','com','scr','vbs','msi','apk','app'];

const DERIVATIVE_MAX_WIDTH = 800;
const DERIVATIVE_QUALITY = 0.80;

// === VALIDAÇÃO ===

export function validateFile(file) {
  if (!file) return { ok: false, error: 'Nenhum arquivo selecionado.' };
  const allowed = ALLOWED_TYPES[file.type];
  if (!allowed) return { ok: false, error: `Tipo não permitido: ${file.type || 'desconhecido'}. Aceitos: JPEG, PNG, WebP, PDF.` };
  if (file.size > allowed.maxSize) {
    const maxMB = Math.round(allowed.maxSize / (1024 * 1024));
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { ok: false, error: `Arquivo muito grande: ${sizeMB} MB. Máximo: ${maxMB} MB.` };
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (BLOCKED_EXTENSIONS.includes(ext)) return { ok: false, error: `Extensão não permitida: .${ext}` };
  return { ok: true, category: allowed.category };
}

// === CHECKSUM SHA-256 ===

export async function computeChecksum(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return 'sha256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// === CONVERTER PARA BASE64 ===

export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// === UPLOAD PARA APPS SCRIPT (DRIVE) ===

export async function uploadToDrive(file, metadata = {}) {
  if (!APPS_SCRIPT_URL) return { ok: false, error: 'URL do Apps Script não configurada. Defina VITE_APPS_SCRIPT_URL.' };

  const validation = validateFile(file);
  if (!validation.ok) return validation;

  const base64 = await fileToBase64(file);
  const checksum = await computeChecksum(file);

  const payload = {
    file_data: base64,
    file_name: file.name,
    mime_type: file.type,
    file_type: metadata.type || validation.category,
    checksum,
    sender_name: metadata.sender_name || '',
    website: metadata.website || '', // honeypot
  };

  // Content-Type: text/plain evita preflight CORS
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  const text = await response.text();
  let result;
  try { result = JSON.parse(text); }
  catch { return { ok: false, error: 'Resposta inválida do servidor de upload.' }; }

  if (!result.success) return { ok: false, error: result.error || 'Falha no upload.' };

  return {
    ok: true,
    drive_file_id: result.drive_file_id,
    drive_file_name: result.drive_file_name,
    drive_folder: result.drive_folder,
    mime_type: result.mime_type,
    file_size: result.file_size,
    checksum,
    uploaded_at: result.uploaded_at,
  };
}

// === REGISTRAR NO SUPABASE ===

export async function registerSubmission(fileInfo, formData = {}) {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase não configurado.' };

  // Gerar asset_id
  const { data: assetId, error: idError } = await supabase.rpc('generate_asset_id');
  if (idError) return { ok: false, error: 'Erro ao gerar ID do ativo: ' + idError.message };

  // Inserir media_asset
  const { error: assetError } = await supabase.from('media_assets').insert({
    asset_id: assetId,
    original_provider: 'google_drive',
    provider_file_id: fileInfo.drive_file_id,
    original_path: fileInfo.drive_folder + '/' + fileInfo.drive_file_name,
    mime_type: fileInfo.mime_type,
    file_size: fileInfo.file_size,
    original_filename: fileInfo.drive_file_name,
    checksum: fileInfo.checksum,
    privacy: 'private',
    derivative_status: 'pending',
  });
  if (assetError) return { ok: false, error: 'Erro ao registrar ativo: ' + assetError.message };

  // Inserir submission
  const { data: subData, error: subError } = await supabase.from('submissions').insert({
    asset_id: assetId,
    submission_type: formData.type || 'fotografia',
    title: formData.title || '',
    description: formData.description || '',
    sender_name: formData.sender || '',
    sender_email: formData.email || '',
    sender_connection: formData.connection || '',
    metadata: {
      legenda: formData.legenda || '',
      credito: formData.credito || '',
      local: formData.local || '',
      data: formData.data || '',
      autorizacao: formData.autorizacao || false,
    },
    status: 'pendente',
  }).select('id');
  if (subError) return { ok: false, error: 'Erro ao registrar submissão: ' + subError.message };

  return { ok: true, asset_id: assetId, submission_id: subData?.[0]?.id };
}

// === LISTAR SUBMISSÕES PENDENTES (para o painel) ===

export async function listPendingSubmissions() {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase não configurado.', data: [] };

  const { data, error } = await supabase
    .from('submissions')
    .select(`
      id, asset_id, submission_type, title, description,
      sender_name, sender_email, metadata,
      status, created_at,
      media_assets!inner (
        asset_id, original_provider, provider_file_id,
        mime_type, file_size, privacy,
        public_derivative_url, derivative_status
      )
    `)
    .eq('status', 'pendente')
    .order('created_at', { ascending: true });

  if (error) return { ok: false, error: error.message, data: [] };
  return { ok: true, data: data || [] };
}

// === APROVAR SUBMISSÃO ===

export async function approveSubmission(submissionId) {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase não configurado.' };
  const { error } = await supabase
    .from('submissions')
    .update({ status: 'aprovada', reviewed_at: new Date().toISOString() })
    .eq('id', submissionId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// === BAIXAR ARQUIVO DO DRIVE (via Apps Script doGet) ===

async function downloadFromDrive(driveFileId) {
  if (!APPS_SCRIPT_URL) return { ok: false, error: 'URL do Apps Script não configurada.' };

  const url = APPS_SCRIPT_URL + '?file_id=' + encodeURIComponent(driveFileId);
  const response = await fetch(url, { method: 'GET', redirect: 'follow' });
  const text = await response.text();
  let result;
  try { result = JSON.parse(text); }
  catch { return { ok: false, error: 'Resposta inválida ao baixar arquivo.' }; }

  if (!result.success) return { ok: false, error: result.error };

  // Converter Base64 de volta para Blob
  const bytes = Uint8Array.from(atob(result.base64_data), c => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: result.mime_type });
  return { ok: true, blob, mime_type: result.mime_type, file_size: result.file_size };
}

// === GERAR DERIVADO (thumbnail) NO NAVEGADOR VIA CANVAS ===

export async function generateDerivative(assetId, driveFileId) {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase não configurado.' };

  // Marcar como "regenerating"
  await supabase.from('media_assets').update({ derivative_status: 'regenerating' }).eq('asset_id', assetId);

  // 1. Baixar original do Drive
  const dl = await downloadFromDrive(driveFileId);
  if (!dl.ok) return dl;

  // 2. Se for PDF, não gerar thumbnail (link direto)
  if (dl.mime_type === 'application/pdf') {
    // Para PDF, não há derivado de imagem — só guardamos referência
    const { error } = await supabase.from('media_assets').update({
      derivative_status: 'generated',
      derivative_mime: 'application/pdf',
    }).eq('asset_id', assetId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, skipped: true, reason: 'PDF não gera thumbnail' };
  }

  // 3. Carregar imagem em um <img>
  const imgUrl = URL.createObjectURL(dl.blob);
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('Falha ao carregar imagem.'));
    img.src = imgUrl;
  });

  // 4. Redimensionar via Canvas
  const canvas = document.createElement('canvas');
  let { width, height } = img;
  if (width > DERIVATIVE_MAX_WIDTH) {
    height = Math.round(height * (DERIVATIVE_MAX_WIDTH / width));
    width = DERIVATIVE_MAX_WIDTH;
  }
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(imgUrl);

  // 5. Converter para JPEG
  const derivativeBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', DERIVATIVE_QUALITY));
  const derivativeSize = derivativeBlob.size;
  const storagePath = `${assetId}.jpg`;

  // 6. Subir no Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('public-media')
    .upload(storagePath, derivativeBlob, { contentType: 'image/jpeg', upsert: true });
  if (uploadError) return { ok: false, error: 'Erro ao subir derivado: ' + uploadError.message };

  // 7. Obter URL pública
  const { data: urlData } = supabase.storage.from('public-media').getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  // 8. Atualizar banco
  const { error: updateError } = await supabase.from('media_assets').update({
    derivative_status: 'generated',
    derivative_mime: 'image/jpeg',
    derivative_size: derivativeSize,
    public_derivative_url: publicUrl,
    privacy: 'public',
  }).eq('asset_id', assetId);
  if (updateError) return { ok: false, error: updateError.message };

  return { ok: true, derivative_url: publicUrl, derivative_size: derivativeSize };
}

// === APAGAR DERIVADO DO SUPABASE STORAGE ===

export async function deleteDerivative(assetId) {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase não configurado.' };

  const { data: asset, error: fetchError } = await supabase
    .from('media_assets')
    .select('public_derivative_url')
    .eq('asset_id', assetId)
    .single();
  if (fetchError) return { ok: false, error: fetchError.message };
  if (!asset?.public_derivative_url) return { ok: false, error: 'Derivado não encontrado.' };

  // Extrair caminho no Storage
  const url = new URL(asset.public_derivative_url);
  const pathParts = url.pathname.split('/public-media/');
  if (pathParts.length < 2) return { ok: false, error: 'Caminho do derivado inválido.' };
  const storagePath = decodeURIComponent(pathParts[1]);

  const { error: storageError } = await supabase.storage.from('public-media').remove([storagePath]);
  if (storageError) return { ok: false, error: 'Erro ao apagar derivado: ' + storageError.message };

  const { error: updateError } = await supabase.from('media_assets').update({
    derivative_status: 'deleted',
    public_derivative_url: null,
  }).eq('asset_id', assetId);
  if (updateError) return { ok: false, error: updateError.message };

  return { ok: true };
}

// === REGENERAR DERIVADO APÓS EXCLUSÃO ===

export async function regenerateDerivative(assetId, driveFileId) {
  // A regeneração é idêntica à geração inicial — baixa do Drive, gera thumbnail, sobe no Storage
  return generateDerivative(assetId, driveFileId);
}

// === PUBLICAR SUBMISSÃO (marcar como publicada + tornar ativo público) ===

export async function publishSubmission(submissionId, assetId) {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase não configurado.' };

  const { error: subError } = await supabase
    .from('submissions')
    .update({ status: 'publicada', published_at: new Date().toISOString() })
    .eq('id', submissionId);
  if (subError) return { ok: false, error: subError.message };

  return { ok: true };
}
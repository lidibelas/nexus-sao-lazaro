# Teste de Ponta a Ponta — Upload de Fotografia

Este guia descreve como validar o ciclo completo de upload, aprovação, publicação, exclusão e regeneração de uma fotografia no Nexus.

## Pré-requisitos

### 1. Google Drive (conta do Nexus)

1. Criar conta Google para o Nexus (ex: `nexus.saolazaro@gmail.com`)
2. Ativar verificação em 2 fatores
3. Ir em https://script.google.com
4. Criar novo projeto
5. Colar o conteúdo de `apps-script/Code.gs`
6. Salvar
7. **Deploy → New deployment → Web app**
   - Execute as: **Me** (conta do Nexus)
   - Who has access: **Anyone**
8. Copiar a URL de execução (`https://script.google.com/macros/s/XXXX/exec`)

### 2. Supabase

1. Criar projeto em https://supabase.com (free tier)
2. Ir em **SQL Editor** e executar `supabase/migrations/20260915_media_test.sql`
3. Ir em **Storage → New bucket**
   - Nome: `public-media`
   - Public: **ON**
4. Ir em **Settings → API**
   - Copiar **Project URL** e **Publishable key**
5. Criar arquivo `.env` na raiz do projeto:
   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXX/exec
   ```

### 3. Perfil editorial

Para acessar o painel, sua conta precisa ter um perfil editorial ativo.

Execute no SQL Editor do Supabase:
```sql
-- Substitua o e-mail pelo seu e-mail de login do Supabase
insert into public.editorial_profiles (user_id, role, active)
select id, 'Editora-chefe', true
from auth.users
where email = 'seu-email@exemplo.com';
```

## Executando o teste

### Passo 1 — Iniciar o Nexus localmente

```bash
npm install
npm run dev
```

### Passo 2 — Enviar fotografia

1. Abrir `http://localhost:5173` no navegador
2. Clicar em **"Envie para o Nexus"**
3. Selecionar tipo: **Fotografia**
4. Preencher: título, créditos, local, legenda
5. Selecionar uma foto (JPEG, PNG ou WebP, até 10 MB)
6. Marcar as caixas de confirmação
7. Clicar **Enviar para moderação**

**Resultado esperado:** mensagem "Entrou na fila de moderação."

**Verificar no Drive:** pasta `NEXUS/Fotografias/2026/` deve conter o arquivo.

**Verificar no Supabase:**
```sql
select asset_id, provider_file_id, derivative_status from media_assets;
select id, status, submission_type, asset_id from submissions;
```

### Passo 3 — Acessar o painel editorial

1. Navegar para `#/autenticacao`
2. Inserir e-mail editorial autorizado
3. Receber magic link por e-mail
4. Abrir o link no mesmo navegador
5. Ser redirecionado para `#/admin`

### Passo 4 — Ver submissão pendente

No painel, a submissão deve aparecer na **Fila de moderação** com:
- Título
- Tipo (fotografia)
- Enviado por
- Asset ID (NX-MEDIA-000001)
- Status do derivado: `pending`

### Passo 5 — Aprovar

Clicar **Aprovar** → status muda para `aprovada` no Supabase.

### Passo 6 — Gerar derivado

Clicar **Gerar derivado** → o sistema:
1. Baixa o original do Drive (via Apps Script `doGet`)
2. Redimensiona para 800px no Canvas do navegador
3. Converte para JPEG 80%
4. Sobe no Supabase Storage (`public-media`)
5. Atualiza `media_assets` com a URL pública

**Resultado esperado:** "✓ Derivado gerado (XXX KB)"

### Passo 7 — Publicar

Clicar **Publicar** → status da submissão muda para `publicada`.

### Passo 8 — Apagar derivado

Clicar **Apagar derivado** → o sistema:
1. Remove o arquivo do Supabase Storage
2. Atualiza `derivative_status = 'deleted'` e `public_derivative_url = null`

**Resultado esperado:** "✓ Derivado apagado. O original continua no Drive."

**Verificar no Supabase:**
```sql
select asset_id, derivative_status, public_derivative_url from media_assets;
-- derivative_status deve ser 'deleted', public_derivative_url deve ser null
```

### Passo 9 — Regenerar do original

Clicar **Regenerar** → o sistema:
1. Lê `provider_file_id` no banco (ID do arquivo no Drive)
2. Baixa o original do Drive (via Apps Script `doGet`)
3. Gera nova thumbnail no Canvas
4. Sobe no Supabase Storage
5. Atualiza `public_derivative_url`

**Resultado esperado:** "✓ Derivado regenerado do original."

### Passo 10 — Confirmar

Recarregar a página → a imagem deve reaparecer no painel.

**O ciclo fechou:**
- Enviar → Drive → Supabase → painel → aprovar → publicar → apagar derivado → regenerar → reaparecer
- Sem intervenção manual no Drive ou Supabase
- O original nunca foi perdido
- O derivado é descartável e regenerável

---

## O que este teste prova

- ✅ Upload automático para o Drive (via Apps Script)
- ✅ Registro no Supabase (media_assets + submissions)
- ✅ Painel mostra submissão pendente (via Supabase)
- ✅ Editor aprova sem sair do Nexus
- ✅ Geração de derivado no navegador (Canvas API)
- ✅ Derivado armazenado no Supabase Storage
- ✅ Apagar derivado não perde o original
- ✅ Regeneração funciona (do Drive → nova thumbnail)
- ✅ O ciclo completo fecha sem intervenção manual
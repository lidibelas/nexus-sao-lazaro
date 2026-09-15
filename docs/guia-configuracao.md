# Guia de Configuração — Teste E2E do Nexus

> Este guia é tela por tela. Siga na ordem. No final você me passa 3 valores públicos (nenhuma senha ou chave secreta).

---

## PARTE 1 — Google / Apps Script

### 1.1 Entrar na conta do Nexus

1. Abrir https://script.google.com
2. Fazer login com a conta do Nexus (ex: `nexus.saolazaro@gmail.com`)
3. Se aparecer tela "Bem-vindo ao Apps Script", clicar em **Continuar**

### 1.2 Criar o projeto

1. Clicar em **Novo projeto** (botão azul no topo)
2. Vai abrir um editor com um arquivo `Código.gs` vazio
3. Apagar tudo que estiver lá
4. Abrir o arquivo `apps-script/Code.gs` do repositório
5. **Copiar todo o conteúdo** (Ctrl+A → Ctrl+C)
6. **Colar no editor do Apps Script** (Ctrl+A → Ctrl+V)
7. Clicar no ícone de **Salvar** (disquete) ou Ctrl+S
8. Renomear o projeto para "Nexus - Ponte de Upload" (clicar no nome "Projeto sem título" no topo)

### 1.3 Autorizar permissões

1. Clicar em **Executar** (botão "Run" no topo)
2. Vai aparecer "Autorização necessária"
3. Clicar em **Revisar permissões**
4. Selecionar a conta do Nexus
5. Vai aparecer "O Google não verificou este app"
6. Clicar em **Avançado** (link pequeno embaixo)
7. Clicar em **Acessar Projeto sem título (não seguro)**
8. Vai mostrar as permissões necessárias:
   - **Ver, editar, criar e excluir seus arquivos no Google Drive** → Clicar em **Permitir**
9. O script vai rodar a função `doGet` e retornar um JSON de health check

### 1.4 Fazer o deploy

1. No topo, clicar em **Implantar** → **Nova implantação**
2. Ao lado do "Tipo", clicar no ícone de engrenagem → selecionar **App da Web**
3. Preencher:
   - **Descrição:** `Nexus ponte de upload v0.1`
   - **Executar como:** **Eu (sua conta do Nexus)**
   - **Quem tem acesso:** **Qualquer pessoa**
4. Clicar em **Implantar**
5. Pode pedir autorização novamente — repetir os passos 1.3 se necessário
6. Vai aparecer uma **URL do app da Web**:
   ```
   https://script.google.com/macros/s/AKfyc.../exec
   ```
7. **Copiar esta URL** ← este é o valor que você vai me passar

### 1.5 Testar se está funcionando

1. Abrir a URL copiada no navegador
2. Deve aparecer:
   ```json
   {"success":true,"message":"Ponte de armazenamento do Nexus ativa.","version":"0.1.0-test"}
   ```
3. Se aparecer isso, está funcionando ✅

### 1.6 Verificar a pasta no Drive

1. Abrir https://drive.google.com (com a conta do Nexus)
2. Deve existir uma pasta chamada **NEXUS** (criada automaticamente pelo script)
3. Dentro dela devem existir subpastas: **Fotografias**, **Editais**, **Documentos**, **Submissões**
   - (As subpastas são criadas quando o primeiro arquivo de cada tipo é enviado)

---

## PARTE 2 — Supabase

### 2.1 Criar projeto (se não tiver um)

1. Abrir https://supabase.com
2. Fazer login ou criar conta
3. Clicar em **New Project**
4. Preencher:
   - **Name:** `nexus-sao-lazaro`
   - **Database Password:** criar uma senha forte (anotar, mas NÃO me enviar)
   - **Region:** US East (ou a mais próxima)
   - **Plan:** Free
5. Clicar em **Create new project**
6. Aguardar ~2 minutos (provisionando)

### 2.2 Executar a migration SQL

1. No painel do Supabase, clicar em **SQL Editor** (menu lateral esquerdo)
2. Clicar em **New query**
3. Abrir o arquivo `supabase/migrations/20260915_media_test.sql` do repositório
4. **Copiar todo o conteúdo**
5. **Colar no SQL Editor**
6. Clicar em **Run** (botão verde)
7. Deve aparecer "Success. No rows returned."
8. Verificar: clicar em **Table Editor** → devem existir as tabelas `media_assets` e `submissions`

### 2.3 Criar o bucket de Storage

> O bucket **não pode ser criado por SQL** — precisa ser criado pela interface.

1. No painel do Supabase, clicar em **Storage** (menu lateral)
2. Clicar em **New bucket**
3. Preencher:
   - **Name:** `public-media`
   - **Public bucket:** ✅ **MARCAR** (este bucket é público — contém derivados regeneráveis)
4. Clicar em **Save**
5. O bucket está criado ✅

**Não precisa configurar MIME types nem limites no bucket** — o código do Nexus já valida tipo e tamanho antes do upload. O Supabase Storage free tier tem 1 GB, que é suficiente para derivados (cada um tem ~12 KB).

### 2.4 Criar perfil editorial

Para acessar o painel, seu usuário precisa ter um perfil editorial ativo.

1. Primeiro, você precisa estar autenticada no Supabase (via magic link do próprio Nexus)
2. Ir em **SQL Editor** → **New query**
3. Executar:
   ```sql
   -- Verificar se a tabela editorial_profiles existe
   -- Se não existir, criar:
   create table if not exists public.editorial_profiles (
     user_id uuid primary key references auth.users(id),
     role text not null default 'Editor',
     active boolean not null default true,
     created_at timestamptz not null default now()
   );

   alter table public.editorial_profiles enable row level security;

   create policy "authenticated can read own profile"
     on public.editorial_profiles for select
     to authenticated
     using (true);

   create policy "authenticated can read profiles"
     on public.editorial_profiles for select
     to authenticated
     using (true);
   ```
4. Clicar **Run**
5. Depois, para dar acesso editorial a você mesma:
   ```sql
   -- Substitua pelo SEU e-mail de login do Supabase
   insert into public.editorial_profiles (user_id, role, active)
   select id, 'Editora-chefe', true
   from auth.users
   where email = 'SEU_EMAIL@exemplo.com';
   ```
   ⚠️ **Substitua `SEU_EMAIL@exemplo.com`** pelo e-mail que você usou para fazer login no Supabase (via magic link do Nexus)
6. Clicar **Run**

### 2.5 Obter as credenciais públicas

1. No painel do Supabase, clicar em **Settings** (engrenagem no menu lateral)
2. Clicar em **API**
3. Anotar:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **Publishable key:** `sb_publishable_xxxxx` (começa com `sb_publishable_`)
4. ⚠️ **NÃO copie** a `service_role` key nem a senha do banco — não preciso delas

### 2.6 Configurar variáveis de ambiente

1. Na raiz do projeto, criar arquivo `.env` (se não existir):
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfyc.../exec
   ```
2. Substituir os valores pelos que você obteve nos passos anteriores
3. ⚠️ **Nunca commitar o `.env`** (já está no `.gitignore`)

---

## PARTE 3 — Rodar o teste

### 3.1 Instalar e iniciar

```bash
# Na pasta do projeto (branch teste-e2e-midia)
git checkout teste-e2e-midia
npm install
npm run dev
```

### 3.2 Enviar uma fotografia

1. Abrir `http://localhost:5173` no navegador
2. Clicar em **"Envie para o Nexus"**
3. Selecionar tipo: **Fotografia**
4. Preencher título, créditos, local, legenda
5. Selecionar uma foto JPEG/PNG/WebP (até 10 MB)
6. Marcar as caixas de confirmação
7. Clicar **Enviar para moderação**
8. Ver mensagem "Entrou na fila"

### 3.3 Verificar no Drive

1. Abrir https://drive.google.com (conta do Nexus)
2. Navegar: NEXUS → Fotografias → 2026
3. O arquivo deve estar lá ✅

### 3.4 Verificar no Supabase

1. No Supabase, ir em **Table Editor** → `media_assets`
2. Deve existir um registro com `asset_id = NX-MEDIA-000001`
3. Ir em **Table Editor** → `submissions`
4. Deve existir um registro com `status = pendente`

### 3.5 Acessar o painel

1. No navegador, navegar para `http://localhost:5173/#/autenticacao`
2. Inserir seu e-mail editorial
3. Receber magic link por e-mail
4. Abrir o link no mesmo navegador
5. Ser redirecionada para o painel `#/admin`

### 3.6 Ciclo completo

No painel, para cada submissão:

1. **Aprovar** → status muda para `aprovada`
2. **Gerar derivado** → baixa do Drive → Canvas → Storage → URL pública
3. **Publicar** → status muda para `publicada`
4. **Apagar derivado** → remove do Storage, original preservado no Drive
5. **Regenerar** → baixa do Drive novamente → novo derivado → imagem volta

---

## RESUMO: O que você me passa

Ao terminar a configuração, me envie apenas estes 3 valores:

```
1. Apps Script URL:  https://script.google.com/macros/s/AKfyc.../exec
2. Supabase URL:      https://xxxxx.supabase.co
3. Supabase Key:      sb_publishable_xxxxx
```

Estes são valores **públicos** (vão no frontend do Nexus). Nenhuma senha, chave secreta ou credencial administrativa é necessária.
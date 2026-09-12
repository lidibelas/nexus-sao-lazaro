# Ativação segura da Área da Editoria

Este guia ativa somente o acesso inicial de **Lídia Belas como Editora-chefe**. Não habilita colaboradores, envio público nem moderação de conteúdo real.

## 1. Criar o perfil editorial protegido

1. No painel do projeto `nexus-sao-lazaro`, abra **SQL Editor**.
2. Abra o arquivo `supabase/migrations/20260912_editorial_access.sql` deste repositório.
3. Cole e execute o conteúdo completo.
4. Confira em **Table Editor → editorial_profiles** se há exatamente um registro com:
   - papel: `Editora-chefe`
   - ativo: `true`

A tabela tem RLS ativa. A pessoa conectada consegue consultar somente o próprio perfil e não consegue elevar seu papel no navegador.

## 2. Configurar o aplicativo sem segredos

1. Em **Settings → API**, copie apenas:
   - `Project URL`;
   - `Publishable key` (ou a antiga `anon key`, caso o painel ainda use esse nome).
2. No repositório local, faça uma cópia de `.env.example` chamada `.env.local`.
3. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Teste localmente com `npm run dev` e abra `#/autenticacao`.

Esses valores são destinados ao navegador, mas não permitem burlar RLS. **Nunca** copie `service_role`, senha PostgreSQL, token pessoal ou link de convite para arquivo, GitHub Pages ou chat.

## 3. Publicar com GitHub Pages

Como GitHub Pages gera arquivos estáticos, as variáveis devem estar disponíveis **na hora do build**. Antes de publicar, configure os dois valores públicos como GitHub Actions Variables do repositório e use-os no workflow de deploy. Não use GitHub Secrets para a chave `service_role` — ela não deve existir no frontend.

## 4. Teste de aceite

1. Visite `#/autenticacao` e peça o link para o e-mail individual autorizado.
2. Abra o link no mesmo navegador.
3. O endereço deve ser limpo automaticamente e levar a `#/admin`.
4. O painel deve mostrar `Sessão validada para Editora-chefe`.
5. Clique em **Sair desta conta** e confirme que `#/admin` volta a pedir a autenticação.

## Limites que permanecem intencionais

- O formulário público continua demonstrativo/local; não há coleta pública real.
- Não existe tabela de submissões nem publicação automática.
- Inclusão, troca de papel e revogação de outras pessoas só ocorrerão após formação da equipe e novo conjunto de políticas RLS.

# Nexus — MVP São Lázaro

> Revista universitária + central de oportunidades + agenda + comunidade + memória visual, iniciada para a FFCH/UFBA e projetada para expansão.

## Executar localmente

```bash
npm install
npm run dev
```

A aplicação é uma SPA estática em Vite (JavaScript puro) e pode ser publicada no GitHub Pages após configurar `base` no `vite.config.js` para o nome do repositório.

## O que já está funcional neste MVP

- homepage editorial e responsiva;
- listagem pesquisável e filtrável de oportunidades;
- páginas individuais com status, fonte, URL, edital e data de verificação;
- página pública de fontes monitoradas e classificação de monitoramento;
- seções Agenda, Revista, Comunidade, Conquistas e Serviços;
- formulário adaptativo de submissão (inclui fluxo específico de fotografia);
- fila de moderação e mudança de status no painel demonstrativo;
- seleção demonstrativa de papel de usuário;
- entidades de Centro Acadêmico separadas de gestões no modelo de dados;
- persistência **local** de submissões e papel de demonstração via `localStorage`.

## Estrutura editorial e acervo visual

- `CONTRIBUTING.md` explica a diferença entre **envio para curadoria** e **edição direta pela equipe autorizada**.
- `src/data.js` concentra conteúdos públicos aprovados e inseridos diretamente no site — incluindo a lista de serviços.
- `public/imagens/` recebe exclusivamente cópias públicas, aprovadas e otimizadas; não recebe originais, arquivos pendentes ou materiais sensíveis.
- `docs/catalogo-fotografias.md` mantém a ficha mínima e os estados editoriais das fotos publicadas.
- O acervo completo/original será preservado em Drive privado quando a conta institucional e a estrutura de acesso forem definidas; isso ainda não está configurado.

## Limite explícito do protótipo

Não há servidor, autenticação real, envio real de arquivos ou banco remoto neste estágio. Assim, o painel é funcional **no navegador local**, mas não deve ser usado como produção. Ele demonstra as telas, fluxos e modelo editorial; a produção exige backend com controle de acesso.

## Arquitetura de produção recomendada — sem custo recorrente no MVP

- **Hospedagem:** GitHub Pages.
- **Dados, autenticação, arquivos:** Supabase Free (PostgreSQL, Auth, Storage e RLS).
- **Administração:** contas individuais; jamais senha compartilhada.
- **Backup:** exportações regulares do PostgreSQL/CSV e repositório Git.
- **Antispam:** validação no servidor, rate limit e CAPTCHA gratuito compatível, se necessário.

A escolha mantém portabilidade: dados ficam em PostgreSQL e o frontend permanece estático, sem plataforma proprietária obrigatória.

## Modelo de dados para a fase Supabase

### Núcleo editorial

- `contents`: tipo (`opportunity`, `event`, `article`, `community`, `achievement`, `service`), estado editorial, título, texto, autoria, proveniência, fonte, verificação, data de publicação.
- `opportunities`: relação 1:1 com `contents`; tipo de oportunidade, instituição, organização responsável, prazo, vagas, bolsa, valor, modalidade, URL oficial, URL do edital.
- `events`: relação 1:1 com `contents`; início/fim, local, custo, inscrição.
- `sources`: organização, URL, confiabilidade, forma de monitoramento, última verificação, observações.
- `source_checks`: histórico de cada conferência, responsável, resultado e URL observada.
- `taxonomies`, `content_taxonomies`: termos com vocabulários separados (`course`, `area`, `opportunity_type`, `audience`, `modality`, `institution`, `tag`, `location`). Isso evita tratar curso, área e tipo como a mesma coisa.

### Comunidade e governança

- `organizations`: entidade permanente (ex.: CA, coletivo, laboratório).
- `organization_managements`: gestão temporal associada a uma organização, com início, fim, nome, logo e status.
- `profiles`: pessoa autenticada, vínculo e situação.
- `organization_memberships`: associação pessoa–organização–papel–período.
- `roles`, `permissions`: administrador geral, editor, moderador, redator/colaborador, representante de CA; permissões configuráveis.
- `editorial_audit_log`: criou, editou, aprovou, publicou, recusou, com usuário e data.

### Fotos e submissões

- `submissions`: tipo, dados de formulário, estado (`recebida`, `em revisão`, `ajuste solicitado`, `aprovada`, `recusada`), remetente e minimização de dados.
- `media_assets`: arquivo, crédito, licença/autorização, local, data aproximada, legenda, visibilidade e relação com conteúdo.
- Para fotos identificáveis: um campo de confirmação de autorização não substitui a análise humana. Não publicar sem verificação adequada.

## Política editorial mínima

1. O Nexus é agregador e divulgador: editais e fontes originais prevalecem.
2. Toda oportunidade institucional indica fonte, URL original e data de verificação.
3. Conteúdo comunitário não é publicado automaticamente.
4. Serviços não são endossados pelo Nexus; golpes, discriminação, ilegalidades e spam são recusados.
5. Dados pessoais ficam restritos ao necessário para resposta e moderação.

## Dados reais do protótipo

Os registros iniciais em `src/data.js` apontam para páginas institucionais da PROGRAD, PROAE, PROEXT-AC, SRI, FFCH e EDUFBA. Eles preservam a URL de origem e não preenchem campos ausentes: usam `Não informado pela fonte consultada` quando aplicável.

A página `#/fontes` também explicita o que é fonte estruturada, semiestruturada e descentralizada; não há alegação de coleta automática universal.

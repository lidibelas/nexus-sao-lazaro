# Contribuindo para o Nexus

O repositório é uma **via de publicação direta para a equipe editorial autorizada**. Ele não substitui a triagem pública: quem está fora da equipe envia materiais pelo canal editorial, e não pelo GitHub.

## Dois caminhos diferentes

### 1. Envio para curadoria
Use para fotografias, eventos, serviços, pautas e informações enviadas pela comunidade.

```text
Remetente → canal editorial do Nexus → análise humana → publicação, ajuste, recusa ou arquivamento
```

O e-mail oficial do Nexus ainda será divulgado após a conta institucional ser criada. **Enviar não é publicar.**

### 2. Edição direta do site
Use somente quando a pessoa já integra a equipe editorial autorizada e vai alterar conteúdo que pode entrar diretamente no site — por exemplo, um serviço confirmado pela editoria, uma página, um texto ou uma imagem já aprovada.

```text
Conta GitHub individual → branch → pull request → revisão editorial → merge em main → GitHub Pages publica
```

Não use senha compartilhada, conta repassada entre gestões ou acesso de escrita amplo por e-mail de organização. O e-mail de um CA é um canal institucional de contato; acessos técnicos devem ser individuais, rastreáveis e revogáveis.

## Onde cada coisa fica

- `src/data.js` — dados editoriais públicos já aprovados: oportunidades, agenda, textos e serviços.
- `src/main.js` — rotas e estrutura das páginas.
- `src/style.css` — aparência do site.
- `public/imagens/` — somente cópias públicas, aprovadas e otimizadas para o site.
- `docs/` — regras operacionais, modelos e documentação.

## Adicionar um serviço diretamente ao site

1. Confirme que ele já foi validado pela editoria e que pode ser público.
2. Crie uma branch: `git checkout -b feat/adiciona-servico-nome`.
3. Edite a lista `services` em `src/data.js`.
4. Execute `npm run build`.
5. Revise `git status` para não incluir arquivos estranhos.
6. Faça commit claro, por exemplo: `feat: adiciona serviço de revisão da comunidade`.
7. Envie a branch e abra um pull request para revisão.

Não acrescente serviço sem contato verificável, com promessa enganosa, discriminatório, ilegal ou que peça dados pessoais desnecessários.

## Publicar uma fotografia já aprovada

1. Preserve o original no acervo privado definido pela editoria (Drive, quando configurado).
2. Verifique autoria/crédito, local, data aproximada, contexto, autorização/licença e possíveis riscos de exposição.
3. Gere uma cópia para a web: preferencialmente `.webp` ou `.jpg`, até cerca de `1600 px` no lado maior e até cerca de `1 MB`.
4. Salve-a em `public/imagens/<ano>/<colecao>/`.
5. Registre a ficha editorial em `docs/catalogo-fotografias.md` e adicione a entrada pública no código quando a galeria estiver alimentada.
6. Abra pull request; não publique arquivo sensível, pendente ou original privado.

> Atenção: repositórios Git preservam histórico. Uma imagem publicada indevidamente pode continuar acessível em commits anteriores mesmo depois de apagada da pasta atual.

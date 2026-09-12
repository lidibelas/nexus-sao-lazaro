export const checkedAt = '12 set. 2026';

// Cada fonte abaixo foi aberta nesta etapa. Sem RSS/API confirmado, não há alegação de automação.
export const sources = [
  {id:'ffch', name:'Notícias e editais FFCH', organ:'Faculdade de Filosofia e Ciências Humanas / UFBA', url:'https://ffch.ufba.br/', content:'Notícias institucionais da unidade, incluindo editais e estágios.', format:'Notícias e documentos anexos.', cadence:'Publicações datadas; frequência variável.', editals:false, feed:'Não confirmado na verificação.', monitoring:'semiestruturada', automation:'Monitorar títulos e URLs é possível; interpretar anexos e confirmar situação requer pessoa.', reliability:'Oficial primária', verified:checkedAt},
  {id:'edufba', name:'Editais', organ:'EDUFBA / UFBA', url:'https://edufba.ufba.br/editais', content:'Chamadas, seleções e estágios da Editora da UFBA.', format:'Página de editais e anexos PDF.', cadence:'Por edital.', editals:true, feed:'Não confirmado na verificação.', monitoring:'semiestruturada', automation:'Monitorar a listagem é viável; dados dos anexos e alterações exigem curadoria.', reliability:'Oficial primária', verified:checkedAt},
  {id:'ppgneim', name:'Resultados de Editais', organ:'PPGNEIM / FFCH / UFBA', url:'https://ppgneim.ffch.ufba.br/pt-br/resultados-editais', content:'Página temática de resultados de editais do Programa de Pós-Graduação em Estudos Interdisciplinares sobre Mulheres, Gênero e Feminismo.', format:'Página temática do programa.', cadence:'Por processo seletivo e edital.', editals:true, feed:'Não confirmado na verificação.', monitoring:'descentralizada', automation:'Conferência manual recomendada, com alerta de mudança de página como apoio.', reliability:'Oficial primária', verified:checkedAt},
  {id:'lassos', name:'Eventos LASSOS', organ:'LASSOS / FFCH / UFBA', url:'https://www.lassos.ffch.ufba.br/index.php/category/eventos-lassos/', content:'Categoria pública de eventos de laboratório, com atividades presenciais e abertas em registros encontrados.', format:'Categoria de blog.', cadence:'Variável conforme atividades.', editals:false, feed:'Não confirmado na verificação.', monitoring:'descentralizada', automation:'Acompanhamento manual e submissão direta pelo laboratório; não prometer coleta automática.', reliability:'Institucional de grupo de pesquisa', verified:checkedAt},
];

export const opportunities = [
  {id:'ffch-estagio-003-2026', title:'Edital 003/2026 — Estágio não obrigatório na FFCH', type:'Estágio', category:'Trabalho e formação', organ:'FFCH / UFBA', area:'Não informado pela fonte consultada', courses:['Não informado pela fonte consultada'], audience:'Não informado pela fonte consultada', description:'Página institucional da FFCH para processo seletivo simplificado de contratação de estagiários/as para estágio não obrigatório.', requirements:'Consulte o edital oficial.', vacancies:'Não informado pela fonte consultada', scholarship:'Não informado pela fonte consultada', value:'Não informado pela fonte consultada', deadline:null, period:'2026', modality:'Não informado pela fonte consultada', documents:'Consulte a página e seus anexos.', apply:'Consulte a página institucional da FFCH.', contact:'Não informado pela fonte consultada', url:'https://ffch.ufba.br/edital-0032026-processo-seletivo-simplificado-para-contratacao-de-estagiariosas-para-estagio-nao', edital:'https://ffch.ufba.br/edital-0032026-processo-seletivo-simplificado-para-contratacao-de-estagiariosas-para-estagio-nao', sourceId:'ffch', status:'encerrada', verified:checkedAt, provenance:'fonte institucional'},
  {id:'edufba-estagio-01-2026', title:'Edital de seleção de estagiários(as) nº 01/2026 — EDUFBA', type:'Estágio', category:'Trabalho e formação', organ:'EDUFBA / UFBA', area:'Não informado pela fonte consultada', courses:['Não informado pela fonte consultada'], audience:'Não informado pela fonte consultada', description:'Página institucional de seleção de estagiários/as da EDUFBA, com edital, cronograma, comunicados e resultado final vinculados.', requirements:'Consulte o edital oficial.', vacancies:'Não informado pela fonte consultada', scholarship:'Não informado pela fonte consultada', value:'Não informado pela fonte consultada', deadline:'2026-07-09', period:'2026', modality:'Não informado pela fonte consultada', documents:'Edital e anexos disponíveis na página oficial.', apply:'Conforme o edital da EDUFBA.', contact:'Não informado pela fonte consultada', url:'https://edufba.ufba.br/editais/edital-de-selecao-de-estagiariosas-no-012026', edital:'https://edufba.ufba.br/sites/edufba.ufba.br/files/editais/edital_edufba_2026_retificacao_no1_-_selecao_para_estagio_nao_obrigatorio.docx.pdf', sourceId:'edufba', status:'encerrada', verified:checkedAt, provenance:'fonte institucional'},
];

export const posts = [
 {id:'guia-monitoria',section:'Revista',kind:'Guia',title:'Monitoria não é só currículo: por onde começar',excerpt:'Um guia editorial do Nexus para ler editais, conversar com docentes e acompanhar o programa.',demo:true},
 {id:'memoria-corredores',section:'Revista',kind:'Memória',title:'O que os corredores contam sobre São Lázaro',excerpt:'Pauta em construção: arquivo vivo, cartazes, encontros e camadas de tempo.',demo:true},
 {id:'coletivos',section:'Comunidade',kind:'Chamada aberta',title:'Seu coletivo, projeto ou produção pode entrar no mapa',excerpt:'Envie informações para moderação e ajude a ampliar a circulação da comunidade.',demo:true},
 {id:'conquistas',section:'Conquistas',kind:'Convite',title:'Uma conquista também pode virar notícia',excerpt:'Prêmios, publicações, seleções e realizações coletivas: conte ao Nexus.',demo:true},
];
export const events = [{id:'event-1',title:'Agenda de São Lázaro: envie atividades abertas',date:'A definir',place:'São Lázaro / online',category:'Chamada comunitária',description:'O MVP abre uma fila de moderação para agenda. Este registro é demonstrativo e não anuncia evento real.',demo:true}];

// Conteúdos incluídos diretamente no site pela equipe editorial autorizada.
// Cada item deve ter sido verificado antes do merge em main; não é uma fila pública.
export const services = [
 {id:'servico-chamada',kind:'Envie seu serviço',title:'Divulgue uma iniciativa de renda',description:'Fotografia, revisão, alimentação, arte, cuidados e outros serviços da comunidade podem ser encaminhados para curadoria.',demo:true}
];

export const organizations = [
 {id:'cacs',name:'Centro Acadêmico de Ciências Sociais',sigla:'CACS',course:'Ciências Sociais',instagram:'Não informado',logo:'CACS',currentManagement:null,description:'Organização iniciadora do Nexus. Dados de gestão são administráveis no painel.'},
 {id:'ca-historia',name:'Centro Acadêmico de História',sigla:'CAH',course:'História',instagram:'Não informado',logo:'CAH',currentManagement:null,description:'Espaço preparado para associação de gestão, logos e links.'}
];
// Estrutura editorial inicial: proposta pública, a revisar com a futura equipe.
// Não há cadastro, login ou permissões reais neste MVP.
export const editorialTeam = {
  lead: {name:'Lídia Belas', role:'Editora-chefe interina', scope:'Responsável inicial pela curadoria, moderação e formação da equipe.'},
  stage:'implantação',
  note:'Enquanto não houver equipe treinada, somente a editora-chefe deve aprovar, publicar ou acessar a fila de envios reais.'
};

export const roleDefinitions = [
  {name:'Editora-chefe', access:'Acesso integral à fila editorial e às configurações.', does:'Define critérios, coordena a equipe, aprova publicações, cuida de casos sensíveis e forma novas pessoas.'},
  {name:'Editora', access:'Acesso editorial após formação e convite.', does:'Organiza pautas, revisa materiais, pede ajustes e publica dentro dos critérios definidos pela editoria-chefe.'},
  {name:'Revisor(a)', access:'Acesso apenas aos itens atribuídos para revisão.', does:'Confere clareza, links, fonte, datas, créditos, autorização e adequação antes da decisão editorial.'},
  {name:'Monitor(a) de comunidade', access:'Acesso a registros e alertas atribuídos, sem publicação.', does:'Acompanha fontes e coletivos, sugere pautas e sinaliza informações que precisam de curadoria.'},
  {name:'Redator(a) / colaborador(a)', access:'Pode enviar e acompanhar somente os próprios envios.', does:'Produz textos, registros e propostas; não aprova nem visualiza envios de outras pessoas.'},
  {name:'Representante de organização', access:'Pode enviar em nome de um CA, coletivo, projeto, laboratório ou editora.', does:'Atualiza a ficha pública da organização e encaminha conteúdos para análise; não se autoaprova.'}
];

export const roles = roleDefinitions.map(role => role.name);

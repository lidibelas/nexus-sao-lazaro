import './style.css';
import {sources, opportunities, posts, events, services, organizations, editorialTeam, roleDefinitions, checkedAt} from './data.js';
import { currentEditorialAccess, isSupabaseConfigured, sendMagicLink, signOut, supabase } from './auth.js';
import { validateFile, uploadToDrive, registerSubmission, listPendingSubmissions, approveSubmission, generateDerivative, deleteDerivative, regenerateDerivative, publishSubmission } from './upload.js';

const store = {
  get(k, fallback){ try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch { return fallback } },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)) }
};
let submitted = store.get('nexus-submissions', []);
let extraOpps = store.get('nexus-opportunities', []);
const allOpps = () => [...opportunities, ...extraOpps];
const $ = (s) => document.querySelector(s);
const safe = (value='') => String(value).replace(/[&<>'"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
const date = (iso) => iso ? new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium'}).format(new Date(iso+'T12:00:00')) : 'Não informado pela fonte';
const sourceOf = (id) => sources.find(s=>s.id===id);

function shell(content, page=''){
  document.title = `${page ? page+' · ' : ''}Nexus — São Lázaro`;
  $('#app').innerHTML = `<a class="skip" href="#conteudo">Pular para o conteúdo</a><header class="top"><a href="#/" class="brand" aria-label="Nexus, início"><span class="mark">N</span><span>NEXUS<small>São Lázaro em circulação</small></span></a><button class="menu" aria-label="Abrir menu">Menu</button><nav><a href="#/oportunidades">Oportunidades</a><a href="#/agenda">Agenda</a><a href="#/revista">Revista</a><a href="#/comunidade">Comunidade</a><a href="#/fotografias">Fotografias</a><a href="#/governanca">Equipe e regras</a><a href="#/servicos">Serviços</a></nav><a class="button compact" href="#/enviar">Envie para o Nexus</a></header><main id="conteudo">${content}</main><footer><div class="brand"><span class="mark">N</span><span>NEXUS<small>infraestrutura editorial comunitária</small></span></div><p>Feito para circular informação, memória e presença em São Lázaro.</p><p><a href="#/sobre">Sobre, transparência e fontes</a> · <a href="#/admin">Painel</a></p></footer>`;
  $('.menu')?.addEventListener('click',()=> $('nav').classList.toggle('open'));
}
const intro = `<div class="eyebrow">FFCH · UFBA · SÃO LÁZARO</div>`;
function card(o){ const source=sourceOf(o.sourceId); return `<article class="opp-card"><div class="card-top"><span class="tag">${safe(o.type)}</span><span class="status ${o.status}">${o.status==='encerrada'?'Encerrada':o.status==='sem_prazo'?'Prazo a confirmar':'Aberta'}</span></div><h3><a href="#/oportunidade/${o.id}">${safe(o.title)}</a></h3><p>${safe(o.organ)}</p><dl><div><dt>Prazo</dt><dd>${date(o.deadline)}</dd></div><div><dt>Bolsa</dt><dd>${safe(o.scholarship)}</dd></div></dl><small>Fonte: ${safe(source?.organ || 'Não informado')} · verificado em ${safe(o.verified)}</small></article>`; }
function home(){ const items=allOpps().slice(0,3).map(card).join(''); shell(`<section class="hero"><div><div class="eyebrow">UMA REVISTA DA VIDA UNIVERSITÁRIA</div><h1>O que circula<br><em>em São Lázaro.</em></h1><p>Oportunidades, agenda, cultura, memória e trabalho estudantil — numa plataforma editorial construída pela comunidade.</p><div class="actions"><a class="button" href="#/oportunidades">Ver oportunidades</a><a class="text-link" href="#/enviar">Envie para o Nexus →</a></div></div><div class="hero-art" aria-label="Composição gráfica inspirada em vegetação, cartazes e corredores de São Lázaro"><span class="poster">SÃO<br>LÁZARO</span><span class="sun"></span><span class="leaf l1"></span><span class="leaf l2"></span><span class="corridor"></span><p>ACERVO VIVO<br><b>EM CONSTRUÇÃO</b></p></div></section><section class="ticker"><span>AGORA EM SÃO LÁZARO</span><b>informação não deve depender de estar no grupo certo</b><a href="#/sobre">Como o Nexus trabalha →</a></section><section class="section-head"><div>${intro}<h2>Oportunidades para não perder de vista.</h2></div><a class="text-link" href="#/oportunidades">Ver todas →</a></section><section class="cards">${items}</section><section class="split"><div class="feature"><div class="eyebrow">REVISTA</div><h2>Universidade também é permanência, festa, trabalho, arte e memória.</h2><a href="#/revista" class="button ghost">Ler a revista</a></div><div class="photo-call"><div class="frame">⌁</div><div><div class="eyebrow">ACERVO COMUNITÁRIO</div><h2>Seu olhar sobre São Lázaro cabe aqui.</h2><p>Fotografias passam por moderação, verificação de autorização e crédito antes de integrar o acervo.</p><a class="text-link" href="#/enviar?tipo=fotografia">Enviar fotografia →</a></div></div></section><section class="section-head"><div>${intro}<h2>A vida universitária não cabe num edital.</h2></div></section><section class="editorial-grid">${posts.map(p=>`<article class="story"><span class="tag">${p.kind}</span><h3>${p.title}</h3><p>${p.excerpt}</p>${p.demo?'<small>CONTEÚDO DEMONSTRATIVO</small>':''}</article>`).join('')}</section>`, 'Início');}
function opportunitiesPage(){ const courses=[...new Set(allOpps().flatMap(o=>o.courses))]; shell(`<section class="page-head">${intro}<h1>Oportunidades</h1><p>O Nexus agrega e contextualiza. O edital e a fonte original continuam sendo a referência definitiva.</p></section><section class="filters" aria-label="Filtros"><label>Buscar<input id="query" placeholder="ex.: monitoria, estágio"></label><label>Tipo<select id="type"><option value="">Todos</option>${[...new Set(allOpps().map(o=>o.type))].map(x=>`<option>${x}</option>`).join('')}</select></label><label>Curso<select id="course"><option value="">Todos</option>${courses.map(x=>`<option>${safe(x)}</option>`).join('')}</select></label><label><input id="bolsa" type="checkbox"> Com bolsa</label><label><input id="open" type="checkbox"> Inscrições abertas</label></section><div id="count" class="result-count"></div><section id="opp-list" class="cards"></section>`, 'Oportunidades'); function render(){const q=$('#query').value.toLowerCase(), type=$('#type').value, course=$('#course').value, bolsa=$('#bolsa').checked, open=$('#open').checked; const r=allOpps().filter(o=>(!q||JSON.stringify(o).toLowerCase().includes(q))&&(!type||o.type===type)&&(!course||o.courses.includes(course))&&(!bolsa||/sim|bolsa/i.test(o.scholarship))&&(!open||o.status==='aberta')); $('#count').textContent=`${r.length} registro(s) encontrado(s)`;$('#opp-list').innerHTML=r.length?r.map(card).join(''):'<p class="empty">Nenhuma oportunidade com esses filtros. Tente remover algum filtro ou envie uma fonte para curadoria.</p>'; } ['query','type','course','bolsa','open'].forEach(x=>$('#'+x).addEventListener('input',render));render();}
function opportunity(id){const o=allOpps().find(x=>x.id===id);if(!o)return notFound(); const s=sourceOf(o.sourceId); shell(`<article class="detail"><a class="back" href="#/oportunidades">← Oportunidades</a><div class="detail-meta"><span class="tag">${safe(o.type)}</span><span class="status ${o.status}">${o.status==='encerrada'?'ENCERRADA':o.status==='sem_prazo'?'PRAZO A CONFIRMAR':'ABERTA'}</span></div><h1>${safe(o.title)}</h1><p class="lede">${safe(o.description)}</p><section class="fact-grid"><div><b>Tipo</b>${safe(o.type)}</div><div><b>Área</b>${safe(o.area)}</div><div><b>Curso(s)</b>${safe(o.courses.join(', '))}</div><div><b>Instituição</b>UFBA</div><div><b>Bolsa</b>${safe(o.scholarship)}</div><div><b>Prazo</b>${date(o.deadline)}</div><div><b>Vagas</b>${safe(o.vacancies)}</div><div><b>Modalidade</b>${safe(o.modality)}</div></section><section class="prose"><h2>Quem pode participar</h2><p>${safe(o.audience)}</p><h2>Requisitos</h2><p>${safe(o.requirements)}</p><h2>Como se inscrever</h2><p>${safe(o.apply)}</p><h2>Documentos</h2><p>${safe(o.documents)}</p></section><aside class="source-box"><b>Fonte e transparência</b><p><strong>Órgão:</strong> ${safe(o.organ)}<br><strong>Fonte original:</strong> <a href="${o.url}" target="_blank" rel="noreferrer">abrir página oficial ↗</a><br><strong>Edital:</strong> <a href="${o.edital}" target="_blank" rel="noreferrer">consultar documento/página ↗</a><br><strong>Verificado em:</strong> ${safe(o.verified)}<br><strong>Proveniência:</strong> ${safe(o.provenance)}</p><small>O Nexus não substitui a leitura do edital.</small></aside></article>`,o.title);}
function generic(title, text, section){shell(`<section class="page-head">${intro}<h1>${title}</h1><p>${text}</p></section><section class="editorial-grid">${section.map(p=>`<article class="story"><span class="tag">${p.kind||p.category}</span><h3>${p.title}</h3><p>${p.excerpt||p.description}</p>${p.demo?'<small>CONTEÚDO DEMONSTRATIVO</small>':''}</article>`).join('')}</section>`,title)}
function sourcesPage(){shell(`<section class="page-head">${intro}<h1>Fontes monitoradas</h1><p>Mapa público de onde a informação circula. A automação é apoio; publicação e interpretação passam por curadoria humana.</p></section><section class="source-list">${sources.map(s=>`<article><div><span class="tag">${s.monitoring}</span><h3><a href="${s.url}" target="_blank" rel="noreferrer">${s.name} ↗</a></h3><p>${s.organ}</p></div><dl><div><dt>Conteúdo</dt><dd>${s.content}</dd></div><div><dt>Formato</dt><dd>${s.format}</dd></div><div><dt>Atualização aparente</dt><dd>${s.cadence}</dd></div><div><dt>RSS/API/feed</dt><dd>${s.feed}</dd></div><div><dt>Monitoramento</dt><dd>${s.automation}</dd></div><div><dt>Confiabilidade</dt><dd>${s.reliability} · verificado em ${s.verified}</dd></div></dl></article>`).join('')}</section>`, 'Fontes monitoradas')}
function send(){shell(`<section class="page-head">${intro}<h1>Envie para o Nexus</h1><p>Nada é publicado automaticamente. Todo envio entra em fila de moderação.</p></section><form id="submit-form" class="submission"><label>O que você quer enviar?<select name="type" id="submission-type"><option value="oportunidade">Oportunidade</option><option value="evento">Evento</option><option value="pauta">Pauta</option><option value="conquista">Conquista</option><option value="projeto">Projeto / produção</option><option value="servico">Serviço / classificado</option><option value="fotografia">Fotografia</option><option value="outro">Outro</option></select></label><div id="dynamic-fields"></div><div id="upload-status"></div><label>Seu nome<input name="sender" required></label><label>Vínculo com a comunidade<input name="connection" placeholder="estudante, coletivo, CA, laboratório..."></label><label>E-mail para retorno<input type="email" name="email" required></label><label>Observações<textarea name="notes"></textarea></label><label class="check"><input required type="checkbox"> Confirmo que as informações são verdadeiras e que tenho autorização para enviar este conteúdo.</label><label class="check"><input required type="checkbox"> Li que o envio poderá ser recusado, devolvido para ajuste ou publicado com edição e crédito.</label><button class="button" id="submit-btn">Enviar para moderação</button></form>`, 'Envie para o Nexus'); const dynamic=()=>{let type=$('#submission-type').value;let html=`<label>Título / nome<input name="title" required></label><label>Descrição<textarea name="description" required></textarea></label>`;if(type==='oportunidade')html+=`<label>Link oficial<input name="officialUrl" type="url"></label><label>Prazo<input name="deadline" type="date"></label><label>Organização responsável<input name="organization"></label>`; if(type==='evento')html+=`<label>Data<input name="date" type="date"></label><label>Horário<input name="time"></label><label>Local<input name="place"></label><label>Link de inscrição<input name="officialUrl" type="url"></label>`;if(type==='servico')html+=`<label>Categoria<input name="category"></label><label>Contato público desejado<input name="publicContact"></label><label>Faixa de preço (opcional)<input name="price"></label>`;if(type==='fotografia')html=`<label>Arquivo de foto<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" id="photo-input"></label><div id="file-validation"></div><label>Autoria/crédito<input name="credit" required></label><label>Data aproximada<input name="approxDate" type="date"></label><label>Local<input name="place"></label><label>Contexto e legenda<textarea name="caption"></textarea></label><label class="check"><input name="autorizacao" type="checkbox" required> Tenho autorização para publicar esta imagem.</label><p class="notice">O arquivo original é enviado automaticamente para o acervo privado do Nexus. O acesso é controlado pela editoria. Tipos aceitos: JPEG, PNG, WebP. Máximo: 10 MB.</p>`;$('#dynamic-fields').innerHTML=html;if(type==='fotografia'){const fi=$('#photo-input');if(fi)fi.addEventListener('change',()=>{const v=validateFile(fi.files[0]);$('#file-validation').innerHTML=v.ok?'<small style="color:var(--accent)">✓ '+v.category+' — '+(fi.files[0].size/1024/1024).toFixed(1)+' MB</small>':'<small style="color:var(--danger)">✗ '+v.error+'</small>';});}};$('#submission-type').addEventListener('change',dynamic);dynamic();$('#submit-form').addEventListener('submit',async e=>{e.preventDefault();const btn=$('#submit-btn');btn.disabled=true;btn.textContent='Enviando...';const status=$('#upload-status');const data=Object.fromEntries(new FormData(e.target));try{if(data.type==='fotografia'&&data.photo&&data.photo.size>0){const file=data.photo;const v=validateFile(file);if(!v.ok){status.innerHTML='<p class="notice" style="color:var(--danger)">'+v.error+'</p>';btn.disabled=false;btn.textContent='Enviar para moderação';return;}status.innerHTML='<p class="notice">Enviando arquivo para o acervo...</p>';const up=await uploadToDrive(file,{type:'fotografia',sender_name:data.sender});if(!up.ok){status.innerHTML='<p class="notice" style="color:var(--danger)">Erro no upload: '+up.error+'</p>';btn.disabled=false;btn.textContent='Enviar para moderação';return;}status.innerHTML='<p class="notice">Arquivo recebido. Registrando submissão...</p>';const reg=await registerSubmission(up,{type:'fotografia',title:data.title||'',description:data.caption||'',sender:data.sender,email:data.email,connection:data.connection,legenda:data.caption||'',credito:data.credit||'',local:data.place||'',data:data.approxDate||'',autorizacao:true});if(!reg.ok){status.innerHTML='<p class="notice" style="color:var(--danger)">Erro ao registrar: '+reg.error+'</p>';btn.disabled=false;btn.textContent='Enviar para moderação';return;}location.hash='#/enviado';}else{data.id=crypto.randomUUID();data.status='em análise';data.receivedAt=new Date().toISOString();submitted=[data,...submitted];store.set('nexus-submissions',submitted);location.hash='#/enviado';}}catch(err){status.innerHTML='<p class="notice" style="color:var(--danger)">Erro: '+err.message+'</p>';btn.disabled=false;btn.textContent='Enviar para moderação';}});}
function governance(){
  const roleCards = roleDefinitions.map(role=>`<article class="story"><span class="tag">${safe(role.name)}</span><h3>${safe(role.access)}</h3><p>${safe(role.does)}</p></article>`).join('');
  shell(`<section class="page-head">${intro}<h1>Equipe e regras editoriais</h1><p>O Nexus não é um mural automático: toda publicação passa por critérios, responsabilidade e cuidado com quem enviou.</p></section><section class="split"><div class="feature"><div class="eyebrow">RESPONSÁVEL NA IMPLANTAÇÃO</div><h2>${safe(editorialTeam.lead.name)}</h2><p><b>${safe(editorialTeam.lead.role)}</b></p><p>${safe(editorialTeam.lead.scope)}</p></div><div class="source-box"><b>Regra de início</b><p>${safe(editorialTeam.note)}</p><small>Esta é a estrutura inicial do projeto; novas permissões só devem ser abertas após formação, convite e regras escritas.</small></div></section><section class="section-head"><div>${intro}<h2>Funções da futura equipe</h2><p>As funções abaixo são diferentes entre si: enviar não é revisar; revisar não é publicar.</p></div></section><section class="editorial-grid">${roleCards}</section><section class="prose"><h2>Como um envio deve circular</h2><ol><li>A pessoa ou organização envia uma proposta.</li><li>O material fica privado, em análise.</li><li>A editora-chefe verifica autoria, fonte, datas, créditos e autorização.</li><li>O envio pode ser publicado, devolvido para ajuste, recusado ou arquivado.</li><li>Só o conteúdo aprovado se torna público.</li></ol><h2>Limite técnico atual</h2><p>O formulário e o painel deste MVP ainda usam dados locais do navegador. Eles não recebem nem protegem submissões reais. Antes de abrir envios públicos, o Nexus precisa de login, banco de dados, regras de acesso e política de privacidade.</p></section>`, 'Equipe e regras');
}

function authentication(){
  const setupNotice = isSupabaseConfigured ? '' : '<p class="notice"><b>Integração pendente.</b> A configuração pública do Supabase ainda não foi adicionada ao deploy. Consulte o guia de implantação do repositório.</p>';
  shell(`<section class="page-head">${intro}<h1>Área da Editoria</h1><p>O acesso é individual, por link enviado ao e-mail autorizado. Entrar não cria permissão: o Nexus também verifica se a conta possui perfil editorial ativo.</p>${setupNotice}<form id="auth-form" class="submission"><label>E-mail editorial autorizado<input name="email" type="email" autocomplete="email" required></label><button class="button" ${isSupabaseConfigured ? '' : 'disabled'}>Enviar link de acesso</button></form><p class="notice">Não use senhas compartilhadas. A chave pública do aplicativo não concede poderes administrativos; as regras do banco validam cada operação.</p></section>`, 'Área da Editoria');
  $('#auth-form')?.addEventListener('submit', async event=>{
    event.preventDefault();
    const button = $('#auth-form button'); button.disabled = true;
    const { error } = await sendMagicLink(new FormData(event.currentTarget).get('email'));
    if (error) alert(`Não foi possível enviar o link: ${error.message}`);
    else alert('Link enviado. Abra-o neste mesmo navegador para concluir a entrada.');
    button.disabled = false;
  });
}

async function admin(){
  shell(`<section class="page-head">${intro}<h1>Área da Editoria</h1><p>Validando sessão e permissão editorial…</p></section>`, 'Área da Editoria');
  const access = await currentEditorialAccess();
  if (access.status === 'not-configured') return authentication();
  if (access.status === 'signed-out') return authentication();
  if (access.status !== 'authorized') {
    shell(`<section class="page-head">${intro}<h1>Acesso não autorizado</h1><p>Esta conta entrou no Supabase, mas não possui um perfil editorial ativo no Nexus. A liberação depende de cadastro administrativo, papel definido e regras de acesso no banco.</p><button id="logout" class="button ghost">Sair desta conta</button></section>`, 'Acesso não autorizado');
    $('#logout').addEventListener('click', async ()=>{ await signOut(); location.hash = '#/autenticacao'; });
    return;
  }
  const canManage = access.role === 'Editora-chefe';

  // Carregar fila de pendentes do Supabase
  let queueHtml = '<p class="empty">Carregando fila…</p>';
  if (canManage) {
    const result = await listPendingSubmissions();
    if (result.ok && result.data.length > 0) {
      queueHtml = result.data.map(s => {
        const asset = s.media_assets || {};
        const deriv = asset.derivative_status || 'pending';
        const hasDeriv = asset.public_derivative_url;
        return `<article class="story" style="border:1px solid var(--border);padding:1rem;margin:0.5rem 0;border-radius:6px;">
          <h3>${safe(s.title || 'Sem título')}</h3>
          <small>Tipo: ${safe(s.submission_type)} · Enviado por: ${safe(s.sender_name||'anônimo')} · ${new Date(s.created_at).toLocaleString('pt-BR')}</small>
          <p>${safe(s.description||'')}</p>
          <div style="margin-top:0.5rem">
            <span class="tag">Asset: ${safe(s.asset_id)}</span>
            <span class="tag">Status derivado: ${safe(deriv)}</span>
            ${hasDeriv ? `<img src="${asset.public_derivative_url}" style="max-width:200px;border-radius:4px;margin-top:0.5rem;display:block" alt="preview">` : ''}
          </div>
          <div style="margin-top:0.5rem;display:flex;gap:0.5rem;flex-wrap:wrap">
            <button class="button" data-action="approve" data-id="${s.id}" data-asset="${s.asset_id}" data-drive="${asset.provider_file_id||''}">Aprovar</button>
            <button class="button ghost" data-action="generate" data-asset="${s.asset_id}" data-drive="${asset.provider_file_id||''}">Gerar derivado</button>
            <button class="button ghost" data-action="publish" data-id="${s.id}" data-asset="${s.asset_id}">Publicar</button>
            <button class="button ghost" data-action="delete-deriv" data-asset="${s.asset_id}" data-drive="${asset.provider_file_id||''}">Apagar derivado</button>
            <button class="button ghost" data-action="regenerate" data-asset="${s.asset_id}" data-drive="${asset.provider_file_id||''}">Regenerar</button>
          </div>
        </article>`;
      }).join('');
    } else if (result.ok && result.data.length === 0) {
      queueHtml = '<p class="empty">Nenhuma submissão pendente.</p>';
    } else {
      queueHtml = `<p class="empty" style="color:var(--danger)">${safe(result.error)}</p>`;
    }
  } else {
    queueHtml = '<p>Seu papel não permite moderar envios.</p>';
  }

  const content = `<section class="admin-head">${intro}<h1>Painel Nexus</h1><p>Sessão validada para <b>${safe(access.role)}</b>. O papel vem do perfil editorial protegido no Supabase; ele não pode ser trocado pelo navegador.</p><button id="logout" class="button ghost">Sair desta conta</button></section><div class="admin-grid"><section><h2>Fila de moderação</h2><div id="admin-result" style="margin-bottom:1rem"></div>${queueHtml}</section><section><h2>Organizações e gestões</h2><p class="notice">A edição de entidades será habilitada quando as tabelas operacionais forem publicadas com permissões específicas.</p></section><section><h2>Registros públicos</h2><p><b>${allOpps().length}</b> oportunidades · <b>${sources.length}</b> fontes · <b>${posts.length}</b> conteúdos editoriais</p><a class="button ghost" href="#/fontes">Abrir fontes monitoradas</a></section></div>`;
  shell(content, 'Painel');
  $('#logout').addEventListener('click', async ()=>{ await signOut(); location.hash = '#/autenticacao'; });

  // Bind botões da fila
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const asset = btn.dataset.asset;
      const drive = btn.dataset.drive;
      const result = $('#admin-result');
      btn.disabled = true;
      btn.textContent = '...';
      try {
        if (action === 'approve') {
          const r = await approveSubmission(id);
          result.innerHTML = r.ok ? '<p class="notice" style="color:var(--accent)">✓ Aprovada. Clique em "Gerar derivado" para criar a versão pública.</p>' : '<p class="notice" style="color:var(--danger)">'+r.error+'</p>';
        } else if (action === 'generate') {
          result.innerHTML = '<p class="notice">Gerando versão otimizada…</p>';
          const r = await generateDerivative(asset, drive);
          result.innerHTML = r.ok ? '<p class="notice" style="color:var(--accent)">✓ Derivado gerado ('+((r.derivative_size||0)/1024).toFixed(0)+' KB). Recarregue para ver a imagem.</p>' : '<p class="notice" style="color:var(--danger)">'+r.error+'</p>';
        } else if (action === 'publish') {
          const r = await publishSubmission(id, asset);
          result.innerHTML = r.ok ? '<p class="notice" style="color:var(--accent)">✓ Publicada.</p>' : '<p class="notice" style="color:var(--danger)">'+r.error+'</p>';
        } else if (action === 'delete-deriv') {
          const r = await deleteDerivative(asset);
          result.innerHTML = r.ok ? '<p class="notice" style="color:var(--accent)">✓ Derivado apagado. O original continua no Drive.</p>' : '<p class="notice" style="color:var(--danger)">'+r.error+'</p>';
        } else if (action === 'regenerate') {
          result.innerHTML = '<p class="notice">Regenerando do original…</p>';
          const r = await regenerateDerivative(asset, drive);
          result.innerHTML = r.ok ? '<p class="notice" style="color:var(--accent)">✓ Derivado regenerado do original. Recarregue para ver.</p>' : '<p class="notice" style="color:var(--danger)">'+r.error+'</p>';
        }
      } catch (err) {
        result.innerHTML = '<p class="notice" style="color:var(--danger)">Erro: '+err.message+'</p>';
      }
      btn.disabled = false;
      // Restaurar texto do botão
      const labels = { approve:'Aprovar', generate:'Gerar derivado', publish:'Publicar', 'delete-deriv':'Apagar derivado', regenerate:'Regenerar' };
      btn.textContent = labels[action] || '...';
    });
  });
}
function photographs(){
  const content = `<section class="page-head">${intro}<h1>Fotografias de São Lázaro</h1><p>Uma seleção editorial de acontecimentos, espaços, centros acadêmicos e cotidiano universitário.</p></section>
  <section class="prose"><h2>Memória visual com curadoria</h2><p>O Nexus exibirá aqui somente fotografias públicas, aprovadas, creditadas e contextualizadas. O acervo completo e os originais não ficam nesta página nem no repositório público: serão preservados no acervo privado da editoria.</p><h2>Primeiras coleções previstas</h2><ul><li>Movimentos e ocupações de São Lázaro;</li><li>Centros acadêmicos e organização estudantil;</li><li>Bingos, encontros, cultura e eventos;</li><li>Espaços, cotidiano e transformações do campus.</li></ul><p class="notice"><b>Galeria em preparação.</b> Nenhuma fotografia foi publicada nesta versão inicial. O canal oficial de envio será divulgado quando o e-mail institucional do Nexus estiver criado. Enviar uma imagem não garante publicação.</p><p>Para a equipe editorial: as cópias públicas aprovadas ficam em <code>public/imagens/</code>; o procedimento e o catálogo estão documentados no repositório.</p></section>`;
  shell(content,'Fotografias');
}
function about(){shell(`<section class="page-head">${intro}<h1>Sobre o Nexus</h1><p>Uma infraestrutura editorial, comunitária e de utilidade pública para São Lázaro.</p></section><section class="prose"><h2>Princípios</h2><p><b>Democratização da informação.</b> Estar fora dos grupos certos não deveria impedir ninguém de descobrir uma oportunidade.</p><p><b>Curadoria, não promessa vazia de automação.</b> O Nexus diferencia fonte institucional, conteúdo enviado e produção editorial; mantém URL e data de verificação.</p><p><b>Memória com cuidado.</b> Fotografias entram por envio, autorização, moderação, crédito e contexto — não por coleta indiscriminada.</p><h2>Direção de arte inicial</h2><p>O sistema visual usa uma linguagem editorial de faixas, tipografia de alto contraste, textura gráfica de cartazes e formas orgânicas que evocam vegetação e circulação. É uma interpretação original: não reproduz logotipos, marcas ou fotos de terceiros.</p><h2>Privacidade e moderação</h2><p>O MVP coleta somente dados necessários ao fluxo demonstrado. Em produção, o formulário precisará de aviso de privacidade, retenção definida, controle de acesso, proteção anti-spam e armazenamento seguro. Serviços não são endossados automaticamente pelo Nexus.</p><h2>Arquitetura de implantação de custo zero</h2><p><b>Frontend:</b> esta aplicação estática em Vite, compatível com GitHub Pages. <b>Backend proposto:</b> Supabase free tier (PostgreSQL, Auth, Storage e políticas RLS), com migração possível via PostgreSQL. <b>Operação:</b> painel autenticado, contas individuais e backup exportável. Nenhum serviço foi contratado ou configurado nesta demonstração.</p></section>`, 'Sobre')}
async function authReturn(){
  shell(`<section class="page-head">${intro}<h1>Concluindo a autenticação…</h1><p>Validando sua sessão e autorização editorial com segurança.</p></section>`, 'Autenticação');
  const access = await currentEditorialAccess();
  history.replaceState(null, '', `${location.pathname}${location.search}#/admin`);
  if (access.status === 'authorized') return admin();
  if (access.status === 'not-authorized') return admin();
  return authentication();
}
function notFound(){shell(`<section class="page-head"><h1>Página não encontrada</h1><a class="button" href="#/">Voltar ao início</a></section>`,'Não encontrada')}
function route(){
  const r=location.hash.slice(1)||'/';
  const authParams=new URLSearchParams(r);
  const isAuthReturn=authParams.has('access_token')||authParams.has('refresh_token')||authParams.has('error')||authParams.get('type')==='invite';
  if(isAuthReturn) authReturn();
  else if(r==='/')home();else if(r==='/oportunidades')opportunitiesPage();else if(r.startsWith('/oportunidade/'))opportunity(r.split('/').pop());else if(r==='/agenda')generic('Agenda','Atividades de São Lázaro, com origem e status claramente indicados.',events);else if(r==='/revista')generic('Revista','Reportagens, guias, entrevistas e memória. Itens demonstrativos são identificados como tal.',posts.filter(x=>x.section==='Revista'));else if(r==='/comunidade')generic('Comunidade','Coletivos, projetos, produções e iniciativas de quem faz São Lázaro.',posts.filter(x=>x.section==='Comunidade'));else if(r==='/conquistas')generic('Conquistas','O que a comunidade realiza também merece circular.',posts.filter(x=>x.section==='Conquistas'));else if(r==='/servicos')generic('Serviços / Classificados','Trabalho e renda fazem parte da permanência. Conteúdo passa por moderação e não representa endosso do Nexus.',services);else if(r==='/fotografias')photographs();else if(r==='/fontes')sourcesPage();else if(r==='/enviar')send();else if(r==='/autenticacao')authentication();else if(r==='/governanca')governance();else if(r==='/enviado'){shell(`<section class="page-head"><div class="eyebrow">RECEBIDO</div><h1>Entrou na fila de moderação.</h1><p>O envio foi salvo localmente nesta demonstração. No produto publicado, a equipe poderá aprovar, pedir ajuste ou recusar, com registro das ações.</p><a class="button" href="#/">Voltar ao início</a></section>`,'Envio recebido')}else if(r==='/admin')admin();else if(r==='/sobre')about();else notFound();window.scrollTo({top:0});}
window.addEventListener('hashchange',route);route();

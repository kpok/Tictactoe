import { createAds } from './ads.js';
import { newGame, other, play, validGame } from './engine.js';
import { LANGUAGES, message, hasMessage, normalizeLanguage, languageFromPreferences, directionFor } from './i18n.js';
// Native v1 bundles offline play; online requires a separately deployed trusted API.
const nativeApp=window.Capacitor?.isNativePlatform?.()===true;
const $ = id => document.getElementById(id);
let language=languageFromPreferences(navigator.languages || [navigator.language]), mode='ai', difficulty='medium', sound=false, localGame=newGame(), game=localGame;
let scores={ai:{O:0,X:0},local:{O:0,X:0},online:{O:0,X:0}}, counted=false;
let session=null, room=null, onlineHealthy=true, busy=false, pollTimer, pollSequence=0, worker=null, generation=0, pendingId=0, aiUnavailable=false;
let toastTimer, audio, focusMode=false, nativeFocus=false;
const ads=createAds({native:nativeApp,invoke:(method,data)=>window.Capacitor.nativePromise('ThreefoldAds',method,data)});
let adsState={mode:'disabled',age:'',privacyOptions:false},adTransition=false,privacyOperation=false;
const makeRoundId=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
let roundId=makeRoundId();
const storageKey='threefold.v1';
const t=key=>message(language,key);
const richTextKeys=new Set(['headline','introBottom','howTitle']);
for(const item of LANGUAGES){const option=document.createElement('option');option.value=item.code;option.textContent=`${item.short} · ${item.name}`;option.lang=item.code;option.dir=item.direction||'ltr';$('language').append(option);}
try {
  const saved=JSON.parse(localStorage.getItem(storageKey));
  if(saved) {
    language=normalizeLanguage(saved.language)||language;mode=saved.mode==='local'?'local':'ai';
    difficulty=['easy','medium','hard'].includes(saved.difficulty)?saved.difficulty:'medium';sound=saved.sound===true;
    if(validGame(saved.game)){localGame=saved.game;if(typeof saved.roundId==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(saved.roundId))roundId=saved.roundId;}
    if(saved.scores && ['ai','local'].every(m=>['O','X'].every(p=>Number.isInteger(saved.scores[m]?.[p])&&saved.scores[m][p]>=0&&saved.scores[m][p]<1e7))) {scores.ai=saved.scores.ai;scores.local=saved.scores.local;}
    counted=!!(localGame.winner||localGame.draw);
  }
  const stored=JSON.parse(sessionStorage.getItem('threefold.room'));
  if(!nativeApp && stored && /^[A-Z2-9]{6}$/.test(stored.code) && /^[a-f0-9]{64}$/.test(stored.token) && ['O','X'].includes(stored.seat)) {session=stored;mode='online';}
} catch { /* Corrupt or inaccessible storage must not prevent play. */ }
if(nativeApp){
  document.querySelector('[data-mode="online"]').hidden=true;
  document.querySelector('.mode-tabs').classList.add('native-modes');
}
game=localGame;
function save() {
  try {localStorage.setItem(storageKey,JSON.stringify({language,mode:mode==='online'?'ai':mode,difficulty,sound,game:localGame,roundId,scores}));}
  catch { /* Storage is optional; the current game stays in memory. */ }
}
function saveSession() {try {session ? sessionStorage.setItem('threefold.room',JSON.stringify(session)):sessionStorage.removeItem('threefold.room');}catch{/* Optional persistence. */}}
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4000);}
function soundEffect(win=false) {
  if(!sound)return;
  try { audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const start=audio.currentTime;
    for(let i=0;i<(win?3:1);i++){const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type='sine';oscillator.frequency.value=(win?[440,554,660]:[330])[i];gain.gain.setValueAtTime(.035,start+i*.09);gain.gain.exponentialRampToValueAtTime(.001,start+i*.09+.17);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(start+i*.09);oscillator.stop(start+i*.09+.18);}
  }catch{/* Audio is optional. */}
}
function cancelAI(){generation++;if(worker){worker.terminate();worker=null;}pendingId++;}
function translate(){
  document.documentElement.lang=language;
  document.documentElement.dir=directionFor(language);
  document.documentElement.toggleAttribute('data-compact-type',!['pl','en'].includes(language));
  document.title=t('appTitle');
  document.querySelector('meta[name="description"]').content=t('description');
  for(const el of document.querySelectorAll('[data-i18n],[data-i18n-html]')){
    const key=el.dataset.i18n||el.dataset.i18nHtml;
    // Rich markup is restricted to three author-controlled catalog entries.
    if(richTextKeys.has(key))el.innerHTML=t(key);else el.textContent=t(key);
  }
  $('language').value=language;$('language').setAttribute('aria-label',t('languageLabel'));$('language').title=t('languageLabel');
  $('help').setAttribute('aria-label',t('help'));$('help').title=t('help');
  document.querySelectorAll('.close-dialog.icon-button').forEach(el=>el.setAttribute('aria-label',t('close')));
  $('board').setAttribute('aria-label',t('board'));document.querySelector('.game-area').setAttribute('aria-label',t('chooseGame'));document.querySelector('.mode-tabs').setAttribute('aria-label',t('mode'));
  $('difficulty').value=difficulty;
  $('ads-settings').hidden=!nativeApp;
  $('ads-age').value=adsState.age||'';
  $('ads-status').textContent=t(adsState.mode==='test'?'adsStatusTest':adsState.mode==='live'?'adsStatusLive':'adsStatusOff');
  $('ads-privacy-options').hidden=!adsState.privacyOptions;
  $('ads-age').disabled=!!adsState.privacyBusy;$('ads-save').disabled=!!adsState.privacyBusy;
  if(nativeApp)document.querySelector('#privacy-dialog [data-i18n=privacyBody]').textContent=t('adsNativePrivacy');
}
const markSVG=p=>p==='O'?'<svg class="mark" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="23"/></svg>':'<svg class="mark" viewBox="0 0 64 64" aria-hidden="true"><path d="M13 13L51 51M51 13L13 51"/></svg>';
function updateFullscreenButton(){
  const label=t(focusMode?'exitFullscreen':'fullscreen');
  $('fullscreen').setAttribute('aria-label',label);$('fullscreen').title=label;$('fullscreen').setAttribute('aria-pressed',String(focusMode));
}
function applyFocusMode(active){
  focusMode=active;document.body.classList.toggle('focus-mode',active);updateFullscreenButton();
}
async function toggleFullscreen(){
  if(focusMode){
    applyFocusMode(false);nativeFocus=false;
    if(document.fullscreenElement&&document.exitFullscreen)try{await document.exitFullscreen();}catch{/* The board focus view is already closed. */}
    $('fullscreen').focus({preventScroll:true});return;
  }
  applyFocusMode(true);
  // Keep an accessible board-only view even where native fullscreen is unavailable.
  if(document.documentElement.requestFullscreen)try{
    await document.documentElement.requestFullscreen();
    nativeFocus=!!document.fullscreenElement;
    if(!focusMode&&document.fullscreenElement)await document.exitFullscreen();
  }catch{/* Mobile Safari and embedded browsers can use the CSS fallback. */}
}
function render(){
  updateFullscreenButton();
  document.querySelectorAll('[data-mode]').forEach(el=>el.disabled=adTransition);
  $('difficulty').disabled=adTransition;$('reset-score').disabled=adTransition;$('clear-data').disabled=adTransition||privacyOperation||!!adsState.privacyBusy;$('ads-settings').disabled=adTransition;
  if(mode!=='online')game=localGame;
  const ended=!!(game.winner||game.draw), activeAI=mode==='ai'&&game.turn==='X'&&!ended;
  document.querySelectorAll('[data-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.mode===mode)));
  $('difficulty-label').hidden=mode!=='ai';$('online-manage').hidden=mode!=='online';
  $('mode-note').textContent=t(mode==='local'?'localNote':mode==='ai'?'aiNote':'onlineNote');
  $('o-label').textContent=mode==='ai'?t('you'):mode==='online'&&session?.seat==='O'?t('you'):mode==='online'?t('friend'):t('playerO');
  $('x-label').textContent=mode==='ai'?t('computer'):mode==='online'&&session?.seat==='X'?t('you'):mode==='online'?t('friend'):t('playerX');
  $('o-score').textContent=scores[mode].O;$('x-score').textContent=scores[mode].X;
  $('o-turn').classList.toggle('active',!ended&&game.turn==='O');$('x-turn').classList.toggle('active',!ended&&game.turn==='X');
  let status=ended?t('ended'):activeAI?t(aiUnavailable?'aiError':'thinking'):mode==='ai'?t('yourTurn'):`${t('turn')} ${game.turn}`;
  if(mode==='online')status=!session?t('connect'):!navigator.onLine?t('offline'):!onlineHealthy?t('reconnecting'):!room?t('reconnecting'):!room.joined?t('waiting'):busy?t('pending'):ended?t('ended'):game.turn===session.seat?t('yourTurn'):t('theirTurn');
  $('turn-status').textContent=status;$('turn-status').classList.toggle('x',game.turn==='X');
  const focusIndex=document.activeElement?.dataset?.index;
  const board=$('board');board.replaceChildren();
  for(let i=0;i<9;i++){
    const p=game.board[i],button=document.createElement('button');button.type='button';button.className='cell';button.dataset.index=String(i);button.dataset.mark=p||'';
    const oldest=p&&game.queues[p].length===3&&game.queues[p][0]===i;
    button.classList.toggle('oldest',!!oldest);button.classList.toggle('win',game.line.includes(i));
    button.setAttribute('aria-label',`${t('square')} ${i+1}: ${p||t('empty')}${oldest?`, ${t('fades')}`:''}`);
    button.disabled=adTransition||!!p||ended||activeAI||(mode==='online'&&(!session||!room?.joined||!onlineHealthy||busy||!navigator.onLine||game.turn!==session.seat));
    if(p){button.innerHTML=markSVG(p);const age=document.createElement('span');age.className='mark-age';age.textContent=String(game.queues[p].indexOf(i)+1);age.setAttribute('aria-hidden','true');button.append(age);}
    button.addEventListener('click',()=>move(i));board.append(button);
  }
  if(focusIndex!==undefined){const target=board.querySelector(`[data-index="${focusIndex}"]`);const next=target&&!target.disabled?target:board.querySelector('button:not(:disabled)');if(next)next.focus({preventScroll:true});}
  $('move-count').textContent=`${game.moves}/100 ${t('moves')}`;
  $('result').hidden=!ended;
  $('result-title').textContent=game.winner?mode==='ai'?(game.winner==='O'?t('youWon'):t('aiWon')):`${t('won')} ${game.winner}`:t('draw');
  $('result-detail').textContent=game.draw?t(game.draw==='repetition'?'repeat':'limit'):t('roundDetail');
  const hasVoted=mode==='online'&&!!room?.rematch[session?.seat];
  $('restart').querySelector('span').textContent=t(mode==='online'?(hasVoted?'waitRematch':'rematch'):'newRound');
  $('restart').disabled=adTransition||mode==='online'&&(!session||!room?.joined||!ended||hasVoted||busy||!onlineHealthy);
  if(mode==='online'&&ended&&room?.rematch[other(session?.seat||'O')])$('result-detail').textContent=t('rematchInvite');
  $('online-banner').hidden=mode!=='online'||!session;$('room-label').textContent=t('room');$('room-code').textContent=session?.code||'';
  $('leave-room').hidden=!session;
  $('connection-note').textContent=mode==='online'?t('onlineConnection'):t('offlineNote');
  if(nativeApp&&adsState.allowed&&ended)$('restart').querySelector('span').textContent=`${t('newRound')} · ${t('adsLoading').replace('…','')}`;
  if(adTransition)$('restart').querySelector('span').textContent=t('adsLoading');
  $('sound').textContent=sound?'♫':'♪';$('sound').setAttribute('aria-label',t(sound?'soundOn':'soundOff'));$('sound').setAttribute('aria-pressed',String(sound));$('sound').title=t(sound?'soundOn':'soundOff');
}
function finishRound(){
  if((game.winner||game.draw)&&!counted){counted=true;if(mode!=='online')ads.completeRound(roundId);if(game.winner)scores[mode][game.winner]++;soundEffect(true);}
  else if(!game.winner&&!game.draw)counted=false;
  if(mode!=='online')save();
}
function scheduleAI(){
  if(mode!=='ai'||localGame.turn!=='X'||localGame.winner||localGame.draw)return;
  cancelAI();const expected=generation,id=++pendingId;aiUnavailable=false;
  try{
    worker=new Worker(new URL('./ai-worker.js',import.meta.url),{type:'module'});
    worker.onerror=()=>{if(expected!==generation)return;worker?.terminate();worker=null;aiUnavailable=true;render();toast(t('aiError'));};
    worker.onmessage=({data})=>{if(expected!==generation||data.id!==id||mode!=='ai')return;worker.terminate();worker=null;
      if(data.error){aiUnavailable=true;render();toast(t('aiError'));return;}
      try{localGame=play(localGame,data.index);game=localGame;finishRound();soundEffect();render();}catch{aiUnavailable=true;render();}
    };
    worker.postMessage({id,game:localGame,difficulty});
  }catch{aiUnavailable=true;render();toast(t('aiError'));}
}
function move(index){
  if(adTransition)return;
  if(mode==='online'){sendRoomAction('moves',{index});return;}
  if(mode==='ai'&&localGame.turn==='X')return;
  try{localGame=play(localGame,index);game=localGame;soundEffect();finishRound();render();scheduleAI();}catch{/* Invalid input leaves state untouched. */}
}
async function localRestart(confirmActive=true){
  if(adTransition)return;
  if(confirmActive&&localGame.moves&&!localGame.winner&&!localGame.draw&&!window.confirm(t('resetConfirm')))return;
  if(nativeApp&&(localGame.winner||localGame.draw)){
    const previous=localGame,expected=generation;adTransition=true;render();
    try{await ads.betweenRounds(roundId);}catch{/* Ads must never prevent the next game. */}finally{adTransition=false;render();}
    if(previous!==localGame||expected!==generation)return;
  }
  cancelAI();roundId=makeRoundId();localGame=newGame(other(localGame.starter));game=localGame;counted=false;save();render();scheduleAI();
}
function setMode(next){
  if(adTransition)return;
  if(nativeApp&&next==='online')return;
  if(next===mode){if(next==='online'&&!session)$('online-dialog').showModal();return;}
  cancelAI();clearTimeout(pollTimer);generation++;busy=false;$('create-room').disabled=false;mode=next;aiUnavailable=false;counted=!!(localGame.winner||localGame.draw);
  if(next==='online'){game=room?.game||newGame();counted=false;if(session)poll();else $('online-dialog').showModal();}
  else{session=null;room=null;saveSession();const url=new URL(location.href);url.searchParams.delete('room');history.replaceState(null,'',url);roundId=makeRoundId();localGame=newGame();game=localGame;counted=false;save();scheduleAI();}
  render();
}
async function api(path,body,auth=session){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),7000);
  try{
    const response=await fetch(`./api/rooms${path}`,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(auth?{Authorization:`Bearer ${auth.token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:controller.signal});
    let data;try{data=await response.json();}catch{throw new Error('serviceUnavailable');}
    if(!response.ok)throw new Error(data.error||'networkError');return data;
  }finally{clearTimeout(timeout);}
}
function acceptRoom(next){
  if(room&&next.revision<room.revision)return;
  const oldMoves=room?.game.moves||0;room=next;game=room.game;onlineHealthy=true;
  if(game.moves>oldMoves)soundEffect();finishRound();render();
}
async function poll(){
  clearTimeout(pollTimer);if(mode!=='online'||!session)return;
  const expected=generation,auth=session,ticket=++pollSequence;
  try{const next=await api(`/${auth.code}`,undefined,auth);if(expected!==generation||session!==auth||ticket!==pollSequence)return;acceptRoom(next);}
  catch(error){if(expected!==generation||session!==auth||ticket!==pollSequence)return;onlineHealthy=false;render();
    if(['room_not_found','unauthorized'].includes(error.message)){toast(t(error.message));$('online-error').textContent=t(error.message);session=null;room=null;saveSession();render();return;}
  }
  if(expected===generation&&session===auth&&ticket===pollSequence)pollTimer=setTimeout(poll,onlineHealthy?1000:3000);
}
async function enterRoom(joinCode){
  if(nativeApp)return;
  if(busy)return;busy=true;$('online-error').textContent='';$('create-room').disabled=true;clearTimeout(pollTimer);const expected=++generation;
  try{
    const data=await api(joinCode?`/${joinCode}/join`:'',{},null);if(expected!==generation)return;
    session={code:data.code,token:data.token,seat:data.seat};saveSession();room=null;counted=false;scores.online={O:0,X:0};onlineHealthy=true;acceptRoom(data.room);$('online-dialog').close();
    const url=new URL(location.href);url.searchParams.set('room',session.code);history.replaceState(null,'',url);poll();
  }catch(error){if(expected===generation)$('online-error').textContent=t(hasMessage(error.message)?error.message:'networkError');}
  finally{if(expected===generation){busy=false;$('create-room').disabled=false;render();if(session)poll();}}
}
async function sendRoomAction(action,extra={}){
  if(busy||!session||!room||!onlineHealthy)return;
  const expected=generation,auth=session;busy=true;render();
  const body={...extra,revision:room.revision,requestId:crypto.randomUUID().replaceAll('-','')};
  try{
    let next;
    try{next=await api(`/${auth.code}/${action}`,body,auth);}
    catch(error){if(!(hasMessage(error.message))&&expected===generation)next=await api(`/${auth.code}/${action}`,body,auth);else throw error;}
    if(expected===generation&&session===auth)acceptRoom(next);
  }catch(error){if(expected===generation){toast(t(hasMessage(error.message)?error.message:'networkError'));}}
  finally{if(expected===generation){busy=false;render();poll();}}
}
document.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>setMode(el.dataset.mode)));
$('difficulty').addEventListener('change',()=>{if(adTransition)return;difficulty=$('difficulty').value;save();cancelAI();scheduleAI();render();});
$('restart').addEventListener('click',()=>mode==='online'?sendRoomAction('rematch'):localRestart());
$('reset-score').addEventListener('click',()=>{if(adTransition)return;if(confirm(t('scoreConfirm'))){scores[mode]={O:0,X:0};save();render();}});
$('language').addEventListener('change',()=>{language=normalizeLanguage($('language').value)||'en';translate();render();save();});
$('sound').addEventListener('click',()=>{sound=!sound;soundEffect();save();render();});
$('fullscreen').addEventListener('click',toggleFullscreen);
document.addEventListener('fullscreenchange',()=>{
  if(document.fullscreenElement){nativeFocus=true;return;}
  if(nativeFocus){nativeFocus=false;applyFocusMode(false);$('fullscreen').focus({preventScroll:true});}
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&focusMode&&!document.fullscreenElement){applyFocusMode(false);$('fullscreen').focus({preventScroll:true});}
});
$('help').addEventListener('click',()=>$('help-dialog').showModal());$('privacy').addEventListener('click',()=>$('privacy-dialog').showModal());
$('online-manage').addEventListener('click',()=>$('online-dialog').showModal());
for(const button of document.querySelectorAll('.close-dialog'))button.addEventListener('click',()=>button.closest('dialog').close());
$('create-room').addEventListener('click',()=>enterRoom());
$('join-form').addEventListener('submit',event=>{event.preventDefault();const code=$('join-code').value.trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code)){$('online-error').textContent=t('emptyCode');return;}enterRoom(code);});
$('leave-room').addEventListener('click',()=>{setMode('local');$('online-dialog').close();const url=new URL(location.href);url.searchParams.delete('room');history.replaceState(null,'',url);});
$('copy-link').addEventListener('click',async()=>{const url=new URL(location.href);url.searchParams.set('room',session.code);try{await navigator.clipboard.writeText(url.href);toast(t('copied'));}catch{toast(t('copyFallback'));}});
$('clear-data').addEventListener('click',()=>{if(adTransition||privacyOperation||adsState.privacyBusy)return;if(!confirm(t('clearConfirm')))return;ads.reset();adsState={mode:'disabled',age:'',privacyOptions:false};roundId=makeRoundId();cancelAI();generation++;clearTimeout(pollTimer);try{localStorage.removeItem(storageKey);sessionStorage.removeItem('threefold.room');}catch{/* Storage optional. */}busy=false;$('create-room').disabled=false;session=null;room=null;mode='ai';localGame=newGame();game=localGame;scores={ai:{O:0,X:0},local:{O:0,X:0},online:{O:0,X:0}};counted=false;sound=false;difficulty='medium';$('privacy-dialog').close();const url=new URL(location.href);url.searchParams.delete('room');history.replaceState(null,'',url);translate();render();toast(t('dataCleared'));});
window.addEventListener('online',()=>{if(mode==='online')poll();render();});window.addEventListener('offline',()=>{onlineHealthy=false;render();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&mode==='online')poll();});
async function refreshAdsState(){adsState=await ads.state();translate();render();}
$('ads-settings').addEventListener('click',async()=>{if(adTransition)return;await refreshAdsState();$('ads-dialog').showModal();});
$('ads-form').addEventListener('submit',async event=>{
  event.preventDefault();if(adTransition)return;
  const age=$('ads-age').value;if(!age)return;
  $('ads-save').disabled=true;
  try{await ads.age(age);$('ads-dialog').close();await refreshAdsState();}finally{$('ads-save').disabled=false;}
});
$('ads-privacy-options').addEventListener('click',async()=>{privacyOperation=true;render();$('ads-age').disabled=true;$('ads-save').disabled=true;$('ads-privacy-options').disabled=true;try{await ads.privacy();}finally{privacyOperation=false;await refreshAdsState();$('ads-privacy-options').disabled=false;}});
translate();render();
if(nativeApp)refreshAdsState().then(()=>{if(adsState.mode!=='disabled'&&!adsState.age)$('ads-dialog').showModal();});
const invite=new URL(location.href).searchParams.get('room');
if(!nativeApp&&invite&&/^[A-Z2-9]{6}$/.test(invite)&&(!session||session.code!==invite)){cancelAI();mode='online';$('join-code').value=invite;$('online-dialog').showModal();render();}
else if(mode==='online'&&session)poll();else scheduleAI();
if(!nativeApp&&'serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});

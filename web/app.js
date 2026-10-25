import { newGame, other, play, validGame } from './engine.js';
const $ = id => document.getElementById(id);
const EN = {
 tagline:'SMALL BOARD. BIG DIFFERENCE.',eyebrow:'TIC-TAC-TOE. WITH A TWIST.',headline:'Three marks.<br> <span>New possibilities.</span>',lead:'You know the rules. Now forget a permanent board. Place your fourth mark and your oldest disappears. Think one move ahead.',introBottom:'A little break.<br>One more rematch.',playNow:'MAKE YOUR NEXT MOVE',chooseGame:'Play your way',modeAi:'Computer',modeLocal:'Pass & play',modeOnline:'Online',difficulty:'Level',easy:'Relaxed',medium:'Clever',hard:'Challenging',roomOptions:'Room',copyLink:'Copy link',match:'MATCH',fadeHint:'Dashed border = this mark will disappear',newRound:'New round',resetScore:'Reset score',offlineNote:'No account. No rush. Local play works offline too.',howLabel:'A SIMPLE TWIST',howTitle:'Fewer marks.<br> More strategy.',rule1Title:'Three in a row',rule1:'Line up three of your marks horizontally, vertically or diagonally.',rule2Title:'The fourth changes everything',rule2:'Already have three? Your next move removes your oldest mark.',rule3Title:'Plan the disappearance',rule3:'Watch the marked square. Your defence will not stay there forever.',footer:'THREE MARKS ARE JUST THE BEGINNING.',privacy:'Privacy',helpTitle:'A small change. A different game.',helpBody:'O starts. Choose an empty square. Each player has up to 3 marks: on the next move, the oldest disappears before we check for a win. Occupied squares, including your fading mark, are unavailable. Three repetitions of the same position with the same mark order and turn, or 100 moves, mean a draw. The starting player alternates each round.',helpOnline:'Online: create a room and send a friend its link or code. There is no random matchmaking or chat. Both players must agree to a rematch.',gotIt:'Got it. Let’s play.',onlineTitle:'A friend. One code. Let’s play.',onlineBody:'Create a private room or enter your friend’s code. Rooms expire after inactivity and may disappear when the server restarts.',createRoom:'Create room ↗',or:'OR JOIN A FRIEND',roomCode:'Room code',join:'Join',leaveRoom:'Leave room on this device',privacyBody:'No ads, analytics or accounts. Settings, your local game and scores stay in this browser. Online, the server keeps room state and random player tokens in memory. Your session token stays in this browser tab. Hosting may process IP addresses to serve and secure connections. Never share your session token. The room code/link lets a friend claim the open seat. Clearing data affects this browser; server rooms expire automatically.',clearData:'Clear local data'
};
const D = {
 pl:{newRound:'Nowa runda',you:'Ty',computer:'Komputer',playerO:'Gracz O',playerX:'Gracz X',friend:'Znajomy',localNote:'Dwie osoby · jeden ekran',aiNote:'Ty grasz kółkiem',onlineNote:'Prywatny pokój · bez konta',room:'POKÓJ',turn:'Ruch gracza',yourTurn:'Twój ruch',theirTurn:'Ruch znajomego',thinking:'Komputer myśli…',waiting:'Czekamy na znajomego…',connect:'Utwórz pokój lub dołącz do znajomego',reconnecting:'Łączę ponownie…',offline:'Brak sieci. Lokalnie nadal możesz grać.',won:'Wygrywa',youWon:'Wygrywasz!',aiWon:'Komputer wygrywa',draw:'Remis',repeat:'Pozycja powtórzyła się trzy razy.',limit:'Limit 100 ruchów. Czas na rewanż!',ended:'Runda zakończona',rematch:'Chcę rewanż',waitRematch:'Czekamy na zgodę…',rematchInvite:'Znajomy chce rewanż',roundDetail:'Trzy w linii. Dobra robota!',moves:'ruchów',square:'Pole',empty:'puste',fades:'najstarszy, zniknie przy następnym ruchu',copied:'Link skopiowany',copyFallback:'Skopiuj adres z paska lub przekaż kod pokoju.',savedError:'Nie można zapisać danych. Gra nadal działa.',networkError:'Nie udało się połączyć. Spróbuj ponownie.',room_not_found:'Pokój nie istnieje lub wygasł. Utwórz nowy.',room_full:'Pokój jest już pełny.',unauthorized:'Sesja pokoju wygasła. Utwórz nowy pokój.',rate_limited:'Za dużo żądań. Odczekaj chwilę.',rooms_full:'Serwer jest pełny. Spróbuj później.',stale_revision:'Plansza się zmieniła. Odświeżam pozycję.',not_your_turn:'Teraz ruch przeciwnika.',illegal_move:'Ten ruch jest niedostępny.',waiting_for_opponent:'Poczekaj, aż dołączy znajomy.',game_not_finished:'Najpierw dokończ rundę.',already_requested:'Twoja zgoda na rewanż została zapisana.',resetConfirm:'Rozpocząć nową rundę? Obecna partia zostanie zakończona.',scoreConfirm:'Wyzerować wyniki tego trybu?',clearConfirm:'Usunąć lokalną partię, ustawienia i wyniki?',dataCleared:'Lokalne dane usunięte.',soundOn:'Wyłącz dźwięk',soundOff:'Włącz dźwięk',help:'Zasady gry',close:'Zamknij',board:'Plansza 3 na 3',mode:'Tryb gry',onlineConnection:'Pokój online · odświeżanie co sekundę',serviceUnavailable:'Tryb online wymaga serwera Threefold. Na tej stronie możesz grać lokalnie lub z komputerem.',pending:'Wysyłam ruch…',emptyCode:'Wpisz sześcioznakowy kod pokoju.',reset:'Nowa runda',aiError:'Komputer jest niedostępny. Wybierz grę na zmianę.',install:'Gra jest gotowa do działania offline.'},
 en:{newRound:'New round',you:'You',computer:'Computer',playerO:'Player O',playerX:'Player X',friend:'Friend',localNote:'Two players · one screen',aiNote:'You play as O',onlineNote:'Private room · no account',room:'ROOM',turn:'Player to move:',yourTurn:'Your move',theirTurn:'Your friend’s move',thinking:'Computer is thinking…',waiting:'Waiting for your friend…',connect:'Create a room or join a friend',reconnecting:'Reconnecting…',offline:'You’re offline. Local games still work.',won:'Winner:',youWon:'You win!',aiWon:'Computer wins',draw:'Draw',repeat:'The same position occurred three times.',limit:'100 moves. Time for a rematch!',ended:'Round finished',rematch:'Play again',waitRematch:'Waiting for agreement…',rematchInvite:'Your friend wants a rematch',roundDetail:'Three in a row. Well played!',moves:'moves',square:'Square',empty:'empty',fades:'oldest, disappears on your next move',copied:'Link copied',copyFallback:'Copy the address bar or share the room code.',savedError:'Storage unavailable. You can still play.',networkError:'Could not connect. Please try again.',room_not_found:'Room not found or expired. Create a new one.',room_full:'This room is already full.',unauthorized:'Room session expired. Create a new room.',rate_limited:'Too many requests. Please wait a moment.',rooms_full:'Server is full. Try again later.',stale_revision:'The board changed. Refreshing the position.',not_your_turn:'It is your opponent’s turn.',illegal_move:'That move is unavailable.',waiting_for_opponent:'Wait for your friend to join.',game_not_finished:'Finish the current round first.',already_requested:'Your rematch vote is saved.',resetConfirm:'Start a new round? This will end the current game.',scoreConfirm:'Reset scores for this mode?',clearConfirm:'Remove local game, settings and scores?',dataCleared:'Local data cleared.',soundOn:'Mute sound',soundOff:'Enable sound',help:'How to play',close:'Close',board:'3 by 3 board',mode:'Game mode',onlineConnection:'Online room · updates every second',serviceUnavailable:'Online play needs a Threefold server. You can play locally or against the computer here.',pending:'Sending move…',emptyCode:'Enter a six-character room code.',reset:'New round',aiError:'Computer unavailable. Please select pass & play.',install:'Ready for offline play.'}
};
let language='pl', mode='ai', difficulty='medium', sound=false, localGame=newGame(), game=localGame;
let scores={ai:{O:0,X:0},local:{O:0,X:0},online:{O:0,X:0}}, counted=false;
let session=null, room=null, onlineHealthy=true, busy=false, pollTimer, pollSequence=0, worker=null, generation=0, pendingId=0, aiUnavailable=false;
let toastTimer, audio;
const storageKey='threefold.v1';
const t=key=>D[language][key] || key;
const staticPL=new Map([...document.querySelectorAll('[data-i18n],[data-i18n-html]')].map(el=>[el,el.innerHTML]));
try {
  const saved=JSON.parse(localStorage.getItem(storageKey));
  if(saved) {
    language=saved.language==='en'?'en':'pl';mode=saved.mode==='local'?'local':'ai';
    difficulty=['easy','medium','hard'].includes(saved.difficulty)?saved.difficulty:'medium';sound=saved.sound===true;
    if(validGame(saved.game)) localGame=saved.game;
    if(saved.scores && ['ai','local'].every(m=>['O','X'].every(p=>Number.isInteger(saved.scores[m]?.[p])&&saved.scores[m][p]>=0&&saved.scores[m][p]<1e7))) {scores.ai=saved.scores.ai;scores.local=saved.scores.local;}
    counted=!!(localGame.winner||localGame.draw);
  }
  const stored=JSON.parse(sessionStorage.getItem('threefold.room'));
  if(stored && /^[A-Z2-9]{6}$/.test(stored.code) && /^[a-f0-9]{64}$/.test(stored.token) && ['O','X'].includes(stored.seat)) {session=stored;mode='online';}
} catch { /* Corrupt or inaccessible storage must not prevent play. */ }
game=localGame;
function save() {
  try {localStorage.setItem(storageKey,JSON.stringify({language,mode:mode==='online'?'ai':mode,difficulty,sound,game:localGame,scores}));}
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
  for(const [el,pl] of staticPL){const key=el.dataset.i18n||el.dataset.i18nHtml;if(language==='pl')el.innerHTML=pl;else if(EN[key])el.innerHTML=EN[key];}
  $('language').textContent=language==='pl'?'EN':'PL';$('language').setAttribute('aria-label',language==='pl'?'Switch to English':'Przełącz na polski');
  $('help').setAttribute('aria-label',t('help'));$('help').title=t('help');
  document.querySelectorAll('.close-dialog.icon-button').forEach(el=>el.setAttribute('aria-label',t('close')));
  $('board').setAttribute('aria-label',t('board'));document.querySelector('.mode-tabs').setAttribute('aria-label',t('mode'));
  $('difficulty').value=difficulty;
}
const markSVG=p=>p==='O'?'<svg class="mark" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="23"/></svg>':'<svg class="mark" viewBox="0 0 64 64" aria-hidden="true"><path d="M13 13L51 51M51 13L13 51"/></svg>';
function render(){
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
    button.disabled=!!p||ended||activeAI||(mode==='online'&&(!session||!room?.joined||!onlineHealthy||busy||!navigator.onLine||game.turn!==session.seat));
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
  $('restart').disabled=mode==='online'&&(!session||!room?.joined||!ended||hasVoted||busy||!onlineHealthy);
  if(mode==='online'&&ended&&room?.rematch[other(session?.seat||'O')])$('result-detail').textContent=t('rematchInvite');
  $('online-banner').hidden=mode!=='online'||!session;$('room-label').textContent=t('room');$('room-code').textContent=session?.code||'';
  $('leave-room').hidden=!session;
  $('connection-note').textContent=mode==='online'?t('onlineConnection'):(language==='pl'?staticPL.get($('connection-note')):EN.offlineNote);
  $('sound').textContent=sound?'♫':'♪';$('sound').setAttribute('aria-label',t(sound?'soundOn':'soundOff'));$('sound').setAttribute('aria-pressed',String(sound));$('sound').title=t(sound?'soundOn':'soundOff');
}
function finishRound(){
  if((game.winner||game.draw)&&!counted){counted=true;if(game.winner)scores[mode][game.winner]++;soundEffect(true);}
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
  if(mode==='online'){sendRoomAction('moves',{index});return;}
  if(mode==='ai'&&localGame.turn==='X')return;
  try{localGame=play(localGame,index);game=localGame;soundEffect();finishRound();render();scheduleAI();}catch{/* Invalid input leaves state untouched. */}
}
function localRestart(confirmActive=true){
  if(confirmActive&&localGame.moves&&!localGame.winner&&!localGame.draw&&!window.confirm(t('resetConfirm')))return;
  cancelAI();localGame=newGame(other(localGame.starter));game=localGame;counted=false;save();render();scheduleAI();
}
function setMode(next){
  if(next===mode){if(next==='online'&&!session)$('online-dialog').showModal();return;}
  cancelAI();clearTimeout(pollTimer);generation++;busy=false;$('create-room').disabled=false;mode=next;aiUnavailable=false;counted=!!(localGame.winner||localGame.draw);
  if(next==='online'){game=room?.game||newGame();counted=false;if(session)poll();else $('online-dialog').showModal();}
  else{session=null;room=null;saveSession();const url=new URL(location.href);url.searchParams.delete('room');history.replaceState(null,'',url);localGame=newGame();game=localGame;counted=false;save();scheduleAI();}
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
  if(busy)return;busy=true;$('online-error').textContent='';$('create-room').disabled=true;clearTimeout(pollTimer);const expected=++generation;
  try{
    const data=await api(joinCode?`/${joinCode}/join`:'',{},null);if(expected!==generation)return;
    session={code:data.code,token:data.token,seat:data.seat};saveSession();room=null;counted=false;scores.online={O:0,X:0};onlineHealthy=true;acceptRoom(data.room);$('online-dialog').close();
    const url=new URL(location.href);url.searchParams.set('room',session.code);history.replaceState(null,'',url);poll();
  }catch(error){if(expected===generation)$('online-error').textContent=t(error.message in D[language]?error.message:'networkError');}
  finally{if(expected===generation){busy=false;$('create-room').disabled=false;render();if(session)poll();}}
}
async function sendRoomAction(action,extra={}){
  if(busy||!session||!room||!onlineHealthy)return;
  const expected=generation,auth=session;busy=true;render();
  const body={...extra,revision:room.revision,requestId:crypto.randomUUID().replaceAll('-','')};
  try{
    let next;
    try{next=await api(`/${auth.code}/${action}`,body,auth);}
    catch(error){if(!(error.message in D[language])&&expected===generation)next=await api(`/${auth.code}/${action}`,body,auth);else throw error;}
    if(expected===generation&&session===auth)acceptRoom(next);
  }catch(error){if(expected===generation){toast(t(error.message in D[language]?error.message:'networkError'));}}
  finally{if(expected===generation){busy=false;render();poll();}}
}
document.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>setMode(el.dataset.mode)));
$('difficulty').addEventListener('change',()=>{difficulty=$('difficulty').value;save();cancelAI();scheduleAI();render();});
$('restart').addEventListener('click',()=>mode==='online'?sendRoomAction('rematch'):localRestart());
$('reset-score').addEventListener('click',()=>{if(confirm(t('scoreConfirm'))){scores[mode]={O:0,X:0};save();render();}});
$('language').addEventListener('click',()=>{language=language==='pl'?'en':'pl';translate();render();save();});
$('sound').addEventListener('click',()=>{sound=!sound;soundEffect();save();render();});
$('help').addEventListener('click',()=>$('help-dialog').showModal());$('privacy').addEventListener('click',()=>$('privacy-dialog').showModal());
$('online-manage').addEventListener('click',()=>$('online-dialog').showModal());
for(const button of document.querySelectorAll('.close-dialog'))button.addEventListener('click',()=>button.closest('dialog').close());
$('create-room').addEventListener('click',()=>enterRoom());
$('join-form').addEventListener('submit',event=>{event.preventDefault();const code=$('join-code').value.trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code)){$('online-error').textContent=t('emptyCode');return;}enterRoom(code);});
$('leave-room').addEventListener('click',()=>{setMode('local');$('online-dialog').close();const url=new URL(location.href);url.searchParams.delete('room');history.replaceState(null,'',url);});
$('copy-link').addEventListener('click',async()=>{const url=new URL(location.href);url.searchParams.set('room',session.code);try{await navigator.clipboard.writeText(url.href);toast(t('copied'));}catch{toast(t('copyFallback'));}});
$('clear-data').addEventListener('click',()=>{if(!confirm(t('clearConfirm')))return;cancelAI();generation++;clearTimeout(pollTimer);try{localStorage.removeItem(storageKey);sessionStorage.removeItem('threefold.room');}catch{/* Storage optional. */}busy=false;$('create-room').disabled=false;session=null;room=null;mode='ai';localGame=newGame();game=localGame;scores={ai:{O:0,X:0},local:{O:0,X:0},online:{O:0,X:0}};counted=false;sound=false;difficulty='medium';$('privacy-dialog').close();const url=new URL(location.href);url.searchParams.delete('room');history.replaceState(null,'',url);translate();render();toast(t('dataCleared'));});
window.addEventListener('online',()=>{if(mode==='online')poll();render();});window.addEventListener('offline',()=>{onlineHealthy=false;render();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&mode==='online')poll();});
translate();render();
const invite=new URL(location.href).searchParams.get('room');
if(invite&&/^[A-Z2-9]{6}$/.test(invite)&&(!session||session.code!==invite)){cancelAI();mode='online';$('join-code').value=invite;$('online-dialog').showModal();render();}
else if(mode==='online'&&session)poll();else scheduleAI();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});

// Live register simulator (#simulator section): spawns products/containers on virtual
// conveyors, runs the actuator pick/place state machine, and draws the canvas each frame.
export function initSimulator(){
var root=document.getElementById('simulator');
if(!root) return;
function q(sel){ return root.querySelector(sel); }

var canvas=q('#sim-canvas'), ctx=canvas.getContext('2d');
var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- geometry (virtual millimetres along each belt) ---------- */
var BELT_LEN=1000;
var CAM_X=190, LS_X=150;
var PICK_X0=430, PICK_X1=520, PICK_EXT1=590, PICK_MID=475;
var PLACE_X0=430, PLACE_X1=520, PLACE_EXT1=590;
var DEL_X0=900, DEL_X1=1000;
var MIN_GAP_PRODUCT=70, DUP_TOLERANCE=15;
var MAX_ON_BELT_P=7, MAX_ON_BELT_C=3;

/* ---------- theme tokens, re-read on theme change ---------- */
var THEME={};
function readTheme(){
  var cs=getComputedStyle(document.documentElement);
  function v(n){ return cs.getPropertyValue(n).trim(); }
  THEME={
    surface2:v('--surface-2'), surface3:v('--surface-3'),
    line:v('--line'), lineSoft:v('--line-soft'),
    text:v('--text'), text2:v('--text-2'), textDim:v('--text-dim'),
    accent:v('--accent'), accent2:v('--accent-2'), accentInk:v('--accent-ink'),
    amber:v('--amber'), pink:v('--pink'), blue:v('--blue'),
    ok:v('--ok'), warn:v('--warn'), err:v('--err'),
    mono:(v('--f-mono')||'monospace')
  };
}
readTheme();
new MutationObserver(readTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
var darkMQ=window.matchMedia('(prefers-color-scheme: dark)');
if(darkMQ.addEventListener) darkMQ.addEventListener('change',readTheme); else if(darkMQ.addListener) darkMQ.addListener(readTheme);

function colorToken(name){ return name==='red'?THEME.err:(name==='blue'?THEME.blue:THEME.ok); }

/* ---------- DOM refs ---------- */
var els={
  run:q('#sim-btn-run'), step:q('#sim-btn-step'), reset:q('#sim-btn-reset'),
  speedP:q('#sim-speed-product'), speedC:q('#sim-speed-container'), arrival:q('#sim-arrival'),
  speedPVal:q('#sim-speed-product-val'), speedCVal:q('#sim-speed-container-val'), arrivalVal:q('#sim-arrival-val'),
  gapBtn:q('#sim-btn-gap'), dupBtn:q('#sim-btn-dup'),
  stratBtns:Array.prototype.slice.call(root.querySelectorAll('#sim-strategy-group .pill')),
  deleteSel:q('#sim-delete-select'), deleteBtn:q('#sim-btn-delete'),
  regBody:q('#sim-register-body'), monList:q('#sim-monitor-list'),
  actuatorStatus:q('#sim-actuator-status'), clock:q('#sim-clock'),
  cReg:q('#sim-c-reg'), cPick:q('#sim-c-pick'), cPlace:q('#sim-c-place'), cDel:q('#sim-c-del'),
  cCreg:q('#sim-c-creg'), cCfill:q('#sim-c-cfill')
};

/* ---------- simulation state ---------- */
var COLORS=['red','blue','green'], SHAPES=['circle','square','triangle'];
var lastCamFlash=-10, lastLsFlash=-10;

function rnd(a,b){ return a+Math.random()*(b-a); }
function pickOne(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function freshState(){
  return {
    t:0, running:true, strategy:'position',
    spawnTimerP:0.6, spawnTimerC:1.6, forceGapNext:0,
    nextId:1, nextReq:100, insertSeq:1,
    products:[], containers:[], placedProducts:[], monitor:[],
    counters:{reg:0,pick:0,place:0,del:0,creg:0,cfill:0},
    actuator:{phase:'searching', timer:0, held:null, targetContainer:null, x:PICK_MID, statusText:'searching picking zone'}
  };
}
var S=freshState();

function seedInitial(){
  S.products.push({id:'P'+(S.nextId++), x:250, prevX:250, color:'blue', shape:'circle', state:'registered',
    until:0, minGapViolated:false, blocked:false, assignedZone:null, assignedFO:'FoSensorCamera_1', stateSince:-5, dupFlashUntil:0, removeAt:0});
  S.products.push({id:'P'+(S.nextId++), x:470, prevX:470, color:'red', shape:'triangle', state:'registered',
    until:0, minGapViolated:false, blocked:false, assignedZone:null, assignedFO:'FoSensorCamera_1', stateSince:-5, dupFlashUntil:0, removeAt:0});
  S.containers.push({id:'C'+(S.nextId++), x:460, prevX:460, state:'registered', until:0, blocked:false, assignedZone:null,
    assignedFO:'FoSensorLightSwitch_1', pockets:[null,null,null,null], full:false, insertSeq:S.insertSeq++, stateSince:-5, removeAt:0});
  S.counters.reg=2; S.counters.creg=1;
}
seedInitial();

/* ---------- spawning & detection ---------- */
function spawnProduct(){
  var alive=S.products.filter(function(p){ return p.state!=='deleted'; }).length;
  if(alive>=MAX_ON_BELT_P){ S.spawnTimerP=0.3; return; }
  var gapForced=S.forceGapNext>0;
  S.products.push({id:'P'+(S.nextId++), x:0, prevX:0, color:pickOne(COLORS), shape:pickOne(SHAPES), state:'moving',
    until:0, minGapViolated:false, blocked:false, assignedZone:null, assignedFO:'FoSource_Product', stateSince:S.t, dupFlashUntil:0, removeAt:0});
  var base=+els.arrival.value;
  S.spawnTimerP = gapForced ? 0.18 : rnd(base*0.65, base*1.35);
  if(gapForced) S.forceGapNext--;
}
function spawnContainer(){
  if(S.containers.length>=MAX_ON_BELT_C){ S.spawnTimerC=0.4; return; }
  S.containers.push({id:'C'+(S.nextId++), x:0, prevX:0, state:'moving', until:0, blocked:false, assignedZone:null,
    assignedFO:'FoSource_Container', pockets:[null,null,null,null], full:false, insertSeq:0, stateSince:S.t, removeAt:0});
  S.spawnTimerC=rnd(2.6,3.8);
}

function addMonitor(fo,reqText,respText,rejected){
  S.monitor.push({id:S.nextReq++, fo:fo, req:reqText, resp:respText, rejected:!!rejected});
  if(S.monitor.length>60) S.monitor.shift();
}

function detectProduct(p){
  p.state='detected'; p.until=S.t+0.3; p.stateSince=S.t; p.assignedFO='FoSensorCamera_1';
  lastCamFlash=S.t;
  addMonitor('FoSensorCamera_1','detectObject('+p.color+' '+p.shape+') @ x='+Math.round(p.x)+'mm','ref. matched → '+p.id+' accepted');
  var neighbour=null, best=1e9;
  for(var i=0;i<S.products.length;i++){
    var o=S.products[i];
    if(o===p || o.state==='moving' || o.state==='deleted') continue;
    var d=Math.abs(o.x-p.x);
    if(d<best){ best=d; neighbour=o; }
  }
  if(neighbour && best<MIN_GAP_PRODUCT){ p.minGapViolated=true; neighbour.minGapViolated=true; }
  S.counters.reg++;
}
function detectContainer(c){
  c.state='detected'; c.until=S.t+0.3; c.stateSince=S.t; c.assignedFO='FoSensorLightSwitch_1'; c.insertSeq=S.insertSeq++;
  lastLsFlash=S.t;
  addMonitor('FoSensorLightSwitch_1','detectObject(container) @ x='+Math.round(c.x)+'mm','ref. matched → '+c.id+' accepted');
  S.counters.creg++;
}

function forceDuplicate(){
  var cand=null;
  for(var i=S.products.length-1;i>=0;i--){
    var p=S.products[i];
    if(p.state==='detected'||p.state==='prioritised'||p.state==='registered'){ cand=p; break; }
  }
  if(!cand){ addMonitor('FoSensorCamera_1','duplicate trigger','no eligible object on belt',true); return; }
  cand.dupFlashUntil=S.t+1.4;
  addMonitor('FoSensorCamera_1','detectObject('+cand.color+' '+cand.shape+') @ x≈'+Math.round(cand.x)+'mm (2nd image)','Δ<tolerance('+DUP_TOLERANCE+'mm) → duplicate of '+cand.id+', discarded',true);
}
function forceGap(){
  S.forceGapNext=2;
  addMonitor('sim control','arm next 2 spawns < minProductGap ('+MIN_GAP_PRODUCT+'mm)','armed');
}

/* ---------- actuator picking strategies ---------- */
function pickStrategyCandidate(){
  var zone=S.products.filter(function(p){
    return p.state==='registered' && !p.blocked && !p.minGapViolated && p.x>=PICK_X0 && p.x<=PICK_X1;
  });
  if(!zone.length) return null;
  if(S.strategy==='nearest'){
    zone.sort(function(a,b){ return Math.abs(a.x-PICK_MID)-Math.abs(b.x-PICK_MID); });
    return zone[0];
  }
  if(S.strategy==='characteristic'){
    var blues=zone.filter(function(p){ return p.color==='blue'; });
    if(!blues.length) return null;
    blues.sort(function(a,b){ return b.x-a.x; });
    return blues[0];
  }
  zone.sort(function(a,b){ return b.x-a.x; });
  return zone[0];
}

function updateActuator(dt){
  var A=S.actuator;
  if(A.timer>0) A.timer-=dt;
  var targetX = (A.phase==='seekContainer'||A.phase==='placeWait') ? (PLACE_X0+(PLACE_X1-PLACE_X0)/2) : PICK_MID;
  A.x += (targetX-A.x)*0.06;
  switch(A.phase){
    case 'searching':
      A.statusText='searching picking zone';
      var cand=pickStrategyCandidate();
      if(cand){
        cand.blocked=true; cand.state='reserved'; cand.stateSince=S.t;
        A.held=cand; A.phase='pickWait'; A.timer=0.55;
        addMonitor('FoActuatorKinematic_1','object found @ x='+Math.round(cand.x)+'mm ('+cand.color+' '+cand.shape+')','reserved '+cand.id+' · tracking via MC_TrackConveyorBelt');
      }
      break;
    case 'pickWait':
      A.statusText='object found · tracking & picking '+(A.held?A.held.id:'');
      if(A.timer<=0 && A.held){
        var idx=S.products.indexOf(A.held);
        if(idx>-1) S.products.splice(idx,1);
        A.held.state='picked'; A.held.assignedFO='FoActuatorKinematic_1'; A.held.stateSince=S.t;
        S.counters.pick++;
        addMonitor('FoActuatorKinematic_1','objectPicked('+A.held.id+')','pickData valid → searching placing zone');
        A.phase='seekContainer'; A.timer=0.35;
      }
      break;
    case 'seekContainer':
      A.statusText='picked '+(A.held?A.held.id:'')+' · seeking place-container';
      var c=null;
      for(var i=0;i<S.containers.length;i++){
        var cc=S.containers[i];
        if(!cc.full && !cc.blocked && cc.state!=='moving' && cc.x>=PLACE_X0 && cc.x<=PLACE_X1){ c=cc; break; }
      }
      if(c){ c.blocked=true; A.targetContainer=c; A.phase='placeWait'; A.timer=0.5;
        addMonitor('FoActuatorKinematic_1','container found ('+c.id+')','placeContainerData valid');
      }
      break;
    case 'placeWait':
      A.statusText='placing '+(A.held?A.held.id:'')+' into '+(A.targetContainer?A.targetContainer.id:'');
      if(A.timer<=0 && A.held && A.targetContainer){
        var cont=A.targetContainer;
        var pocket=cont.pockets.indexOf(null);
        cont.pockets[pocket]={color:A.held.color, shape:A.held.shape};
        S.placedProducts.push({id:A.held.id, color:A.held.color, shape:A.held.shape, containerId:cont.id, pocket:pocket, assignedFO:'FoActuatorKinematic_1', stateSince:S.t});
        S.counters.place++;
        cont.blocked=false;
        if(cont.pockets.every(function(x){ return x!==null; })){ cont.full=true; S.counters.cfill++; }
        addMonitor('FoActuatorKinematic_1','objectPlaced('+A.held.id+' → '+cont.id+' pocket '+(pocket+1)+')','placed · pocket '+(pocket+1)+'/4');
        A.held=null; A.targetContainer=null; A.phase='searching'; A.timer=0;
      }
      break;
  }
}

/* ---------- deletion ---------- */
function recordProductDeletion(p,mode){
  S.counters.del++;
  addMonitor(mode==='auto'?'FoSinkProduct_1':'FoSinkProduct_1 (manual)', 'deleteObject('+p.id+')', mode==='auto'?'deleted — entered deletion zone':'deleted — manual trigger, by ID');
}
function recordContainerDeletion(c,mode){
  var cascaded=0;
  S.placedProducts=S.placedProducts.filter(function(pp){ if(pp.containerId===c.id){ cascaded++; return false; } return true; });
  S.counters.del+=cascaded;
  addMonitor(mode==='auto'?'FoSinkContainer_1':'FoSinkContainer_1 (manual)', 'deleteObject('+c.id+')',
    'deleted'+(cascaded?' — cascaded '+cascaded+' pocket product(s)':(mode==='auto'?' — entered deletion zone':' — manual trigger, by ID')));
  if(S.actuator.targetContainer===c){ S.actuator.targetContainer=null; S.actuator.phase='seekContainer'; S.actuator.timer=0; }
}

/* ---------- main update ---------- */
function update(dt){
  S.t+=dt;
  var beltP=+els.speedP.value, beltC=+els.speedC.value;
  var i;
  for(i=0;i<S.products.length;i++){
    var p=S.products[i];
    if(p.state!=='reserved' && p.state!=='picked') p.x+=beltP*dt;
  }
  for(i=0;i<S.containers.length;i++){ S.containers[i].x+=beltC*dt; }

  S.spawnTimerP-=dt; if(S.spawnTimerP<=0) spawnProduct();
  S.spawnTimerC-=dt; if(S.spawnTimerC<=0) spawnContainer();

  for(i=0;i<S.products.length;i++){
    var pr=S.products[i];
    if(pr.state==='moving' && pr.prevX<CAM_X && pr.x>=CAM_X) detectProduct(pr);
    pr.prevX=pr.x;
  }
  for(i=0;i<S.containers.length;i++){
    var co=S.containers[i];
    if(co.state==='moving' && co.prevX<LS_X && co.x>=LS_X) detectContainer(co);
    co.prevX=co.x;
  }

  for(i=0;i<S.products.length;i++){
    var pp2=S.products[i];
    if(pp2.state==='detected' && S.t>=pp2.until){ pp2.state='prioritised'; pp2.until=S.t+0.35; pp2.stateSince=S.t; }
    else if(pp2.state==='prioritised' && S.t>=pp2.until){ pp2.state='registered'; pp2.stateSince=S.t; }
  }
  for(i=0;i<S.containers.length;i++){
    var cc2=S.containers[i];
    if(cc2.state==='detected' && S.t>=cc2.until){ cc2.state='prioritised'; cc2.until=S.t+0.35; cc2.stateSince=S.t; }
    else if(cc2.state==='prioritised' && S.t>=cc2.until){ cc2.state='registered'; cc2.stateSince=S.t; }
  }

  for(i=0;i<S.products.length;i++){
    var pz=S.products[i];
    if(pz.x>=DEL_X0 && pz.state!=='deleted' && pz.state!=='picked' && pz.state!=='reserved'){
      pz.state='deleted'; pz.stateSince=S.t; pz.removeAt=S.t+0.5; pz.assignedZone='Zone_Delete_Product';
    }
  }
  for(i=0;i<S.containers.length;i++){
    var cz=S.containers[i];
    if(cz.x>=DEL_X0 && cz.state!=='deleted' && !cz.blocked){
      cz.state='deleted'; cz.stateSince=S.t; cz.removeAt=S.t+0.5; cz.assignedZone='Zone_Delete_Container';
    }
  }

  updateActuator(dt);

  S.products=S.products.filter(function(p){
    if(p.state==='deleted' && S.t>=p.removeAt){ recordProductDeletion(p,'auto'); return false; }
    if(p.x>DEL_X1+40) return false;
    return true;
  });
  S.containers=S.containers.filter(function(c){
    if(c.state==='deleted' && S.t>=c.removeAt){ recordContainerDeletion(c,'auto'); return false; }
    if(c.x>DEL_X1+40) return false;
    return true;
  });
}

/* ---------- canvas drawing ---------- */
function sxpx(x,cw){ return 46+(x/BELT_LEN)*(cw-92); }
function fillRectA(x,y,w,h,color,alpha){ ctx.save(); ctx.globalAlpha=alpha; ctx.fillStyle=color; ctx.fillRect(x,y,w,h); ctx.restore(); }
function drawShape(x,y,shape,r){
  ctx.beginPath();
  if(shape==='circle'){ ctx.arc(x,y,r,0,Math.PI*2); }
  else if(shape==='square'){ ctx.rect(x-r,y-r,r*2,r*2); }
  else { ctx.moveTo(x,y-r); ctx.lineTo(x+r,y+r); ctx.lineTo(x-r,y+r); ctx.closePath(); }
  ctx.fill();
}
function drawBelt(cw,y,h,label,color){
  var x0=sxpx(0,cw), x1=sxpx(BELT_LEN,cw);
  ctx.fillStyle=THEME.surface3; ctx.fillRect(x0,y-h/2,x1-x0,h);
  ctx.strokeStyle=THEME.line; ctx.lineWidth=1; ctx.strokeRect(x0,y-h/2,x1-x0,h);
  ctx.strokeStyle=color; ctx.lineWidth=1.4;
  for(var cx=x0+22; cx<x1-10; cx+=44){ ctx.beginPath(); ctx.moveTo(cx,y-4); ctx.lineTo(cx+8,y); ctx.lineTo(cx,y+4); ctx.stroke(); }
  ctx.fillStyle=THEME.textDim; ctx.font='10px '+THEME.mono; ctx.textAlign='left';
  ctx.fillText(label, x0, y-h/2-8);
}
function drawZone(cw,x0v,extv,y,h,label,color,coreEndv){
  var x0=sxpx(x0v,cw), core1=sxpx(coreEndv,cw), ext1=sxpx(extv,cw);
  fillRectA(x0,y-h/2-7,core1-x0,h+14,color,0.16);
  ctx.strokeStyle=color; ctx.setLineDash([4,3]); ctx.lineWidth=1.2;
  ctx.strokeRect(x0,y-h/2-7,core1-x0,h+14);
  fillRectA(core1,y-h/2-7,ext1-core1,h+14,color,0.06);
  ctx.strokeRect(core1,y-h/2-7,ext1-core1,h+14);
  ctx.setLineDash([]);
  ctx.fillStyle=color; ctx.font='9px '+THEME.mono; ctx.textAlign='left';
  ctx.fillText(label, x0+3, y-h/2-10);
}
function drawSource(cw,y,h,label){
  var x=sxpx(0,cw)-6;
  ctx.fillStyle=THEME.surface2; ctx.strokeStyle=THEME.line; ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.arc(x,y,7,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle=THEME.textDim; ctx.font='8.5px '+THEME.mono; ctx.textAlign='left';
  ctx.fillText(label, x-6, y+h/2+14);
}
function drawSensorCamera(cw,y,h){
  var x=sxpx(CAM_X,cw), flashing=(S.t-lastCamFlash)<0.28;
  ctx.strokeStyle=flashing?THEME.accent2:THEME.line; ctx.lineWidth=1.3; ctx.setLineDash([3,3]);
  ctx.beginPath(); ctx.moveTo(x,y-h/2-26); ctx.lineTo(x-10,y-h/2-6); ctx.lineTo(x+10,y-h/2-6); ctx.closePath(); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle=flashing?THEME.accent2:THEME.surface2; ctx.strokeStyle=THEME.line;
  ctx.fillRect(x-9,y-h/2-34,18,10); ctx.strokeRect(x-9,y-h/2-34,18,10);
  ctx.fillStyle=THEME.textDim; ctx.font='8.5px '+THEME.mono; ctx.textAlign='left';
  ctx.fillText('FoSensorCamera_1', x-42, y-h/2-38);
  if(flashing){ ctx.save(); ctx.globalAlpha=0.55; ctx.strokeStyle=THEME.accent2; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(x,y,15,0,Math.PI*2); ctx.stroke(); ctx.restore(); }
}
function drawSensorLightSwitch(cw,y,h){
  var x=sxpx(LS_X,cw), flashing=(S.t-lastLsFlash)<0.28;
  ctx.strokeStyle=THEME.line; ctx.lineWidth=1.3;
  ctx.beginPath(); ctx.moveTo(x,y-h/2-20); ctx.lineTo(x,y-h/2-4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+20,y-h/2-20); ctx.lineTo(x+20,y-h/2-4); ctx.stroke();
  ctx.strokeStyle=flashing?THEME.accent2:THEME.accent; ctx.lineWidth=flashing?2.6:1.3;
  ctx.beginPath(); ctx.moveTo(x,y-h/2-18); ctx.lineTo(x+20,y-h/2-18); ctx.stroke();
  ctx.fillStyle=THEME.textDim; ctx.font='8.5px '+THEME.mono; ctx.textAlign='left';
  ctx.fillText('FoSensorLightSwitch_1', x-16, y-h/2-24);
}
function drawSink(cw,y,h,label){
  var x=sxpx(DEL_X1,cw)+12;
  ctx.fillStyle=THEME.surface2; ctx.strokeStyle=THEME.line; ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.moveTo(x-8,y-8); ctx.lineTo(x+8,y-8); ctx.lineTo(x,y+9); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle=THEME.textDim; ctx.font='8.5px '+THEME.mono; ctx.textAlign='left';
  ctx.fillText(label, x-10, y+24);
}
function drawActuator(cw,pY,cY,h){
  var A=S.actuator, x=sxpx(A.x,cw), topY=pY-h/2-42, botY=cY+h/2+4;
  ctx.strokeStyle=THEME.text2; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(x,topY); ctx.lineTo(x,botY-32); ctx.stroke();
  var dip=(A.phase==='pickWait'||A.phase==='placeWait')?10:0;
  ctx.fillStyle=THEME.pink;
  ctx.beginPath(); ctx.arc(x,botY-32+dip,6,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=THEME.textDim; ctx.font='8.5px '+THEME.mono; ctx.textAlign='center';
  ctx.fillText('FoActuatorKinematic_1', x, topY-6);
  ctx.textAlign='left';
}
function drawProduct(cw,y,h,p){
  var x=sxpx(p.x,cw), col=colorToken(p.color);
  ctx.save();
  if(p.dupFlashUntil && S.t<p.dupFlashUntil){ ctx.strokeStyle=THEME.warn; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,12,0,Math.PI*2); ctx.stroke(); }
  if(p.minGapViolated){ ctx.strokeStyle=THEME.warn; ctx.setLineDash([2,2]); ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(x,y,9,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]); }
  if(p.state==='reserved'){ ctx.strokeStyle=THEME.pink; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,10,0,Math.PI*2); ctx.stroke(); }
  ctx.fillStyle=col; drawShape(x,y,p.shape,6);
  ctx.restore();
  ctx.fillStyle=THEME.text; ctx.font='8px '+THEME.mono; ctx.textAlign='center';
  ctx.fillText(p.id, x, y+17); ctx.textAlign='left';
}
function drawHeldProduct(cw,pY,cY,h,p){
  var A=S.actuator, x=sxpx(A.x,cw);
  var y=(A.phase==='seekContainer'||A.phase==='placeWait') ? (pY+cY)/2 : (pY-h/2-16);
  ctx.fillStyle=colorToken(p.color); drawShape(x,y,p.shape,6);
  ctx.strokeStyle=THEME.pink; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,10,0,Math.PI*2); ctx.stroke();
}
function drawContainer(cw,y,h,c){
  var x=sxpx(c.x,cw), w=28, ht=18, pw=w/2, ph=ht/2, i;
  ctx.fillStyle=THEME.surface2; ctx.strokeStyle=c.full?THEME.ok:THEME.line; ctx.lineWidth=1.4;
  ctx.fillRect(x-w/2,y-ht/2,w,ht); ctx.strokeRect(x-w/2,y-ht/2,w,ht);
  for(i=0;i<4;i++){
    var px=x-w/2+(i%2)*pw, py=y-ht/2+Math.floor(i/2)*ph;
    ctx.strokeStyle=THEME.lineSoft; ctx.lineWidth=1; ctx.strokeRect(px,py,pw,ph);
    var pocket=c.pockets[i];
    if(pocket){ ctx.fillStyle=colorToken(pocket.color); ctx.beginPath(); ctx.arc(px+pw/2,py+ph/2,3.2,0,Math.PI*2); ctx.fill(); }
  }
  ctx.fillStyle=THEME.text; ctx.font='8px '+THEME.mono; ctx.textAlign='center';
  ctx.fillText(c.id, x, y+19); ctx.textAlign='left';
}
function draw(){
  var cw=canvas.clientWidth, ch=canvas.clientHeight;
  if(!cw||!ch) return;
  ctx.clearRect(0,0,cw,ch);
  ctx.fillStyle=THEME.surface2; ctx.fillRect(0,0,cw,ch);
  var pY=ch*0.32, cY=ch*0.74, beltH=Math.max(10,ch*0.10);
  ctx.fillStyle=THEME.textDim; ctx.font='9.5px '+THEME.mono; ctx.textAlign='left';
  ctx.fillText('+X →', sxpx(0,cw), pY-30);
  drawBelt(cw,pY,beltH,'Product_1 (FoConveyorBelt)',THEME.accent);
  drawBelt(cw,cY,beltH,'Container_1 (FoConveyorBelt)',THEME.accent2);
  drawZone(cw,PICK_X0,PICK_EXT1,pY,beltH,'picking zone',THEME.pink,PICK_X1);
  drawZone(cw,PLACE_X0,PLACE_EXT1,cY,beltH,'placing zone',THEME.pink,PLACE_X1);
  drawZone(cw,DEL_X0,DEL_X1,pY,beltH,'deletion zone (FoSensorZone)',THEME.err,DEL_X1);
  drawZone(cw,DEL_X0,DEL_X1,cY,beltH,'deletion zone (FoSensorZone)',THEME.err,DEL_X1);
  drawSource(cw,pY,beltH,'FoSource');
  drawSource(cw,cY,beltH,'FoSource');
  drawSensorCamera(cw,pY,beltH);
  drawSensorLightSwitch(cw,cY,beltH);
  drawSink(cw,pY,beltH,'FoSinkProduct_1');
  drawSink(cw,cY,beltH,'FoSinkContainer_1');
  drawActuator(cw,pY,cY,beltH);
  var i;
  for(i=0;i<S.products.length;i++) drawProduct(cw,pY,beltH,S.products[i]);
  for(i=0;i<S.containers.length;i++) drawContainer(cw,cY,beltH,S.containers[i]);
  if(S.actuator.held) drawHeldProduct(cw,pY,cY,beltH,S.actuator.held);
}

/* ---------- UI rendering ---------- */
function stateBadgeClass(state){
  if(state==='detected'||state==='prioritised') return 'sim-b-accent';
  if(state==='reserved'||state==='picked') return 'sim-b-pink';
  if(state==='placed') return 'sim-b-ok';
  if(state==='deleted') return 'sim-b-err';
  return 'sim-b-muted';
}
function objCell(obj,label){
  return '<span class="sim-obj"><span class="sim-shape '+obj.shape+' sim-c-'+obj.color+'"></span>'+label+'</span>';
}
function flagCell(o){
  var flags=[];
  if(o.minGapViolated) flags.push('<span class="sim-badge sim-b-warn">min-gap</span>');
  if(o.dupFlashUntil && S.t<o.dupFlashUntil) flags.push('<span class="sim-badge sim-b-warn">duplicate</span>');
  if(o.blocked) flags.push('<span class="sim-badge sim-b-pink">reserved</span>');
  return '<span class="sim-flags">'+(flags.length?flags.join(''):'<span class="sim-badge sim-b-muted">—</span>')+'</span>';
}
function flashClass(o){ return (!reducedMotion && (S.t-o.stateSince)<0.9) ? 'sim-flash' : ''; }

function renderRegister(){
  var rows=[], i;
  var prodRows=S.products.slice().sort(function(a,b){ return b.x-a.x; });
  rows.push('<tr class="sim-grouprow"><td colspan="7">Product_1 · priority: 1 – X highest (LPRODREG_PRIO_X_HIGHEST)</td></tr>');
  if(!prodRows.length && !S.actuator.held) rows.push('<tr><td colspan="7" class="sim-empty">no products on the conveyor</td></tr>');
  for(i=0;i<prodRows.length;i++){
    var p=prodRows[i];
    rows.push('<tr class="'+flashClass(p)+'"><td>'+(i+1)+'</td><td>'+objCell(p,p.id)+'</td><td>'+p.color+' · '+p.shape+'</td><td class="sim-pos">'+Math.round(p.x)+' mm</td><td><span class="sim-badge '+stateBadgeClass(p.state)+'">'+p.state+'</span></td><td>'+flagCell(p)+'</td><td>'+p.assignedFO+'</td></tr>');
  }
  if(S.actuator.held){
    var h=S.actuator.held;
    rows.push('<tr class="'+flashClass(h)+'"><td>·</td><td>'+objCell(h,h.id)+'</td><td>'+h.color+' · '+h.shape+'</td><td class="sim-pos">held by actuator</td><td><span class="sim-badge sim-b-pink">'+h.state+'</span></td><td>'+flagCell(h)+'</td><td>'+h.assignedFO+'</td></tr>');
  }
  var contRows=S.containers.slice().sort(function(a,b){ return a.insertSeq-b.insertSeq; });
  rows.push('<tr class="sim-grouprow"><td colspan="7">Container_1 · priority: 0 – no prioritisation (call order)</td></tr>');
  if(!contRows.length) rows.push('<tr><td colspan="7" class="sim-empty">no containers on the conveyor</td></tr>');
  for(i=0;i<contRows.length;i++){
    var c=contRows[i], filled=c.pockets.filter(function(x){ return x!==null; }).length;
    rows.push('<tr class="'+flashClass(c)+'"><td>'+(i+1)+'</td><td class="sim-obj">'+c.id+'</td><td>'+filled+'/4 pockets</td><td class="sim-pos">'+Math.round(c.x)+' mm</td><td><span class="sim-badge '+(c.full?'sim-b-ok':stateBadgeClass(c.state))+'">'+(c.full?'full':c.state)+'</span></td><td>'+flagCell(c)+'</td><td>'+c.assignedFO+'</td></tr>');
    var pocketRows=S.placedProducts.filter(function(pp){ return pp.containerId===c.id; }).sort(function(a,b){ return a.pocket-b.pocket; });
    for(var j=0;j<pocketRows.length;j++){
      var pp=pocketRows[j];
      rows.push('<tr class="sim-subrow '+flashClass(pp)+'"><td></td><td>'+objCell(pp,pp.id)+'</td><td>'+pp.color+' · '+pp.shape+'</td><td class="sim-pos">pocket '+(pp.pocket+1)+'</td><td><span class="sim-badge sim-b-ok">placed</span></td><td>—</td><td>'+pp.assignedFO+'</td></tr>');
    }
  }
  els.regBody.innerHTML=rows.join('');
}
function renderMonitor(){
  var items=S.monitor.slice(-16);
  els.monList.innerHTML=items.map(function(m){
    return '<li class="'+(m.rejected?'sim-mreject':'')+'"><span class="sim-mid">#'+m.id+'</span><span class="sim-mfo">'+m.fo+'</span><span class="sim-mreq">'+m.req+'</span><span class="sim-mresp">'+m.resp+'</span></li>';
  }).join('');
  els.monList.scrollTop=els.monList.scrollHeight;
}
function renderDeleteOptions(){
  var prev=els.deleteSel.value, opts=[], i;
  for(i=0;i<S.products.length;i++){ var p=S.products[i]; opts.push(['onbelt:'+p.id, p.id+' · '+p.color+' '+p.shape+' · '+p.state]); }
  for(i=0;i<S.placedProducts.length;i++){ var pp=S.placedProducts[i]; opts.push(['pocket:'+pp.id, pp.id+' · '+pp.color+' '+pp.shape+' · placed in '+pp.containerId]); }
  for(i=0;i<S.containers.length;i++){ var c=S.containers[i]; var f=c.pockets.filter(function(x){ return x!==null; }).length; opts.push(['container:'+c.id, c.id+' · container · '+f+'/4 filled']); }
  if(!opts.length){ els.deleteSel.innerHTML='<option value="">No trackable objects yet</option>'; return; }
  var html=opts.map(function(o){ return '<option value="'+o[0]+'">'+o[1]+'</option>'; }).join('');
  els.deleteSel.innerHTML=html;
  var stillThere=opts.some(function(o){ return o[0]===prev; });
  if(stillThere) els.deleteSel.value=prev;
}
function renderCounters(){
  els.cReg.textContent=S.counters.reg;
  els.cPick.textContent=S.counters.pick;
  els.cPlace.textContent=S.counters.place;
  els.cDel.textContent=S.counters.del;
  els.cCreg.textContent=S.counters.creg;
  els.cCfill.textContent=S.counters.cfill;
  els.actuatorStatus.textContent=S.actuator.statusText;
  els.clock.textContent=S.t.toFixed(1)+' s';
}
function renderUI(){ renderRegister(); renderMonitor(); renderDeleteOptions(); renderCounters(); }

/* ---------- controls ---------- */
function updateRunButton(){
  els.run.textContent=S.running?'Pause':'Run';
  els.run.classList.toggle('sim-btn-primary',S.running);
}
els.run.addEventListener('click', function(){ S.running=!S.running; updateRunButton(); });
els.step.addEventListener('click', function(){
  S.running=false; updateRunButton();
  update(reducedMotion?0.8:0.5);
  draw(); renderUI();
});
els.reset.addEventListener('click', function(){
  var strat=S.strategy;
  S=freshState(); S.strategy=strat; seedInitial();
  lastCamFlash=-10; lastLsFlash=-10; lastTs=null; renderAcc=0;
  updateRunButton();
  draw(); renderUI();
});
els.speedP.addEventListener('input', function(){ els.speedPVal.textContent=els.speedP.value+' mm/s'; });
els.speedC.addEventListener('input', function(){ els.speedCVal.textContent=els.speedC.value+' mm/s'; });
els.arrival.addEventListener('input', function(){ els.arrivalVal.textContent='avg. '+(+els.arrival.value).toFixed(1)+' s apart'; });
els.gapBtn.addEventListener('click', forceGap);
els.dupBtn.addEventListener('click', forceDuplicate);
els.stratBtns.forEach(function(btn){
  btn.addEventListener('click', function(){
    els.stratBtns.forEach(function(b){ b.classList.remove('on'); b.setAttribute('aria-pressed','false'); });
    btn.classList.add('on'); btn.setAttribute('aria-pressed','true');
    S.strategy=btn.getAttribute('data-strategy');
  });
});
els.deleteBtn.addEventListener('click', function(){
  var key=els.deleteSel.value; if(!key) return;
  var parts=key.split(':'), type=parts[0], id=parts[1], idx;
  if(type==='onbelt'){
    idx=S.products.findIndex(function(p){ return p.id===id; });
    if(idx>-1){
      var p=S.products[idx]; S.products.splice(idx,1);
      if(S.actuator.held===p){ S.actuator.held=null; S.actuator.phase='searching'; S.actuator.timer=0; }
      recordProductDeletion(p,'manual');
    }
  } else if(type==='pocket'){
    idx=S.placedProducts.findIndex(function(pp){ return pp.id===id; });
    if(idx>-1){
      S.placedProducts.splice(idx,1); S.counters.del++;
      addMonitor('FoSinkProduct_1 (manual)','deleteObject('+id+')','deleted — manual trigger, pocket content');
    }
  } else if(type==='container'){
    idx=S.containers.findIndex(function(c){ return c.id===id; });
    if(idx>-1){ var c=S.containers[idx]; S.containers.splice(idx,1); recordContainerDeletion(c,'manual'); }
  }
  renderUI();
});

/* ---------- loop ---------- */
var lastTs=null, renderAcc=0, intervalId=null;
function resizeCanvas(){
  var rect=canvas.getBoundingClientRect();
  var dpr=Math.min(window.devicePixelRatio||1,2);
  var w=Math.max(1,Math.round(rect.width*dpr)), h=Math.max(1,Math.round(rect.height*dpr));
  if(canvas.width!==w) canvas.width=w;
  if(canvas.height!==h) canvas.height=h;
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function frame(ts){
  if(lastTs===null) lastTs=ts;
  var dt=Math.min((ts-lastTs)/1000,0.25);
  lastTs=ts;
  if(S.running) update(dt);
  draw();
  renderAcc+=dt;
  if(renderAcc>0.15){ renderAcc=0; renderUI(); }
  requestAnimationFrame(frame);
}
function startLoop(){
  resizeCanvas();
  els.speedPVal.textContent=els.speedP.value+' mm/s';
  els.speedCVal.textContent=els.speedC.value+' mm/s';
  els.arrivalVal.textContent='avg. '+(+els.arrival.value).toFixed(1)+' s apart';
  updateRunButton();
  draw(); renderUI();
  if(reducedMotion){
    intervalId=setInterval(function(){ if(S.running){ update(0.8); } draw(); renderUI(); }, 900);
  } else {
    requestAnimationFrame(frame);
  }
}
if(window.ResizeObserver) new ResizeObserver(function(){ resizeCanvas(); if(reducedMotion) draw(); }).observe(canvas);
else window.addEventListener('resize', function(){ resizeCanvas(); if(reducedMotion) draw(); });

startLoop();
}

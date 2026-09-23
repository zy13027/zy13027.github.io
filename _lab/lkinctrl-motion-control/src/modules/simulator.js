// Path lab: the interactive PathData simulator (build / edit a command list,
// run it against a Cartesian model, and watch execute/interrupt/continue/stop).
// This is the artifact's single largest and most stateful IIFE — kept as one
// module because its model, runner state machine, list renderer, canvas
// renderer and DOM wiring all share private mutable state (cmds, timeline,
// runner, flags, focusId, followLive, overrideFactor, sequenceMode, canvas,
// ctx). Only the pure, stateless geometry/number helpers were split out, to
// modules/util/geometry.js, since those carry no shared state and are safe
// to extract without touching behaviour.

import {
  clamp, lerp, d2r, r2d, fmt,
  circCenterArc, circTwoPtRadius, circThreePt, sampleArc, sampleLine,
  polyLen, trimEnd, trimStart, quadFillet,
  hexRGB, colLerp, niceStep
} from './util/geometry.js';

export function initSimulator() {
var ROOT=document.getElementById('simulator');
if(!ROOT) return;

/* ---------------------------------------------------------------------
   Constants grounded in the LKinCtrl_V5.3 manual, section 3
--------------------------------------------------------------------- */
var FLAG_COUNT=7;
var FLAG_MODES=[
  [0,'Off'],[1,'Set before · no reset'],[2,'Set before · reset after'],
  [5,'Set before · wait for ack'],[10,'Set at remaining distance'],
  [11,'Set after · no reset'],[20,'Reset before'],[21,'Reset after'],
  [22,'Reset at remaining distance'],[25,'Wait for flag = FALSE'],[26,'Wait for flag = TRUE']
];
var WAIT_MODES={5:1,15:1,25:1,26:1};
var BUFFER_MODES=[[1,'Standstill (no blend)'],[2,'Blend · lower speed'],[5,'Blend · higher speed']];
var PATHCHOICE_2=[[0,'Short · positive (CCW)'],[1,'Short · negative (CW)'],[2,'Long · positive (CCW)'],[3,'Long · negative (CW)']];
var PATHCHOICE_1=[[0,'Positive (CCW)'],[1,'Negative (CW)']];
var STATUS={
  finished:'16#0000 STATUS_EXECUTION_FINISHED', noCall:'16#7000 STATUS_NO_CALL',
  first:'16#7001 STATUS_FIRST_CALL', lin:'16#7301 STATUS_CMD_LIN_ACTIVE',
  circ:'16#7302 STATUS_CMD_CIRC_ACTIVE', interrupted:'16#7303 STATUS_PATHMOTION_INTERRUPTED',
  stopping:'16#7304 STATUS_PATHMOTION_STOPPING', ready:'16#7305 STATUS_READYFORNEXTPATH',
  running:'16#7306 STATUS_PATHMOTION_RUNNING', waiting:'16#7307 STATUS_EXECUTION_WAITING',
  ptp:'16#7308 STATUS_CMD_MOVE_DIRECT_ACTIVE', errStop:'16#7309 STATUS_STOP_DUE_TO_ERROR',
  cfg:'16#730A STATUS_CMD_CONFIGURATION_ACTIVE', aborted:'16#7FFF STATUS_COMMAND_ABORTED'
};
var CMD_META={
  lin:{cmdType:1,label:'Linear',short:'LIN',acc:''},
  circ:{cmdType:3,label:'Circular',short:'CIRC',acc:''},
  ptp:{cmdType:5,label:'MoveDirect (sPTP)',short:'PTP',acc:'sim-acc-pink'},
  dynPath:{cmdType:70,label:'Set path dynamics',short:'DYN·PATH',acc:'sim-acc-amber'},
  dynOrient:{cmdType:71,label:'Set orientation dynamics',short:'DYN·ORI',acc:'sim-acc-amber'},
  dynSptp:{cmdType:72,label:'Set sPTP dynamics',short:'DYN·PTP',acc:'sim-acc-amber'},
  flagOnly:{cmdType:0,label:'Flag only',short:'FLAG',acc:'sim-acc-blue'},
  wait:{cmdType:100,label:'Wait time',short:'WAIT',acc:'sim-acc-blue'}
};
var ADD_ORDER=['lin','circ','ptp','dynPath','dynOrient','dynSptp','flagOnly','wait'];

var BASE_PATH_SPEED=170, BASE_SPTP_SPEED=230, DEFAULT_FACTOR=0.5, CFG_MS=180, MIN_MS=320;

/* ---------------------------------------------------------------------
   Small helpers
--------------------------------------------------------------------- */
function $(sel,ctx){return (ctx||ROOT).querySelector(sel);}
function reduced(){try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}}
function css(name){return getComputedStyle(document.documentElement).getPropertyValue(name).trim();}

/* ---------------------------------------------------------------------
   Model
--------------------------------------------------------------------- */
var uid=0;
function nid(){return 'r'+(++uid);}
function newRow(kind){
  var b={id:nid(),kind:kind,flagNo:-1,flagMode:0,remDist:20};
  switch(kind){
    case 'lin': return Object.assign(b,{x:120,y:0,a:0,blend:1,blendR:20});
    case 'circ': return Object.assign(b,{circMode:1,x:120,y:120,auxX:60,auxY:60,radius:80,arc:180,pathChoice:0,blend:1,blendR:20});
    case 'ptp': return Object.assign(b,{x:0,y:0,a:0,vel:'default',velManual:0.5},{flagNo:-1});
    case 'dynPath': case 'dynOrient': case 'dynSptp':
      return {id:b.id,kind:kind,v:{mode:'manual',val:0.5},acc:{mode:'default',val:0.5},dec:{mode:'default',val:0.5},jerk:{mode:'keep',val:0.5}};
    case 'flagOnly': return {id:b.id,kind:kind,flagNo:0,flagMode:1};
    case 'wait': return {id:b.id,kind:kind,ms:800};
  }
}
var cmds=[];
function seed(){
  uid=0; cmds=[
    (function(){var r=newRow('dynPath'); r.v={mode:'manual',val:0.55}; r.acc={mode:'default',val:0.5}; r.dec={mode:'default',val:0.5}; r.jerk={mode:'keep',val:0.4}; return r;})(),
    Object.assign(newRow('lin'),{x:260,y:40,a:0,blend:2,blendR:18}),
    Object.assign(newRow('circ'),{circMode:1,auxX:260,auxY:160,arc:180,pathChoice:0,blend:2,blendR:22,flagNo:1,flagMode:1}),
    Object.assign(newRow('circ'),{circMode:2,x:80,y:280,radius:110,pathChoice:0,blend:1,blendR:20}),
    (function(){var r=newRow('dynOrient'); r.v={mode:'manual',val:0.25}; return r;})(),
    Object.assign(newRow('ptp'),{x:80,y:120,a:120,vel:'default'}),
    Object.assign(newRow('flagOnly'),{flagNo:2,flagMode:25}),
    Object.assign(newRow('wait'),{ms:700}),
    Object.assign(newRow('circ'),{circMode:0,x:40,y:40,auxX:20,auxY:80,blend:2,blendR:15})
  ];
  focusId=null; followLive=true;
  stopRunnerHard();
  rebuild();
}

var focusId=null, followLive=true;
var flags=new Array(FLAG_COUNT).fill(false);
var overrideFactor=1, sequenceMode=0;

/* ---------------------------------------------------------------------
   Timeline build: model -> ordered segments with geometry, timing, flags
   (geometry helpers circCenterArc / circTwoPtRadius / circThreePt / sampleArc /
   sampleLine live in modules/util/geometry.js)
--------------------------------------------------------------------- */
var timeline=[]; // per-command entries
var motionSamples=[]; // flattened, cumulative-length samples across motion entries for drawing / animation
var totalLen=0;

function dynVal(field,cur){
  if(field.mode==='keep') return cur;
  if(field.mode==='default') return 'default';
  return clamp(field.val,0.01,1);
}
function effFactor(modalV){ return modalV==='default'?DEFAULT_FACTOR:modalV; }

function rebuild(){
  var pose={x:40,y:40,a:0};
  var modal={ path:{v:'default',acc:'default',dec:'default',jerk:'default'},
              orient:{v:'default',acc:'default',dec:'default',jerk:'default'},
              sptp:{v:'default',acc:'default',dec:'default',jerk:'default'} };
  timeline=[];
  cmds.forEach(function(row,idx){
    var entry={row:row,idx:idx,kind:row.kind,start:{x:pose.x,y:pose.y,a:pose.a},invalid:false};
    if(row.kind==='lin'){
      entry.end={x:row.x,y:row.y,a:row.a};
      entry.geom={type:'line'};
      entry.len=Math.hypot(row.x-pose.x,row.y-pose.y);
      var f=effFactor(modal.path.v);
      entry.ms=Math.max(MIN_MS, entry.len/(BASE_PATH_SPEED*f)*1000);
      entry.bufferMode=row.blend; entry.blendR=row.blendR;
      pose={x:row.x,y:row.y,a:row.a};
    } else if(row.kind==='circ'){
      var g;
      if(row.circMode===1){ g=circCenterArc(pose.x,pose.y,row.auxX,row.auxY,row.arc,row.pathChoice); row.computedX=g.ex; row.computedY=g.ey; }
      else if(row.circMode===2){ g=circTwoPtRadius(pose.x,pose.y,row.x,row.y,row.radius,row.pathChoice); }
      else { g=circThreePt(pose.x,pose.y,row.auxX,row.auxY,row.x,row.y); }
      entry.geom={type:'arc',g:g,circMode:row.circMode,auxX:row.auxX,auxY:row.auxY};
      entry.invalid=!!g.invalid;
      entry.end={x:g.ex!==undefined?g.ex:row.x,y:g.ey!==undefined?g.ey:row.y,a:pose.a};
      entry.len=Math.abs(g.sweep)*g.radius;
      var f2=effFactor(modal.path.v);
      entry.ms=Math.max(MIN_MS, entry.len/(BASE_PATH_SPEED*f2)*1000);
      entry.bufferMode=row.blend; entry.blendR=row.blendR;
      pose={x:entry.end.x,y:entry.end.y,a:pose.a};
    } else if(row.kind==='ptp'){
      entry.end={x:row.x,y:row.y,a:row.a};
      entry.geom={type:'line'};
      entry.len=Math.hypot(row.x-pose.x,row.y-pose.y);
      var vf=row.vel==='default'?modal.sptp.v:row.velManual;
      var f3=effFactor(vf);
      entry.ms=Math.max(MIN_MS, entry.len/(BASE_SPTP_SPEED*f3)*1000);
      entry.bufferMode=1; entry.blendR=0;
      pose={x:row.x,y:row.y,a:row.a};
    } else if(row.kind==='dynPath'||row.kind==='dynOrient'||row.kind==='dynSptp'){
      var m=row.kind==='dynPath'?modal.path:(row.kind==='dynOrient'?modal.orient:modal.sptp);
      m.v=dynVal(row.v,m.v); m.acc=dynVal(row.acc,m.acc); m.dec=dynVal(row.dec,m.dec); m.jerk=dynVal(row.jerk,m.jerk);
      entry.end={x:pose.x,y:pose.y,a:pose.a}; entry.geom={type:'point'}; entry.ms=CFG_MS; entry.modalSnapshot={v:m.v,acc:m.acc,dec:m.dec,jerk:m.jerk};
    } else if(row.kind==='flagOnly'){
      entry.end={x:pose.x,y:pose.y,a:pose.a}; entry.geom={type:'point'}; entry.ms=CFG_MS;
    } else if(row.kind==='wait'){
      entry.end={x:pose.x,y:pose.y,a:pose.a}; entry.geom={type:'point'}; entry.ms=Math.max(0,row.ms);
    }
    entry.flagNo=(row.flagNo!==undefined&&row.flagNo>=0)?row.flagNo:-1;
    entry.flagMode=row.flagMode||0;
    timeline.push(entry);
  });
  buildSamples();
  resetRunnerPose();
  renderList();
  draw();
  updateOutputs();
}

function buildSamples(){
  motionSamples=[];
  var raw=[]; // per-motion-entry sample arrays before blend trimming
  timeline.forEach(function(e){
    if(e.geom.type==='line'){ e.samples=sampleLine(e.start.x,e.start.y,e.end.x,e.end.y,24); }
    else if(e.geom.type==='arc'){ var n=Math.max(16,Math.round(Math.abs(e.geom.g.sweep)/d2r(6))); e.samples=sampleArc(e.geom.g,n); }
    else { e.samples=[{x:e.start.x,y:e.start.y}]; }
  });
  // apply blend fillets between consecutive motion entries
  var lastMotion=null;
  timeline.forEach(function(e){
    if(e.geom.type==='point') return;
    if(lastMotion && e.bufferMode!==1 && e.blendR>0){
      var rad=e.blendR;
      var lenIn=polyLen(lastMotion.samples), lenOut=polyLen(e.samples);
      var fin=clamp(rad/Math.max(1,lenIn),0,0.45), fout=clamp(rad/Math.max(1,lenOut),0,0.45);
      var trimA=trimEnd(lastMotion.samples,fin), trimB=trimStart(e.samples,fout);
      var vertex={x:lastMotion.end.x,y:lastMotion.end.y};
      var fillet=quadFillet(trimA[trimA.length-1],vertex,trimB[0],10);
      lastMotion.samples=trimA; e.samples=fillet.slice(1).concat(trimB.slice(1));
      e.blendGhost=vertex; e.blended=true;
    }
    lastMotion=e;
  });
  var cum=0, pts=[];
  timeline.forEach(function(e){
    if(e.geom.type==='point'){ e.cumStart=cum; e.cumEnd=cum; return; }
    e.cumStart=cum;
    for(var i=0;i<e.samples.length;i++){
      if(i===0 && pts.length){ /* avoid dup point at shared joints */ }
      var p=e.samples[i];
      if(i>0){ cum+=Math.hypot(p.x-e.samples[i-1].x,p.y-e.samples[i-1].y); }
      pts.push({x:p.x,y:p.y,cum:cum,entry:e});
    }
    e.cumEnd=cum;
  });
  motionSamples=pts; totalLen=cum;
}
/* ---------------------------------------------------------------------
   Runner (execution) state machine
--------------------------------------------------------------------- */
var runner={state:'idle',idx:-1,startTime:0,progMs:0,raf:null,pose:{x:40,y:40,a:0}};

function resetRunnerPose(){
  runner.state='idle'; runner.idx=-1; runner.progMs=0;
  runner.pose={x:timeline.length?timeline[0].start.x:40, y:timeline.length?timeline[0].start.y:40, a:0};
  flags=new Array(FLAG_COUNT).fill(false);
}
function stopRunnerHard(){
  if(runner.raf) cancelAnimationFrame(runner.raf);
  runner.raf=null;
}
function currentEntry(){ return runner.idx>=0 && runner.idx<timeline.length ? timeline[runner.idx] : null; }

function applyFlagEvent(entry,when){
  if(entry.flagNo<0) return;
  var mode=entry.flagMode;
  if(when==='before'){
    if(mode===1||mode===2||mode===3||mode===5) flags[entry.flagNo]=true;
    if(mode===20) flags[entry.flagNo]=false;
  } else if(when==='after'){
    if(mode===2) flags[entry.flagNo]=false;
    if(mode===11||mode===13||mode===15) flags[entry.flagNo]=true;
    if(mode===21) flags[entry.flagNo]=false;
  }
}
function isWaitMode(mode){ return !!WAIT_MODES[mode]; }

/* The pose chain (e.start/e.end) is the nominal, un-blended vertex used to
   compose each command's geometry from the one before it. The drawn trail
   can differ from that nominal vertex when a blend radius cuts the corner
   (see buildSamples). Anchor the animated marker to the entry's actual
   first/last drawable sample so it never jumps across a cut corner. */
function entryFirstPoint(e){
  return (e.samples && e.samples.length) ? {x:e.samples[0].x,y:e.samples[0].y,a:e.start.a} : {x:e.start.x,y:e.start.y,a:e.start.a};
}
function entryLastPoint(e){
  return (e.samples && e.samples.length) ? {x:e.samples[e.samples.length-1].x,y:e.samples[e.samples.length-1].y,a:e.end.a} : {x:e.end.x,y:e.end.y,a:e.end.a};
}
function startEntry(idx){
  runner.idx=idx; runner.progMs=0;
  var e=timeline[idx];
  if(!e){ finishPath(); return; }
  applyFlagEvent(e,'before');
  if(e.geom.type!=='point'){ runner.pose=entryFirstPoint(e); }
  renderList(); updateOutputs(); draw();
}
/* A wait-for-acknowledge flag mode (5, 15, 25, 26) pauses execution AFTER
   the command that carries it has finished its own motion, blocking only
   the command that follows (manual, flag modes 5 & 25, §3.10.2). */
function advanceAfterEntry(){
  var nextIdx=runner.idx+1;
  if(nextIdx>=timeline.length){ finishPath(); return; }
  if(sequenceMode===1){
    runner.state='paused-step'; runner.idx=nextIdx; runner.progMs=0;
    var pe=timeline[nextIdx]; if(pe && pe.geom.type!=='point'){ runner.pose=entryFirstPoint(pe); }
    renderList(); updateOutputs(); draw(); return;
  }
  startEntry(nextIdx); runner.state='running';
  scheduleTick();
}
function finishEntryAndAdvance(){
  var e=currentEntry();
  var eWasWait = !!(e && e.flagNo>=0 && isWaitMode(e.flagMode));
  if(e){ applyFlagEvent(e,'after'); if(e.geom.type!=='point'){ runner.pose=entryLastPoint(e); } }
  if(eWasWait){ runner.state='waiting-ack'; renderList(); updateOutputs(); draw(); return; }
  advanceAfterEntry();
}
function finishPath(){
  stopRunnerHard();
  runner.state='done'; runner.idx=timeline.length-1; runner.progMs=0;
  flags=new Array(FLAG_COUNT).fill(false);
  renderList(); updateOutputs(); draw();
}

function scheduleTick(){
  stopRunnerHard();
  if(reduced()){ resolveInstant(); return; }
  var last=performance.now();
  function frame(ts){
    var dt=ts-last; last=ts;
    if(runner.state!=='running'){ return; }
    var e=currentEntry();
    if(!e){ finishPath(); return; }
    runner.progMs+=dt*overrideFactor;
    var t=clamp(runner.progMs/Math.max(1,e.ms),0,1);
    if(e.geom.type!=='point'){
      var p=sampleAt(e,t);
      runner.pose={x:p.x,y:p.y,a:lerp(e.start.a,e.end.a,t)};
    }
    if(e.flagNo>=0 && e.flagMode===10){
      var remain=(1-t)*(e.len||0);
      if(remain<=e.remDist) flags[e.flagNo]=true;
    }
    if(e.flagNo>=0 && e.flagMode===22){
      var remain2=(1-t)*(e.len||0);
      if(remain2<=e.remDist) flags[e.flagNo]=false;
    }
    draw(); updateOutputs();
    if(t>=1){ finishEntryAndAdvance(); return; }
    runner.raf=requestAnimationFrame(frame);
  }
  runner.raf=requestAnimationFrame(frame);
}
function resolveInstant(){
  var e=currentEntry(); if(!e) return;
  runner.progMs=e.ms;
  if(e.geom.type!=='point'){ runner.pose={x:e.end.x,y:e.end.y,a:e.end.a}; }
  if(e.flagNo>=0 && (e.flagMode===10)) flags[e.flagNo]=true;
  if(e.flagNo>=0 && (e.flagMode===22)) flags[e.flagNo]=false;
  draw(); updateOutputs();
  finishEntryAndAdvance();
}
function sampleAt(e,t){
  if(e.geom.type==='line'){ var s=e.samples; var f=t*(s.length-1); var i=Math.floor(f); var lt=f-i; var a=s[clamp(i,0,s.length-1)], b=s[clamp(i+1,0,s.length-1)]; return {x:lerp(a.x,b.x,lt),y:lerp(a.y,b.y,lt)}; }
  if(e.geom.type==='arc'){ var s2=e.samples; var f2=t*(s2.length-1); var i2=Math.floor(f2); var lt2=f2-i2; var a2=s2[clamp(i2,0,s2.length-1)], b2=s2[clamp(i2+1,0,s2.length-1)]; return {x:lerp(a2.x,b2.x,lt2),y:lerp(a2.y,b2.y,lt2)}; }
  return {x:e.start.x,y:e.start.y};
}

/* ---------------------------------------------------------------------
   Controls
--------------------------------------------------------------------- */
function doExecute(){
  if(runner.state==='idle'||runner.state==='done'||runner.state==='stopped'){
    resetRunnerPose();
    if(!timeline.length) return;
    startEntry(0); runner.state='running';
    scheduleTick();
  } else if(runner.state==='paused-step'){
    runner.state='running'; scheduleTick();
  }
  renderList(); updateOutputs();
}
function doStop(){
  stopRunnerHard();
  runner.state='stopped'; renderList(); updateOutputs(); draw();
}
function doInterrupt(){
  if(runner.state!=='running') return;
  stopRunnerHard();
  runner.state='interrupted'; renderList(); updateOutputs(); draw();
}
function doContinue(){
  if(runner.state!=='interrupted') return;
  runner.state='running'; scheduleTick(); renderList(); updateOutputs();
}
function doReset(){
  if(isBusy()) return;
  stopRunnerHard(); resetRunnerPose(); runner.state='idle';
  renderList(); updateOutputs(); draw();
}
function doAck(){
  if(runner.state!=='waiting-ack') return;
  var e=currentEntry(); if(!e) return;
  var mode=e.flagMode;
  if(mode===5||mode===15){ flags[e.flagNo]=false; }
  else if(mode===25){ flags[e.flagNo]=false; }
  else if(mode===26){ flags[e.flagNo]=true; }
  advanceAfterEntry();
  renderList(); updateOutputs(); draw();
}
function toggleFlag(i){
  flags[i]=!flags[i];
  var e=currentEntry();
  if(runner.state==='waiting-ack' && e && e.flagNo===i){
    var m=e.flagMode;
    if((m===25 && flags[i]===false) || (m===26 && flags[i]===true) || ((m===5||m===15) && flags[i]===false)){
      advanceAfterEntry();
    }
  }
  renderList(); updateOutputs(); draw();
}
function isBusy(){ return runner.state==='running'||runner.state==='interrupted'||runner.state==='paused-step'||runner.state==='waiting-ack'; }

/* ---------------------------------------------------------------------
   List rendering
--------------------------------------------------------------------- */
function fieldNum(id,field,label,val,min,max,step,extraCls){
  return '<label class="sim-field '+(extraCls||'')+'"><span>'+label+'</span><input type="number" data-id="'+id+'" data-field="'+field+'" value="'+val+'" min="'+min+'" max="'+max+'" step="'+step+'"></label>';
}
function fieldSel(id,field,label,val,opts,wide){
  var h='<label class="sim-field'+(wide?' sim-wide':'')+'"><span>'+label+'</span><select data-id="'+id+'" data-field="'+field+'">';
  opts.forEach(function(o){ h+='<option value="'+o[0]+'"'+(String(o[0])===String(val)?' selected':'')+'>'+o[1]+'</option>'; });
  return h+'</select></label>';
}
function flagFields(row){
  var opts=[[-1,'— none']].concat((function(){var a=[];for(var i=0;i<FLAG_COUNT;i++)a.push([i,'flag['+i+']']);return a;})());
  var h=fieldSel(row.id,'flagNo','Flag',row.flagNo,opts);
  h+=fieldSel(row.id,'flagMode','Mode',row.flagMode,FLAG_MODES,true);
  if(row.flagMode===10||row.flagMode===22) h+=fieldNum(row.id,'remDist','Rem.dist mm',row.remDist,0,500,5);
  return h;
}
function blendFields(row){
  return fieldSel(row.id,'blend','Blend',row.blend,BUFFER_MODES,true)+
         (row.blend!==1?fieldNum(row.id,'blendR','Radius mm',row.blendR,0,150,1):'');
}
function dynMini(row,key,label){
  var f=row[key];
  var h='<div class="sim-dynitem"><span>'+label+'</span><div class="sim-dynrow">'+
    '<select data-id="'+row.id+'" data-field="'+key+'.mode">'+
      ['keep','default','manual'].map(function(m){return '<option value="'+m+'"'+(f.mode===m?' selected':'')+'>'+(m==='keep'?'Keep (−2)':m==='default'?'Default (−1)':'Manual')+'</option>';}).join('')+
    '</select>';
  if(f.mode==='manual') h+='<input type="number" data-id="'+row.id+'" data-field="'+key+'.val" value="'+f.val+'" min="'+(label==='Jerk'?0.1:0.01)+'" max="'+(label==='Jerk'?0.9:1)+'" step="0.01" style="width:56px">';
  return h+'</div></div>';
}
function rowHTML(row,idx){
  var meta=CMD_META[row.kind];
  var body='';
  if(row.kind==='lin'){
    body='<div class="sim-fields">'+
      fieldNum(row.id,'x','X mm',row.x,-400,400,1)+fieldNum(row.id,'y','Y mm',row.y,-400,400,1)+
      fieldNum(row.id,'a','Orient. A°',row.a,-180,180,5)+
      '</div><div class="sim-fields" style="margin-top:6px">'+blendFields(row)+'</div>'+
      '<div class="sim-fields" style="margin-top:6px">'+flagFields(row)+'</div>';
  } else if(row.kind==='circ'){
    var modeOpts=[[1,'1 · AuxPoint + Arc'],[2,'2 · Endpoint + Radius'],[0,'0 · Endpoint + AuxPoint (3D)']];
    body='<div class="sim-fields">'+fieldSel(row.id,'circMode','CircMode',row.circMode,modeOpts,true)+'</div>';
    body+='<div class="sim-fields" style="margin-top:6px">';
    if(row.circMode===1){
      body+=fieldNum(row.id,'auxX','Centre X',row.auxX,-400,400,1)+fieldNum(row.id,'auxY','Centre Y',row.auxY,-400,400,1)+
            fieldNum(row.id,'arc','Arc °',row.arc,1,720,5)+fieldSel(row.id,'pathChoice','Direction',row.pathChoice,PATHCHOICE_1);
      body+='</div><div class="sim-note">Endpoint is computed: X '+fmt(row.computedX!==undefined?row.computedX:0,0)+' &middot; Y '+fmt(row.computedY!==undefined?row.computedY:0,0)+' mm (centre + arc define it, &sect;3.4.1)</div>';
    } else if(row.circMode===2){
      body+=fieldNum(row.id,'x','Endpoint X',row.x,-400,400,1)+fieldNum(row.id,'y','Endpoint Y',row.y,-400,400,1)+
            fieldNum(row.id,'radius','Radius mm',row.radius,5,500,1)+fieldSel(row.id,'pathChoice','Direction',row.pathChoice,PATHCHOICE_2,true);
      body+='</div>';
    } else {
      body+=fieldNum(row.id,'auxX','AuxPoint X',row.auxX,-400,400,1)+fieldNum(row.id,'auxY','AuxPoint Y',row.auxY,-400,400,1)+
            fieldNum(row.id,'x','Endpoint X',row.x,-400,400,1)+fieldNum(row.id,'y','Endpoint Y',row.y,-400,400,1);
      body+='</div><div class="sim-note">Direction &amp; plane not relevant for CircMode 0 (&sect;3.4.3) &mdash; shown here reduced to the XY plane.</div>';
    }
    body+='<div class="sim-fields" style="margin-top:6px">'+blendFields(row)+'</div>'+
          '<div class="sim-fields" style="margin-top:6px">'+flagFields(row)+'</div>';
  } else if(row.kind==='ptp'){
    body='<div class="sim-fields">'+fieldNum(row.id,'x','X mm',row.x,-400,400,1)+fieldNum(row.id,'y','Y mm',row.y,-400,400,1)+
      fieldNum(row.id,'a','Orient. A°',row.a,-180,180,5)+'</div>'+
      '<div class="sim-fields" style="margin-top:6px">'+
      fieldSel(row.id,'vel','Velocity',row.vel,[['default','Default (−1, modal)'],['manual','Manual']],true)+
      (row.vel==='manual'?fieldNum(row.id,'velManual','Factor',row.velManual,0.01,1,0.01):'')+
      '</div><div class="sim-note">sPTP resolves to a full stop before the next command in this model; no blending applies.</div>'+
      '<div class="sim-fields" style="margin-top:6px">'+flagFields(row)+'</div>';
  } else if(row.kind==='dynPath'||row.kind==='dynOrient'||row.kind==='dynSptp'){
    body='<div class="sim-dyngrid">'+dynMini(row,'v','Velocity')+dynMini(row,'acc','Acceleration')+dynMini(row,'dec','Deceleration')+dynMini(row,'jerk','Jerk')+'</div>'+
      '<div class="sim-note">Applies to all following commands using default dynamics ('+(row.kind==='dynPath'?'cmdParameters.pathDynamics':row.kind==='dynOrient'?'cmdParameters.orientationDynamics':'cmdParameters.pathDynamics for sPTP')+'), &sect;3.6.</div>';
  } else if(row.kind==='flagOnly'){
    body='<div class="sim-fields">'+flagFields(row)+'</div><div class="sim-note">No motion &mdash; only the flag switches. Modes 5, 25 and 26 pause execution until acknowledged (&sect;3.11).</div>';
  } else if(row.kind==='wait'){
    body='<div class="sim-fields">'+fieldNum(row.id,'ms','Duration ms',row.ms,0,6000,50)+'</div>'+
      '<div class="sim-note">Stored in cmdParameters.pathDynamics.velocity [ms] &mdash; the MotionQueue runs empty, velocity = 0 (&sect;3.12).</div>';
  }
  var cls='sim-row '+(meta.acc||'');
  if(row.id===focusId) cls+=' sim-focused';
  if(runner.idx===idx && isBusy()) cls+=' sim-executing';
  return '<div class="'+cls+'" data-row="'+row.id+'" data-idx="'+idx+'">'+
    '<div class="sim-rhead"><span class="sim-idx">'+(idx+1)+'</span><span class="sim-tag">'+meta.short+' &middot; cmdType '+meta.cmdType+'</span>'+
    '<span class="sim-sub">'+meta.label+'</span>'+
    '<span class="sim-rbtns">'+
      '<button class="sim-rbtn" data-act="up" data-id="'+row.id+'" title="Move up">&uarr;</button>'+
      '<button class="sim-rbtn" data-act="down" data-id="'+row.id+'" title="Move down">&darr;</button>'+
      '<button class="sim-rbtn" data-act="del" data-id="'+row.id+'" title="Delete">&times;</button>'+
    '</span></div>'+body+'</div>';
}
function renderList(){
  var body=$('#simListBody');
  body.innerHTML=cmds.map(function(r,i){return rowHTML(r,i);}).join('');
  renderProgress();
}
function renderProgress(){
  var wrap=$('#simProgress'); wrap.innerHTML='';
  timeline.forEach(function(e,i){
    var t=document.createElement('div'); t.className='sim-tick';
    if(i<runner.idx || (i===runner.idx && runner.state==='done')) t.className+=' sim-tick-done';
    if(i===runner.idx && isBusy()) t.className+=' sim-tick-cur';
    t.title='Cmd '+(i+1)+' · '+CMD_META[e.kind].label;
    t.addEventListener('click',function(){ focusId=e.row.id; followLive=false; renderList(); draw(); updateFollowLink(); });
    wrap.appendChild(t);
  });
}
function updateFollowLink(){
  var link=$('#simFollowLink');
  link.hidden = followLive;
}

/* ---------------------------------------------------------------------
   Outputs panel
--------------------------------------------------------------------- */
function statusWord(){
  var e=currentEntry();
  if(runner.state==='idle') return STATUS.noCall;
  if(runner.state==='interrupted') return STATUS.interrupted;
  if(runner.state==='stopped') return STATUS.aborted;
  if(runner.state==='done') return STATUS.finished;
  if(runner.state==='waiting-ack') return STATUS.waiting;
  if(!e) return STATUS.noCall;
  if(e.kind==='lin') return STATUS.lin;
  if(e.kind==='circ') return STATUS.circ;
  if(e.kind==='ptp') return STATUS.ptp;
  if(e.kind==='wait') return STATUS.waiting;
  return STATUS.cfg;
}
function stateChipInfo(){
  switch(runner.state){
    case 'running': case 'paused-step': return ['Running','sim-st-run'];
    case 'interrupted': return ['Interrupted','sim-st-int'];
    case 'stopped': return ['Stopped','sim-st-stop'];
    case 'waiting-ack': return ['Waiting','sim-st-wait'];
    case 'done': return ['Done','sim-st-done'];
    default: return ['Idle',''];
  }
}
function updateOutputs(){
  var busy=isBusy();
  var active=(runner.state==='running');
  var e=currentEntry();
  var chip=stateChipInfo();
  $('#simStateChip').className='sim-state '+chip[1]; $('#simStateChip').textContent=chip[0];
  $('#simActiveCmd').textContent='Executing: '+(e?('Cmd '+(runner.idx+1)+' · '+CMD_META[e.kind].label):'—');
  var vel=0;
  if(active && e && e.geom.type!=='point' && e.ms){
    var f = e.kind==='ptp'? BASE_SPTP_SPEED : BASE_PATH_SPEED;
    vel = (e.len||0)/(e.ms/1000);
  }
  $('#simVelocity').textContent='Path velocity: '+fmt(vel,0)+' mm/s';
  updateFollowLink();

  var remain='—';
  if(e){
    if(e.kind==='wait'){ remain=fmt(Math.max(0,e.ms-runner.progMs),0)+' ms'; }
    else if(e.kind==='ptp'){ remain=fmt(clamp(runner.progMs/Math.max(1,e.ms),0,1)*100,0)+' % (execution time)'; }
    else if(e.geom.type==='point'){ remain='0.0 mm'; }
    else { remain=fmt(Math.max(0,(e.len||0)*(1-clamp(runner.progMs/Math.max(1,e.ms),0,1))),0)+' mm'; }
  }
  var grid=$('#simOutGrid');
  var rows=[
    ['done', runner.state==='done'?'TRUE':'FALSE', runner.state==='done'?'sim-on':''],
    ['busy', busy?'TRUE':'FALSE', busy?'sim-on':''],
    ['active', active?'TRUE':'FALSE', active?'sim-on':''],
    ['commandAborted', runner.state==='stopped'?'TRUE':'FALSE', runner.state==='stopped'?'sim-err':''],
    ['error', 'FALSE', ''],
    ['status', statusWord(), ''],
    ['activePathData', 'PATH_LAB', ''],
    ['activeCmdNo', e?String(runner.idx+1):'0', ''],
    ['remainingDistanceActCmd', remain, ''],
    ['readyForNextPath', (runner.state==='done')?'TRUE':'FALSE', '']
  ];
  grid.innerHTML=rows.map(function(r){return '<dt>'+r[0]+'</dt><dd class="'+r[2]+'">'+r[1]+'</dd>';}).join('');

  $('#simExecute').disabled = (runner.state==='running'||runner.state==='interrupted'||runner.state==='waiting-ack');
  $('#simContinue').disabled = (runner.state!=='interrupted');
  $('#simInterrupt').disabled = (runner.state!=='running');
  $('#simStop').disabled = !busy;
  $('#simReset').disabled = busy;
  $('#simAck').hidden = (runner.state!=='waiting-ack');

  renderFlags();
}
function renderFlags(){
  var strip=$('#simFlagStrip'); strip.innerHTML='';
  var e=currentEntry();
  for(var i=0;i<FLAG_COUNT;i++){
    var b=document.createElement('button');
    b.type='button'; b.className='sim-flag'+(flags[i]?' sim-on':'')+((runner.state==='waiting-ack'&&e&&e.flagNo===i)?' sim-wait':'');
    b.textContent=i; b.title='flags['+i+']';
    (function(i){ b.addEventListener('click',function(){ toggleFlag(i); }); })(i);
    strip.appendChild(b);
  }
}

/* ---------------------------------------------------------------------
   Canvas drawing
--------------------------------------------------------------------- */
var canvas=$('#simCanvas'), ctx=canvas.getContext('2d');
function fitCanvas(){
  var w=canvas.clientWidth||480; var h=w*0.75;
  var dpr=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function worldBounds(){
  var xs=[0],ys=[0];
  motionSamples.forEach(function(p){xs.push(p.x);ys.push(p.y);});
  timeline.forEach(function(e){
    if(e.geom.type==='arc'){ xs.push(e.geom.g.cx); ys.push(e.geom.g.cy); }
    if(e.geom.auxX!==undefined){ xs.push(e.geom.auxX); ys.push(e.geom.auxY); }
  });
  var xMin=Math.min.apply(null,xs), xMax=Math.max.apply(null,xs);
  var yMin=Math.min.apply(null,ys), yMax=Math.max.apply(null,ys);
  var spanX=Math.max(120,xMax-xMin), spanY=Math.max(90,yMax-yMin);
  var padX=spanX*0.18+20, padY=spanY*0.18+20;
  return {xMin:xMin-padX,xMax:xMax+padX,yMin:yMin-padY,yMax:yMax+padY};
}
function makeXform(){
  var b=worldBounds();
  var w=canvas.clientWidth||480, h=w*0.75;
  var sx=w/(b.xMax-b.xMin), sy=h/(b.yMax-b.yMin);
  var s=Math.min(sx,sy);
  var offX=(w-(b.xMax-b.xMin)*s)/2, offY=(h-(b.yMax-b.yMin)*s)/2;
  return function(x,y){ return {x:offX+(x-b.xMin)*s, y:h-(offY+(y-b.yMin)*s)}; };
}
function draw(){
  fitCanvas();
  var w=canvas.clientWidth||480, h=w*0.75;
  var C={ line:css('--line-soft')||'#ccc', textDim:css('--text-dim')||'#888', surface2:css('--surface-2')||'#eee',
          accent:css('--accent')||'#00868A', accent2:css('--accent-2')||'#15B7B0', pink:css('--pink')||'#C23C84',
          amber:css('--amber')||'#C97A05', blue:css('--blue')||'#2D6FD6', text:css('--text')||'#111', ok:css('--ok')||'#178',
          warn:css('--warn')||'#a70' };
  ctx.clearRect(0,0,w,h);
  var xf=makeXform();

  // grid
  var b=worldBounds();
  var step=niceStep((b.xMax-b.xMin)/6);
  ctx.strokeStyle=C.line; ctx.lineWidth=1; ctx.font='10px '+((css('--f-mono')||'monospace'));
  ctx.fillStyle=C.textDim;
  for(var gx=Math.ceil(b.xMin/step)*step; gx<=b.xMax; gx+=step){
    var p1=xf(gx,b.yMin), p2=xf(gx,b.yMax);
    ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.stroke();
  }
  for(var gy=Math.ceil(b.yMin/step)*step; gy<=b.yMax; gy+=step){
    var q1=xf(b.xMin,gy), q2=xf(b.xMax,gy);
    ctx.beginPath(); ctx.moveTo(q1.x,q1.y); ctx.lineTo(q2.x,q2.y); ctx.stroke();
  }
  var org=xf(0,0);
  ctx.fillStyle=C.textDim; ctx.fillText('WCS 0,0',org.x+5,org.y-5);
  ctx.beginPath(); ctx.arc(org.x,org.y,2.5,0,7); ctx.fillStyle=C.text; ctx.fill();

  // trail: draw per motion-entry, colour lerp along total cumulative length; ptp dashed pink
  timeline.forEach(function(e,i){
    if(e.geom.type==='point') return;
    ctx.lineWidth = (focusIsEntry(e)?4:2.6);
    if(e.kind==='ptp'){
      ctx.setLineDash([7,6]); ctx.strokeStyle=C.pink; ctx.beginPath();
      e.samples.forEach(function(p,j){ var s=xf(p.x,p.y); j===0?ctx.moveTo(s.x,s.y):ctx.lineTo(s.x,s.y); });
      ctx.stroke(); ctx.setLineDash([]);
    } else {
      var n=e.samples.length;
      for(var j=1;j<n;j++){
        var t0=(e.cumStart+(e.cumEnd-e.cumStart)*(j-1)/(n-1))/Math.max(1,totalLen);
        var col=colLerp(C.accent,C.accent2,clamp(t0,0,1));
        var a=xf(e.samples[j-1].x,e.samples[j-1].y), c=xf(e.samples[j].x,e.samples[j].y);
        ctx.strokeStyle=col; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(c.x,c.y); ctx.stroke();
      }
    }
    if(e.blended && e.blendGhost){
      var gp=xf(e.blendGhost.x,e.blendGhost.y);
      ctx.beginPath(); ctx.arc(gp.x,gp.y,4,0,7); ctx.strokeStyle=C.textDim; ctx.lineWidth=1.5; ctx.stroke();
    }
  });

  // static markers: flag / flagOnly / wait
  timeline.forEach(function(e){
    var pp=xf(e.start.x,e.start.y);
    if(e.kind==='flagOnly'){
      ctx.fillStyle = e.flagMode>=20&&e.flagMode<=22 ? C.textDim : (isWaitMode(e.flagMode)?C.blue:C.amber);
      ctx.beginPath(); ctx.rect(pp.x-5,pp.y-9,10,6); ctx.fill();
      ctx.beginPath(); ctx.moveTo(pp.x,pp.y-9); ctx.lineTo(pp.x,pp.y+9); ctx.strokeStyle=C.text; ctx.lineWidth=1.4; ctx.stroke();
    } else if(e.kind==='wait'){
      ctx.setLineDash([3,3]); ctx.strokeStyle=C.blue; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.arc(pp.x,pp.y,10,0,7); ctx.stroke(); ctx.setLineDash([]);
    } else if(e.flagNo>=0 && e.flagMode>0 && e.geom.type!=='point'){
      var atStart=[1,2,3,5,20].indexOf(e.flagMode)>=0;
      var mp= atStart? xf(e.start.x,e.start.y) : xf(e.end.x,e.end.y);
      ctx.fillStyle= isWaitMode(e.flagMode)?C.blue:C.amber;
      ctx.beginPath(); ctx.rect(mp.x-5,mp.y-15,10,6); ctx.fill();
      ctx.beginPath(); ctx.moveTo(mp.x,mp.y-15); ctx.lineTo(mp.x,mp.y+3); ctx.strokeStyle=C.text; ctx.lineWidth=1.2; ctx.stroke();
    }
  });

  // geometry helpers for focused / live entry
  var fe=focusEntry();
  if(fe && fe.geom.type==='arc'){
    var g=fe.geom.g, cp=xf(g.cx,g.cy);
    ctx.setLineDash([4,4]); ctx.strokeStyle=C.amber; ctx.lineWidth=1.4;
    ctx.beginPath();
    for(var k=0;k<=64;k++){var ang=k/64*2*Math.PI, wp=xf(g.cx+g.radius*Math.cos(ang), g.cy+g.radius*Math.sin(ang)); k===0?ctx.moveTo(wp.x,wp.y):ctx.lineTo(wp.x,wp.y);}
    ctx.stroke(); ctx.setLineDash([]);
    var sp=xf(fe.start.x,fe.start.y);
    ctx.beginPath(); ctx.moveTo(cp.x,cp.y); ctx.lineTo(sp.x,sp.y); ctx.strokeStyle=C.amber; ctx.lineWidth=1.2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cp.x-6,cp.y); ctx.lineTo(cp.x+6,cp.y); ctx.moveTo(cp.x,cp.y-6); ctx.lineTo(cp.x,cp.y+6); ctx.strokeStyle=C.amber; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle=C.textDim; ctx.fillText('r='+fmt(g.radius,0)+'mm', cp.x+8, cp.y-8);
    if(fe.geom.circMode===0 || fe.geom.circMode===1){
      var axp = fe.geom.circMode===1? {x:fe.row.auxX,y:fe.row.auxY} : {x:fe.geom.auxX,y:fe.geom.auxY};
      var av=xf(axp.x,axp.y);
      ctx.save(); ctx.translate(av.x,av.y); ctx.rotate(Math.PI/4); ctx.fillStyle=C.blue; ctx.fillRect(-5,-5,10,10); ctx.restore();
      ctx.fillStyle=C.textDim; ctx.fillText('aux', av.x+8, av.y-8);
    }
  }

  // tool marker
  var pose=runner.pose;
  var tp=xf(pose.x,pose.y);
  ctx.beginPath(); ctx.arc(tp.x,tp.y,7,0,7); ctx.fillStyle=C.text; ctx.fill();
  ctx.beginPath(); ctx.arc(tp.x,tp.y,7,0,7); ctx.strokeStyle=C.accent2; ctx.lineWidth=2; ctx.stroke();
  var rad=d2r(pose.a);
  ctx.beginPath(); ctx.moveTo(tp.x,tp.y); ctx.lineTo(tp.x+15*Math.cos(rad),tp.y-15*Math.sin(rad));
  ctx.strokeStyle=C.pink; ctx.lineWidth=2.4; ctx.stroke();
}
function focusIsEntry(e){ var fe=focusEntry(); return fe===e; }
function focusEntry(){
  if(focusId){ for(var i=0;i<timeline.length;i++){ if(timeline[i].row.id===focusId) return timeline[i]; } }
  if(followLive){ return currentEntry(); }
  return null;
}

/* ---------------------------------------------------------------------
   Event wiring
--------------------------------------------------------------------- */
function setDeep(obj,path,val){
  var parts=path.split('.');
  var o=obj; for(var i=0;i<parts.length-1;i++) o=o[parts[i]];
  o[parts[parts.length-1]]=val;
}
function getDeep(obj,path){
  var parts=path.split('.'); var o=obj; for(var i=0;i<parts.length;i++) o=o[parts[i]]; return o;
}
function findRow(id){ for(var i=0;i<cmds.length;i++) if(cmds[i].id===id) return cmds[i]; return null; }

$('#simListBody').addEventListener('click',function(ev){
  var actBtn=ev.target.closest('[data-act]');
  if(actBtn){
    ev.stopPropagation();
    var id=actBtn.getAttribute('data-id'), act=actBtn.getAttribute('data-act');
    var idx=cmds.findIndex(function(r){return r.id===id;});
    if(idx<0) return;
    if(act==='del'){ cmds.splice(idx,1); }
    else if(act==='up' && idx>0){ var t=cmds[idx-1]; cmds[idx-1]=cmds[idx]; cmds[idx]=t; }
    else if(act==='down' && idx<cmds.length-1){ var t2=cmds[idx+1]; cmds[idx+1]=cmds[idx]; cmds[idx]=t2; }
    stopRunnerHard(); runner.state='idle'; rebuild();
    return;
  }
  var rowEl=ev.target.closest('.sim-row');
  if(rowEl && !ev.target.closest('input,select')){
    var rid=rowEl.getAttribute('data-row');
    focusId=(focusId===rid)?null:rid; followLive=!focusId;
    renderList(); draw(); updateFollowLink();
  }
});
$('#simListBody').addEventListener('input',function(ev){
  var t=ev.target;
  if(t.tagName!=='INPUT' && t.tagName!=='SELECT') return;
  var id=t.getAttribute('data-id'), field=t.getAttribute('data-field');
  if(!id||!field) return;
  var row=findRow(id); if(!row) return;
  var val = t.tagName==='SELECT' ? (isNaN(Number(t.value))||t.value==='keep'||t.value==='default'||t.value==='manual'? t.value : Number(t.value)) : Number(t.value);
  setDeep(row,field,val);
  stopRunnerHard(); runner.state='idle';
  rebuild();
  var again=document.querySelector('[data-id="'+id+'"][data-field="'+field+'"]');
  if(again) again.focus();
});

ADD_ORDER.forEach(function(k){
  var opt=document.createElement('option'); opt.value=k; opt.textContent=CMD_META[k].label+' (cmdType '+CMD_META[k].cmdType+')';
  $('#simAddType').appendChild(opt);
});
$('#simAddBtn').addEventListener('click',function(){
  var k=$('#simAddType').value;
  cmds.push(newRow(k));
  stopRunnerHard(); runner.state='idle'; rebuild();
  var body=$('#simListBody'); body.scrollTop=body.scrollHeight;
});
$('#simReseed').addEventListener('click',seed);

$('#simExecute').addEventListener('click',doExecute);
$('#simStop').addEventListener('click',doStop);
$('#simInterrupt').addEventListener('click',doInterrupt);
$('#simContinue').addEventListener('click',doContinue);
$('#simReset').addEventListener('click',doReset);
$('#simAck').addEventListener('click',doAck);
$('#simSeqMode').addEventListener('change',function(){ sequenceMode=Number(this.value); });
$('#simOverride').addEventListener('input',function(){ overrideFactor=Number(this.value); $('#simOverrideVal').textContent=Math.round(overrideFactor*100)+'%'; });
$('#simFollowLink').addEventListener('click',function(){ focusId=null; followLive=true; renderList(); draw(); updateFollowLink(); });

window.addEventListener('resize',function(){ draw(); });
try{
  new ResizeObserver(function(){ draw(); }).observe(canvas.parentElement);
}catch(e){}
try{
  new MutationObserver(function(){ draw(); }).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
}catch(e){}
try{
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){ draw(); });
}catch(e){}

/* ---------------------------------------------------------------------
   Boot: seed example path and start it running at rest
--------------------------------------------------------------------- */
seed();
sequenceMode=0; $('#simSeqMode').value='0';
if(!reduced()){
  setTimeout(function(){ doExecute(); },500);
} else {
  runner.idx=timeline.length-1; runner.state='done'; runner.pose=timeline.length?{x:timeline[timeline.length-1].end.x,y:timeline[timeline.length-1].end.y,a:timeline[timeline.length-1].end.a}:{x:40,y:40,a:0};
  renderList(); updateOutputs(); draw();
}


}

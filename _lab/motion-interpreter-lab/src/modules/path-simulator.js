import { qs, qsa } from '../lib/dom.js';
import { clamp, lerp } from '../lib/math.js';
import { velocityColour } from '../lib/colour.js';
import { registerTicker } from '../lib/ticker.js';
import { visibility, observeVisibility } from '../lib/visibility.js';
import { sizeCanvas } from '../lib/canvas.js';
import { renderSourceLines, buildPreset1, buildPreset2, buildPreset3 } from '../data/presets.js';

/* ============================================================
   S4 — MCL PATH SIMULATOR
   ============================================================ */
export function init(){
  var section = qs("#s4");
  if(!section) return;

  var PRESETS = [ buildPreset1(), buildPreset2(), buildPreset3() ];
  var PRESET_META = [
    { a:2000, d:2000, vc:80 },
    { a:2000, d:3000, vc:60 },
    { a:2000, d:3000, vc:50 }
  ];
  var PRESET_NOTES = [
    "<p>The gripper model from the Getting Started manual: the gripper reports &ldquo;closed&rdquo; 400&nbsp;ms after CloseGripper is written, and &ldquo;opened&rdquo; 200&nbsp;ms after OpenGripper is written. The lamp beside the canvas goes amber while <code>waitEvent()</code> is pending and green once the event arrives.</p>",
    "<p>A short 4-corner path, chosen so the setTrans / setBlend / setBlendDist controls above are easy to read against a simple shape. Try trans&nbsp;=&nbsp;0 at every corner, then trans&nbsp;=&nbsp;2 with a growing blendDist.</p>",
    "<p>Modal parameters are initialised from the TO&rsquo;s DynamicDefaults when the MCL program is loaded and keep their value until changed. A value given directly in a motion instruction applies to THAT instruction only and does not overwrite the modal value. Values are limited to the lowest of the TO DynamicLimits, the modal max set by setDynMax/setAxisDynMax/setOriDynMax, and the value in the job.</p>" +
      "<p style=\"font-size:0.85rem;\">(Start point and Pos1&rsquo;s target are illustrative for this simulator &mdash; the manual&rsquo;s listing gives values only for the dynamic parameters, not for Pos1 itself.)</p>" +
      "<pre class=\"code-block syntax-card\">linAbs( &lt;pos&gt; [,v := &lt;value&gt;] [,a := &lt;value&gt;] [,d := &lt;value&gt;] [,j := &lt;value&gt;]\n        [,trans := &lt;value&gt;] [,blend := &lt;value&gt;] [,blendDist := &lt;value&gt;]\n        [,cs := &lt;value&gt;] [,oDirA := &lt;value&gt;] );</pre>" +
      "<p style=\"font-size:0.85rem;\">cs: 0 WCS &middot; 1 OCS1 &middot; 2 OCS2 &middot; 3 OCS3. oDirA: 1 positive &middot; 2 negative &middot; 3 shortest path (default 3; only relevant for up to 4 interpolating kinematics axes; B and C coordinates only relevant with more than 4 interpolating axes).</p>"
  ];

  var els = {
    tabs: [qs("#presetTab0"), qs("#presetTab1"), qs("#presetTab2")],
    source: qs("#mclSource"),
    canvas: qs("#mclCanvas"),
    zFill: qs("#zGaugeFill"), zVal: qs("#zGaugeVal"), zGauge: qs("#zGauge"),
    lamp: qs("#gripperLamp"), lampLabel: qs("#gripperLampLabel"),
    reset: qs("#mclReset"), play: qs("#mclPlay"), playIcon: qs("#mclPlayIcon"), step: qs("#mclStep"),
    scrub: qs("#mclScrub"), timeVal: qs("#mclTimeVal"),
    ovr: qs("#mclOvr"), ovrVal: qs("#mclOvrVal"),
    trans: [qs("#mclTrans0"), qs("#mclTrans1"), qs("#mclTrans2")],
    blend: [qs("#mclBlend0"), qs("#mclBlend1"), qs("#mclBlend2")],
    blendDist: qs("#mclBlendDist"), blendDistVal: qs("#mclBlendDistVal"),
    formula: qs("#mclFormula"),
    note: qs("#presetNote")
  };

  var state = {
    presetIdx:0, trans:0, blend:2, blendDist:-1, ovr:100,
    playing:false, currentMs:0, totalMs:1,
    PP:[], pauseWindows:[], vmaxRamp:100, zMax:1, is3d:false
  };

  function dist3(a,b){
    var dx=b.x-a.x, dy=b.y-a.y, dz=(b.z||0)-(a.z||0);
    return Math.sqrt(dx*dx+dy*dy+dz*dz);
  }

  function trapProfile(L, v0, v1, a, d, vc){
    v0 = Math.max(0,v0); v1 = Math.max(0,v1); vc = Math.max(vc, v0, v1, 0.001);
    L = Math.max(0,L);
    var d1 = (vc*vc - v0*v0)/(2*a);
    var d2 = (vc*vc - v1*v1)/(2*d);
    var vp, x1, x2, cruiseLen;
    if(d1>=0 && d2>=0 && (d1+d2) <= L){
      vp = vc; x1 = d1; x2 = d2; cruiseLen = L - d1 - d2;
    }else{
      var num = L + v0*v0/(2*a) + v1*v1/(2*d);
      var den = 1/(2*a) + 1/(2*d);
      vp = Math.sqrt(Math.max(0, num/den));
      vp = Math.max(vp, v0, v1);
      x1 = (vp*vp - v0*v0)/(2*a); if(!isFinite(x1) || x1<0) x1 = 0;
      x2 = (vp*vp - v1*v1)/(2*d); if(!isFinite(x2) || x2<0) x2 = 0;
      var sum = x1+x2;
      if(sum > L && sum>0){ x1 = x1/sum*L; x2 = x2/sum*L; }
      cruiseLen = Math.max(0, L - x1 - x2);
    }
    var t1 = a>0 ? (vp-v0)/a : 0; if(t1<0) t1=0;
    var t3 = d>0 ? (vp-v1)/d : 0; if(t3<0) t3=0;
    var t2 = vp>0 ? cruiseLen/vp : 0;
    return { v0:v0,v1:v1,vp:vp, x1:x1,x2:x2,cruiseLen:cruiseLen, t1:t1,t2:t2,t3:t3,
      totalT:t1+t2+t3, totalX:x1+cruiseLen+x2, a:a, d:d };
  }

  function sampleProfile(prof, nEach){
    var pts = [];
    var tAcc0=0, tAcc1=prof.t1;
    var tCru0=prof.t1, tCru1=prof.t1+prof.t2;
    var tDec0=prof.t1+prof.t2, tDec1=prof.t1+prof.t2+prof.t3;
    if(prof.t1>0){
      for(var i=0;i<=nEach;i++){
        var t = tAcc0 + prof.t1*(i/nEach);
        var dt = t-tAcc0;
        pts.push({ t:t, x: prof.v0*dt + 0.5*prof.a*dt*dt, v: prof.v0 + prof.a*dt });
      }
    }else{
      pts.push({t:0,x:0,v:prof.v0});
    }
    if(prof.t2>0){
      for(var i2=1;i2<=nEach;i2++){
        var t2 = tCru0 + prof.t2*(i2/nEach);
        pts.push({ t:t2, x: prof.x1 + prof.vp*(t2-tCru0), v: prof.vp });
      }
    }
    if(prof.t3>0){
      for(var i3=1;i3<=nEach;i3++){
        var t3 = tDec0 + prof.t3*(i3/nEach);
        var dt3 = t3-tDec0;
        pts.push({ t:t3, x: prof.x1+prof.cruiseLen + (prof.vp*dt3 - 0.5*prof.d*dt3*dt3), v: Math.max(0,prof.vp - prof.d*dt3) });
      }
    }else{
      pts.push({t:prof.totalT, x:prof.totalX, v:prof.v1});
    }
    return pts;
  }

  /* build the pure move-node list (with pausedAfter flags) from a preset's job array */
  function buildNodes(jobs){
    var nodes = [];
    for(var i=0;i<jobs.length;i++){
      var j = jobs[i];
      if(j.type === "move"){
        var node = { x:j.x, y:j.y, z:j.z||0, line:j.line, pausedAfter:false };
        var nxt = jobs[i+1];
        if(nxt && nxt.type === "pause"){
          node.pausedAfter = true;
          node.pauseLabel = nxt.pauseLabel;
          node.pauseMs = nxt.pauseMs;
        }
        nodes.push(node);
      }
    }
    return nodes;
  }

  /* full rebuild of the drawable/playable timeline for the current preset + controls */
  function rebuild(){
    var preset = PRESETS[state.presetIdx];
    var meta = PRESET_META[state.presetIdx];
    var jobs = preset.jobs;
    var nodes = buildNodes(jobs);
    var n = nodes.length;

    var ovrScale = (state.ovr/100) * 0.5;
    var a = meta.a * ovrScale, d = meta.d * ovrScale, vc = meta.vc * ovrScale;

    var segLen = [];
    for(var k=0;k<n-1;k++) segLen.push(dist3(nodes[k], nodes[k+1]));

    var peak = segLen.map(function(L){ return trapProfile(L,0,0,a,d,vc).vp; });
    var nominalPeak = segLen.map(function(L){ return trapProfile(L,0,0, meta.a*0.5, meta.d*0.5, meta.vc*0.5).vp; });
    state.vmaxRamp = Math.max.apply(null, nominalPeak.concat([0.001]));

    var blendOK = (state.trans !== 0) && (state.blend !== 1);
    var blended = new Array(n); var transitSpeed = new Array(n); var R = new Array(n);
    for(var k2=1;k2<n-1;k2++){
      var can = blendOK && !nodes[k2].pausedAfter;
      blended[k2] = can;
      if(can){
        var pA = peak[k2-1], pB = peak[k2];
        transitSpeed[k2] = state.trans===1 ? Math.min(pA,pB) : Math.max(pA,pB);
        var maxR = 0.5*Math.min(segLen[k2-1], segLen[k2]);
        R[k2] = state.blendDist < 0 ? maxR : Math.min(state.blendDist, maxR);
      }
    }

    var PP = [];
    var cum = 0;
    var pauseWindows = [];

    function lastPos(){ return PP.length ? PP[PP.length-1] : {x:nodes[0].x,y:nodes[0].y,z:nodes[0].z}; }

    /* leading flow jobs (setup lines, before the first move) */
    for(var fi=0; fi<jobs.length && jobs[fi].type!=="move"; fi++){
      var fj = jobs[fi];
      if(fj.type==="flow"){
        PP.push({t:cum, x:fj.x, y:fj.y, z:fj.z||0, speed:0, line:fj.line});
        cum += fj.ms;
      }
    }

    PP.push({t:cum, x:nodes[0].x, y:nodes[0].y, z:nodes[0].z, speed:0, line:nodes[0].line});

    for(var k3=0;k3<n-1;k3++){
      var A = nodes[k3], B = nodes[k3+1];
      var L = segLen[k3];
      var dir = L>0 ? {x:(B.x-A.x)/L, y:(B.y-A.y)/L, z:(B.z-A.z)/L} : {x:0,y:0,z:0};
      var trimStart = (k3>0 && blended[k3]) ? R[k3] : 0;
      var trimEnd = (k3+1<n-1 && blended[k3+1]) ? R[k3+1] : 0;
      var Lp = Math.max(0, L - trimStart - trimEnd);
      var vStart = (k3>0 && blended[k3]) ? transitSpeed[k3] : 0;
      var vEnd = (k3+1<n-1 && blended[k3+1]) ? transitSpeed[k3+1] : 0;

      /* if this node had a pause before departing, insert dwell here */
      if(k3>0 && nodes[k3].pausedAfter){
        pauseWindows.push({t0:cum, t1:cum+nodes[k3].pauseMs, label:nodes[k3].pauseLabel});
        PP.push({t:cum, x:A.x,y:A.y,z:A.z, speed:0, line:nodes[k3].line, pauseLabel:nodes[k3].pauseLabel});
        cum += nodes[k3].pauseMs;
        PP.push({t:cum, x:A.x,y:A.y,z:A.z, speed:0, line:nodes[k3].line});
      }

      var startPt = { x:A.x+dir.x*trimStart, y:A.y+dir.y*trimStart, z:A.z+dir.z*trimStart };
      var endPt   = { x:B.x-dir.x*trimEnd,   y:B.y-dir.y*trimEnd,   z:B.z-dir.z*trimEnd };

      var prof = trapProfile(Lp, vStart, vEnd, a, d, vc);
      var samples = sampleProfile(prof, 9);
      for(var s=0;s<samples.length;s++){
        var frac = prof.totalX>0 ? samples[s].x/prof.totalX : 0;
        PP.push({
          t: cum + samples[s].t*1000,
          x: lerp(startPt.x, endPt.x, frac), y: lerp(startPt.y, endPt.y, frac), z: lerp(startPt.z, endPt.z, frac),
          speed: samples[s].v, line: nodes[k3].line
        });
      }
      cum += prof.totalT*1000;

      /* corner arc into the NEXT segment, if this node's far end blends */
      if(k3+1 < n-1 && blended[k3+1]){
        var C = nodes[k3+1];
        var dir2Len = segLen[k3+1];
        var dir2 = dir2Len>0 ? {x:(nodes[k3+2].x-C.x)/dir2Len, y:(nodes[k3+2].y-C.y)/dir2Len, z:(nodes[k3+2].z-C.z)/dir2Len} : {x:0,y:0,z:0};
        var nextStart = { x:C.x+dir2.x*R[k3+1], y:C.y+dir2.y*R[k3+1], z:C.z+dir2.z*R[k3+1] };
        var arcSteps = 10;
        var vT = Math.max(1, transitSpeed[k3+1]);
        var arcLen = dist3(endPt, nextStart);
        var arcDur = (arcLen / vT) * 1000;
        for(var ai=1; ai<=arcSteps; ai++){
          var tt = ai/arcSteps;
          var omt = 1-tt;
          /* quadratic bezier through control = C (node) for blend=0 "direct"; cubic-ish easing for blend=2 "geometric" */
          var bx, by, bz;
          if(state.blend === 0){
            bx = omt*omt*endPt.x + 2*omt*tt*C.x + tt*tt*nextStart.x;
            by = omt*omt*endPt.y + 2*omt*tt*C.y + tt*tt*nextStart.y;
            bz = lerp(endPt.z, nextStart.z, tt);
          }else{
            var ease = tt*tt*(3-2*tt);
            var qx = omt*omt*endPt.x + 2*omt*tt*C.x + tt*tt*nextStart.x;
            var qy = omt*omt*endPt.y + 2*omt*tt*C.y + tt*tt*nextStart.y;
            bx = lerp(lerp(endPt.x,nextStart.x,tt), qx, 0.6);
            by = lerp(lerp(endPt.y,nextStart.y,tt), qy, 0.6);
            bz = lerp(endPt.z, nextStart.z, ease);
          }
          PP.push({ t: cum + arcDur*tt, x:bx, y:by, z:bz, speed:vT, line: nodes[k3].line, isCorner:true });
        }
        cum += arcDur;
      }
    }

    /* trailing flow jobs (after the last move) */
    for(var ti=jobs.length-1; ti>=0 && jobs[ti].type!=="move"; ti--){ /* find start of trailing block */ }
    var lastMoveJobIdx = -1;
    for(var mi=0; mi<jobs.length; mi++){ if(jobs[mi].type==="move") lastMoveJobIdx = mi; }
    for(var tj=lastMoveJobIdx+1; tj<jobs.length; tj++){
      var tfj = jobs[tj];
      if(tfj.type==="flow"){
        var lp = lastPos();
        PP.push({t:cum, x:lp.x, y:lp.y, z:lp.z, speed:0, line:tfj.line});
        cum += tfj.ms;
      }
    }
    var finalPos = lastPos();
    PP.push({t:cum, x:finalPos.x, y:finalPos.y, z:finalPos.z, speed:0, line: PP[PP.length-1].line});

    state.PP = PP;
    state.totalMs = Math.max(1, cum);
    state.pauseWindows = pauseWindows;
    state.is3d = !!preset.is3d;
    var zVals = nodes.map(function(nd){ return nd.z||0; });
    state.zMax = Math.max.apply(null, zVals.concat([1]));

    drawStaticPath();
  }

  /* ---- canvas ---- */
  var ctx = els.canvas.getContext("2d");
  var cssW=0, cssH=0;
  var fitBox = {minX:0,maxX:1,minY:0,maxY:1};
  sizeCanvas(els.canvas, function(w,h){ cssW=w; cssH=h; drawStaticPath(); });

  function computeFit(){
    var minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    state.PP.forEach(function(p){
      if(p.x<minX)minX=p.x; if(p.x>maxX)maxX=p.x;
      if(p.y<minY)minY=p.y; if(p.y>maxY)maxY=p.y;
    });
    if(!isFinite(minX)){ minX=0;maxX=1;minY=0;maxY=1; }
    var spanX = Math.max(1,maxX-minX), spanY = Math.max(1,maxY-minY);
    fitBox = {minX:minX,maxX:maxX,minY:minY,maxY:maxY,spanX:spanX,spanY:spanY};
  }
  function toScreen(x,y){
    var pad=0.12;
    var scale = Math.min((1-2*pad)*cssW/fitBox.spanX, (1-2*pad)*cssH/fitBox.spanY);
    var ox = (cssW - fitBox.spanX*scale)/2;
    var oy = (cssH - fitBox.spanY*scale)/2;
    return { x: ox + (x-fitBox.minX)*scale, y: cssH - (oy + (y-fitBox.minY)*scale) };
  }

  /* engineering-plot ground: a mm grid on the fitted extent, axis ticks, and
     a marker on every commanded stop so the geometry reads spatially. */
  function niceStep(span){
    var raw = span/5, mag = Math.pow(10, Math.floor(Math.log(raw)/Math.LN10));
    var n = raw/mag;
    return (n<1.5?1:n<3.5?2:n<7.5?5:10)*mag;
  }
  function drawPlotGround(sctx){
    var cs = getComputedStyle(document.documentElement);
    var gridCol = cs.getPropertyValue("--ix-bdr").trim() || "rgba(35,48,60,0.15)";
    var tickCol = cs.getPropertyValue("--ix-weak").trim() || "rgba(0,10,20,0.4)";
    var step = niceStep(Math.max(fitBox.spanX, fitBox.spanY));
    sctx.save();
    sctx.lineWidth = 1;
    sctx.strokeStyle = gridCol;
    sctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
    sctx.fillStyle = tickCol;
    var x0 = Math.ceil(fitBox.minX/step)*step, y0 = Math.ceil(fitBox.minY/step)*step;
    var gx, gy, s;
    for(gx = x0; gx <= fitBox.maxX + 0.001; gx += step){
      s = toScreen(gx, fitBox.minY);
      sctx.beginPath(); sctx.moveTo(s.x, 0); sctx.lineTo(s.x, cssH); sctx.stroke();
      sctx.textAlign = "center"; sctx.textBaseline = "bottom";
      sctx.fillText(String(Math.round(gx)), s.x, cssH - 4);
    }
    for(gy = y0; gy <= fitBox.maxY + 0.001; gy += step){
      s = toScreen(fitBox.minX, gy);
      sctx.beginPath(); sctx.moveTo(0, s.y); sctx.lineTo(cssW, s.y); sctx.stroke();
      sctx.textAlign = "left"; sctx.textBaseline = "middle";
      sctx.fillText(String(Math.round(gy)), 4, s.y);
    }
    sctx.textAlign = "right"; sctx.textBaseline = "top";
    sctx.fillText("x / y in mm", cssW - 6, 6);
    /* commanded stops: every sample whose speed is zero and whose neighbours move */
    sctx.fillStyle = gridCol;
    var seen = {};
    for(var i=0;i<state.PP.length;i++){
      var p = state.PP[i];
      if(p.speed > 0.001) continue;
      var key = Math.round(p.x*10)+"|"+Math.round(p.y*10);
      if(seen[key]) continue;
      seen[key] = 1;
      var sp = toScreen(p.x, p.y);
      sctx.beginPath(); sctx.arc(sp.x, sp.y, 3, 0, Math.PI*2); sctx.fill();
    }
    sctx.restore();
  }

  var staticCanvas = document.createElement("canvas");
  function drawStaticPath(){
    if(!cssW || !cssH || !state.PP.length) return;
    computeFit();
    staticCanvas.width = els.canvas.width; staticCanvas.height = els.canvas.height;
    var sctx = staticCanvas.getContext("2d");
    var dpr = window.devicePixelRatio||1;
    sctx.setTransform(dpr,0,0,dpr,0,0);
    sctx.clearRect(0,0,cssW,cssH);
    drawPlotGround(sctx);
    sctx.lineCap = "round"; sctx.lineJoin = "round";
    sctx.lineWidth = 2.4;
    for(var i=1;i<state.PP.length;i++){
      var p0=state.PP[i-1], p1=state.PP[i];
      var a0=toScreen(p0.x,p0.y), a1=toScreen(p1.x,p1.y);
      var v = (p0.speed+p1.speed)/2;
      sctx.strokeStyle = velocityColour(v/state.vmaxRamp);
      sctx.beginPath();
      sctx.moveTo(a0.x,a0.y);
      sctx.lineTo(a1.x,a1.y);
      sctx.stroke();
    }
    renderFrame();
  }

  function findSampleAt(ms){
    var PP = state.PP;
    if(!PP.length) return null;
    if(ms<=PP[0].t) return PP[0];
    for(var i=1;i<PP.length;i++){
      if(PP[i].t >= ms){
        var p0=PP[i-1], p1=PP[i];
        var span = p1.t-p0.t;
        var f = span>0 ? (ms-p0.t)/span : 0;
        return {
          x:lerp(p0.x,p1.x,f), y:lerp(p0.y,p1.y,f), z:lerp(p0.z,p1.z,f),
          speed:lerp(p0.speed,p1.speed,f), line: f<0.5 ? p0.line : p1.line
        };
      }
    }
    return PP[PP.length-1];
  }

  var lastActiveLine = null;
  function setActiveLine(line){
    if(line === lastActiveLine) return;
    lastActiveLine = line;
    var rows = qsa(".line", els.source);
    rows.forEach(function(r){ r.classList.toggle("active", parseInt(r.dataset.line,10)===line); });
    var activeRow = rows[line-1];
    if(activeRow){
      var c = els.source;
      if(activeRow.offsetTop < c.scrollTop) c.scrollTop = activeRow.offsetTop;
      else if(activeRow.offsetTop+activeRow.offsetHeight > c.scrollTop+c.clientHeight){
        c.scrollTop = activeRow.offsetTop+activeRow.offsetHeight-c.clientHeight;
      }
    }
  }

  function updateGripperLamp(ms){
    if(!state.is3d){ els.lamp.hidden = true; return; }
    els.lamp.hidden = false;
    var w = null;
    for(var i=0;i<state.pauseWindows.length;i++){
      var win = state.pauseWindows[i];
      if(ms>=win.t0 && ms<win.t1){ w=win; break; }
      if(ms>=win.t1 && ms<win.t1+300){ w={done:true,label:win.label}; }
    }
    if(w && !w.done){
      els.lamp.dataset.state = "wait";
      els.lampLabel.textContent = w.label;
    }else if(w && w.done){
      els.lamp.dataset.state = "ok";
      els.lampLabel.textContent = w.label.indexOf("Closed")>=0 ? "GripperClosed" : "GripperOpened";
    }else{
      els.lamp.dataset.state = "idle";
      els.lampLabel.textContent = "gripper idle";
    }
  }

  function renderFrame(){
    var s = findSampleAt(state.currentMs);
    if(!s) return;
    var ctx2 = els.canvas.getContext("2d");
    var dpr = window.devicePixelRatio||1;
    ctx2.setTransform(dpr,0,0,dpr,0,0);
    ctx2.clearRect(0,0,cssW,cssH);
    ctx2.drawImage(staticCanvas, 0,0, els.canvas.width/dpr, els.canvas.height/dpr);
    var pt = toScreen(s.x, s.y);
    ctx2.fillStyle = "#00eaff";
    ctx2.strokeStyle = "rgba(0,0,0,0.35)";
    ctx2.lineWidth = 1;
    ctx2.beginPath();
    ctx2.arc(pt.x, pt.y, 5, 0, Math.PI*2);
    ctx2.fill();
    ctx2.stroke();

    setActiveLine(s.line);
    updateGripperLamp(state.currentMs);

    if(state.is3d){
      els.zGauge.style.opacity = "1";
      els.zFill.style.height = clamp(100*s.z/state.zMax,0,100) + "%";
      els.zVal.textContent = Math.round(s.z);
    }else{
      els.zGauge.style.opacity = "0.35";
      els.zFill.style.height = "0%";
      els.zVal.textContent = "n/a";
    }

    els.scrub.value = String(Math.round(1000*state.currentMs/state.totalMs));
    els.timeVal.textContent = (state.currentMs/1000).toFixed(1) + " / " + (state.totalMs/1000).toFixed(1) + "s";
  }

  function setPlaying(on){
    state.playing = on;
    els.play.setAttribute("aria-pressed", on?"true":"false");
    els.playIcon.setAttribute("d", on ? "M6 5h4v14H6zM14 5h4v14h-4z" : "M8 5v14l11-7z");
  }

  registerTicker(function(dt){
    if(!state.playing) return;
    if(!visibility.mcl) return;
    state.currentMs += dt;
    if(state.currentMs >= state.totalMs){
      state.currentMs = state.totalMs;
      setPlaying(false);
    }
    renderFrame();
  });
  observeVisibility(section, "mcl");

  function updateFormula(){
    var p = state.ovr;
    var vel = Math.round(p*0.5);
    els.formula.textContent = "program " + p + "% × TO 50% = " + vel + "% velocity · 50% accel";
  }

  function loadPreset(idx){
    state.presetIdx = idx;
    state.currentMs = 0;
    setPlaying(false);
    els.tabs.forEach(function(t,i){
      t.classList.toggle("is-active", i===idx);
      t.setAttribute("aria-selected", i===idx ? "true":"false");
    });
    renderSourceLines(els.source, PRESETS[idx].src);
    els.note.innerHTML = PRESET_NOTES[idx];
    lastActiveLine = null;
    rebuild();
  }

  els.tabs.forEach(function(t,i){ t.addEventListener("click", function(){ loadPreset(i); }); });

  els.reset.addEventListener("click", function(){ state.currentMs=0; setPlaying(false); renderFrame(); });
  els.play.addEventListener("click", function(){ setPlaying(!state.playing); if(state.currentMs>=state.totalMs) state.currentMs=0; renderFrame(); });
  els.step.addEventListener("click", function(){
    var curLine = lastActiveLine;
    for(var i=0;i<state.PP.length;i++){
      if(state.PP[i].t > state.currentMs+1 && state.PP[i].line !== curLine){
        state.currentMs = state.PP[i].t; break;
      }
    }
    setPlaying(false);
    renderFrame();
  });
  els.scrub.addEventListener("input", function(){
    setPlaying(false);
    state.currentMs = (parseInt(els.scrub.value,10)/1000) * state.totalMs;
    renderFrame();
  });

  els.ovr.addEventListener("input", function(){
    els.ovrVal.textContent = els.ovr.value + "%";
    state.ovr = parseInt(els.ovr.value,10);
    updateFormula();
    var frac = state.currentMs/state.totalMs;
    rebuild();
    state.currentMs = frac*state.totalMs;
    renderFrame();
  });

  function wireGroup(buttons, key, parseVal){
    buttons.forEach(function(btn, i){
      btn.addEventListener("click", function(){
        buttons.forEach(function(b){ b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        state[key] = parseVal ? parseVal(btn) : i;
        rebuild();
        renderFrame();
      });
    });
  }
  wireGroup(els.trans, "trans");
  wireGroup(els.blend, "blend");

  els.blendDist.addEventListener("input", function(){
    var v = parseInt(els.blendDist.value,10);
    state.blendDist = v;
    els.blendDistVal.textContent = v < 0 ? "max" : String(v);
    rebuild();
    renderFrame();
  });

  updateFormula();
  loadPreset(0);
}

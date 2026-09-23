import { qs } from '../lib/dom.js';
import { clamp, lerp } from '../lib/math.js';
import { reducedMotion } from '../lib/motion.js';
import { velocityColour } from '../lib/colour.js';
import { registerTicker } from '../lib/ticker.js';
import { visibility, observeVisibility } from '../lib/visibility.js';
import { sizeCanvas } from '../lib/canvas.js';
import { buildPreset1 } from '../data/presets.js';

/* ============================================================
   S1 — HERO CANVAS (ambient pick & place loop)
   ============================================================ */
export function init(){
  var canvas = qs("#heroCanvas");
  if(!canvas) return;
  var wrap = canvas.parentElement;
  var ctx = canvas.getContext("2d");
  var prog = buildPreset1();
  var pts = prog.jobs.filter(function(j){ return j.type==="move"; }).map(function(j){ return {x:j.x,y:j.y,z:j.z}; });

  function isoProj(x,y,z){
    var a = Math.PI/6;
    return { sx:(x-y)*Math.cos(a), sy:(x+y)*Math.sin(a) - z };
  }
  var proj = pts.map(function(p){ return isoProj(p.x,p.y,p.z); });
  var minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  proj.forEach(function(p){
    if(p.sx<minX)minX=p.sx; if(p.sx>maxX)maxX=p.sx;
    if(p.sy<minY)minY=p.sy; if(p.sy>maxY)maxY=p.sy;
  });
  var spanX = Math.max(1,maxX-minX), spanY = Math.max(1,maxY-minY);

  var cumLen = [0];
  for(var i=1;i<proj.length;i++){
    var dx = proj[i].sx-proj[i-1].sx, dy = proj[i].sy-proj[i-1].sy;
    cumLen.push(cumLen[i-1] + Math.sqrt(dx*dx+dy*dy));
  }
  var totalLen = cumLen[cumLen.length-1] || 1;

  function toScreen(sx, sy, w, h){
    var pad = 0.14;
    var x = pad*w + (sx-minX)/spanX * (1-2*pad)*w;
    var y = pad*h + (sy-minY)/spanY * (1-2*pad)*h;
    return { x:x, y:y };
  }

  function pointAt(dist, w, h){
    dist = ((dist % totalLen) + totalLen) % totalLen;
    for(var i=1;i<cumLen.length;i++){
      if(dist <= cumLen[i]){
        var segLen = cumLen[i]-cumLen[i-1];
        var t = segLen>0 ? (dist-cumLen[i-1])/segLen : 0;
        var a = proj[i-1], b = proj[i];
        var sx = lerp(a.sx,b.sx,t), sy = lerp(a.sy,b.sy,t);
        var s = toScreen(sx,sy,w,h);
        return s;
      }
    }
    var last = toScreen(proj[proj.length-1].sx, proj[proj.length-1].sy, w, h);
    return last;
  }

  var cssW=0, cssH=0;
  sizeCanvas(canvas, function(w,h){ cssW=w; cssH=h; drawStatic(); });

  function strokeStyle(){
    var css = getComputedStyle(document.documentElement);
    return css.getPropertyValue("--ix-bdr").trim() || "rgba(0,0,0,0.15)";
  }

  function drawStatic(){
    if(!cssW||!cssH) return;
    ctx.clearRect(0,0,cssW,cssH);
    ctx.lineWidth = 2;
    for(var i=1;i<proj.length;i++){
      var a = toScreen(proj[i-1].sx, proj[i-1].sy, cssW, cssH);
      var b = toScreen(proj[i].sx, proj[i].sy, cssW, cssH);
      var frac = cumLen[i]/totalLen;
      ctx.strokeStyle = velocityColour((Math.sin(frac*Math.PI*6)+1)/2);
      ctx.beginPath();
      ctx.moveTo(a.x,a.y);
      ctx.lineTo(b.x,b.y);
      ctx.stroke();
    }
  }

  var trail = [];
  var dist = 0;
  var speed = 130; // units/sec, ambient pace

  function tick(dt){
    if(!cssW||!cssH) return;
    if(!visibility.hero) return;
    dist += speed * (dt/1000);
    var head = pointAt(dist, cssW, cssH);
    trail.push({x:head.x, y:head.y, t:0, frac:(dist%totalLen)/totalLen});
    if(trail.length>70) trail.shift();
    trail.forEach(function(p){ p.t += dt; });

    ctx.clearRect(0,0,cssW,cssH);
    for(var i=1;i<trail.length;i++){
      var p0=trail[i-1], p1=trail[i];
      var age = p1.t/1400;
      var alpha = clamp(1-age,0,1);
      if(alpha<=0) continue;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = velocityColour((Math.sin(p1.frac*Math.PI*6)+1)/2);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p0.x,p0.y);
      ctx.lineTo(p1.x,p1.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    var headPt = trail[trail.length-1];
    if(headPt){
      ctx.fillStyle = "#00eaff";
      ctx.beginPath();
      ctx.arc(headPt.x, headPt.y, 3.4, 0, Math.PI*2);
      ctx.fill();
    }
  }

  observeVisibility(wrap, "hero");
  if(reducedMotion){
    drawStatic();
  }else{
    registerTicker(tick);
  }
}

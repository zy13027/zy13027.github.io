/* shared rAF loop: registered tickers run every frame while active */
var tickers = [];
var rafHandle = null;
var lastT = null;
export function registerTicker(fn){ tickers.push(fn); }
function loop(now){
  if(lastT==null) lastT = now;
  var dt = Math.min(now - lastT, 64);
  lastT = now;
  for(var i=0;i<tickers.length;i++){
    try{ tickers[i](dt, now); }catch(e){}
  }
  rafHandle = requestAnimationFrame(loop);
}
export function startTicker(){
  rafHandle = requestAnimationFrame(loop);
}

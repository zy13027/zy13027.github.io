/* canvas DPR-aware sizing; calls cb(cssW,cssH) after resize */
export function sizeCanvas(canvas, cb){
  function apply(){
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    if(canvas.width !== w || canvas.height !== h){
      canvas.width = w;
      canvas.height = h;
    }
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(cb) cb(rect.width, rect.height);
  }
  apply();
  if("ResizeObserver" in window){
    try{
      var ro = new ResizeObserver(function(){ apply(); });
      ro.observe(canvas);
    }catch(e){
      window.addEventListener("resize", apply);
    }
  }else{
    window.addEventListener("resize", apply);
  }
  return apply;
}

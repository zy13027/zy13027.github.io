export var reducedMotion = false;
try{
  reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}catch(e){}

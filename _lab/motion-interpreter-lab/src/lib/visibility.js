/* IntersectionObserver-driven "is this panel visible" flags, to lighten load */
export var visibility = {};
export function observeVisibility(el, key){
  visibility[key] = true;
  if(!("IntersectionObserver" in window)) return;
  try{
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ visibility[key] = en.isIntersecting; });
    }, { rootMargin:"80px" });
    io.observe(el);
  }catch(e){}
}

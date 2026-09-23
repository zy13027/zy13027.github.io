// Flow-object catalogue: pill switcher for the block-detail panels (#flowobjects section).
export function initFlowObjects(){
  var pills = Array.prototype.slice.call(document.querySelectorAll('.pc-fo-pill'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.pc-fo-panel'));
  function show(id){
    panels.forEach(function(p){ p.hidden = (p.id !== 'pc-panel-' + id); });
    pills.forEach(function(b){
      var on = b.getAttribute('data-fo') === id;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  pills.forEach(function(b){
    b.addEventListener('click', function(){ show(b.getAttribute('data-fo')); });
  });
}

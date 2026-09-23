// Theme toggle: persists light/dark to localStorage and follows the OS preference otherwise.
export function initTheme(){
  var root=document.documentElement, btn=document.getElementById('themeBtn');
  function pref(){try{return localStorage.getItem('lprodreg-theme')}catch(e){return null}}
  var saved=pref(); if(saved==='dark'||saved==='light'){root.setAttribute('data-theme',saved);}
  function label(){
    var cur=root.getAttribute('data-theme');
    var dark = cur? cur==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    btn.textContent = dark? 'Light' : 'Dark';
  }
  if(btn){
    label();
    btn.addEventListener('click',function(){
      var cur=root.getAttribute('data-theme');
      var dark = cur? cur==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      var next = dark? 'light':'dark';
      root.setAttribute('data-theme',next);
      try{localStorage.setItem('lprodreg-theme',next)}catch(e){}
      label();
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',label);
  }
}

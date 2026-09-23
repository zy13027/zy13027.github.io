export function storeGet(key){
  try{ return window.localStorage.getItem(key); }catch(e){ return null; }
}
export function storeSet(key, val){
  try{ window.localStorage.setItem(key, val); }catch(e){}
}

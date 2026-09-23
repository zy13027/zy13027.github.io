export function clamp(v,lo,hi){ return Math.max(lo, Math.min(hi, v)); }
export function lerp(a,b,t){ return a + (b-a)*t; }
export function round5(v){ return Math.round(v/5)*5; }

import { clamp, lerp } from './math.js';

/* hex colour helpers for the velocity ramp */
export function hexToRgb(hex){
  hex = hex.replace("#","");
  return [parseInt(hex.substr(0,2),16), parseInt(hex.substr(2,2),16), parseInt(hex.substr(4,2),16)];
}
export var RAMP_STOPS = [hexToRgb("006e93"), hexToRgb("00a4b8"), hexToRgb("00eaff")];
export function velocityColour(t){
  t = clamp(t,0,1);
  var seg = t < 0.5 ? 0 : 1;
  var localT = t < 0.5 ? t/0.5 : (t-0.5)/0.5;
  var a = RAMP_STOPS[seg], b = RAMP_STOPS[seg+1];
  var r = Math.round(lerp(a[0],b[0],localT));
  var g = Math.round(lerp(a[1],b[1],localT));
  var bl = Math.round(lerp(a[2],b[2],localT));
  return "rgb("+r+","+g+","+bl+")";
}

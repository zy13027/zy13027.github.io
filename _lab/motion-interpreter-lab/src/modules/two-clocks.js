import { qs } from '../lib/dom.js';
import { clamp, round5 } from '../lib/math.js';
import { registerTicker } from '../lib/ticker.js';

/* ============================================================
   S3 — TWO CLOCKS: PREPARATION / EXECUTION SIMULATION
   ============================================================ */
export function init(){
  var panel = qs("#s3");
  if(!panel) return;

  var N = 70;
  var KIND = [];
  for(var i=0;i<N;i++){
    var m = i % 9;
    KIND.push((m===4 || m===5) ? "other" : "kin");
  }
  var JOB8_IDX = 7; // "job 8" = tile index 7 (1-indexed job number 8)

  var els = {
    play: qs("#s3Play"), playLabel: qs("#s3PlayLabel"), playIcon: qs("#s3PlayIcon"),
    step: qs("#s3Step"), reset: qs("#s3Reset"),
    cap: qs("#s3Cap"), capVal: qs("#s3CapVal"),
    timeout: qs("#s3Timeout"), timeoutVal: qs("#s3TimeoutVal"),
    preHalt: qs("#s3PreHalt"), waitEvent: qs("#s3WaitEvent"),
    prepFill: qs("#s3PrepFill"), prepTiles: qs("#s3PrepTiles"),
    execFill: qs("#s3ExecFill"), execTiles: qs("#s3ExecTiles"),
    badges: qs("#s3Badges"),
    level: qs("#s3Level"), counts: qs("#s3Counts"), kinCount: qs("#s3KinCount"),
    elapsed: qs("#s3Elapsed"), timeoutComputed: qs("#s3TimeoutComputed")
  };

  var prepTileEls = [], execTileEls = [];
  function buildTiles(container, arr){
    container.textContent = "";
    for(var i=0;i<N;i++){
      var t = document.createElement("div");
      t.className = "job-tile " + KIND[i];
      container.appendChild(t);
      arr.push(t);
    }
  }
  buildTiles(els.prepTiles, prepTileEls);
  buildTiles(els.execTiles, execTileEls);

  var state = {
    prepIdx:0, execIdx:0, elapsedMs:0,
    playing:false,
    preHaltOn:false, waitEventOn:false,
    preHalted:false,          // sticky, once preHalt fires
    waitBlocked:false,        // true while execution is blocked at job8 waiting the event
    waitEventFiredAt:null,
    prepAcc:0, execAcc:0
  };

  var PREP_TICK = 110;   // ms per job prepared
  var EXEC_TICK = 260;   // ms per job executed
  var PREP_FULL_MS = 1500; // manual worked example: full preparation takes 1.5s

  function cap(){ return parseInt(els.cap.value, 10); }
  function timeoutS(){ return parseFloat(els.timeout.value); }
  function startDelayMs(){
    var t = timeoutS();
    return t<=0 ? PREP_FULL_MS : Math.min(t*1000, PREP_FULL_MS);
  }

  function kinUnexecuted(){
    var c = 0;
    for(var i=state.execIdx; i<state.prepIdx; i++){ if(KIND[i]==="kin") c++; }
    return c;
  }

  function canPrepare(){
    if(state.prepIdx >= N) return false;
    if(state.preHalted) return false;
    if((state.prepIdx - state.execIdx) >= cap()) return false;
    if(kinUnexecuted() >= 30) return false;
    return true;
  }
  function canExecute(){
    if(state.execIdx >= N) return false;
    if(state.execIdx >= state.prepIdx) return false;
    if(state.execIdx === JOB8_IDX && state.waitBlocked) return false;
    if(state.execIdx === 0 && state.elapsedMs < startDelayMs()) return false;
    return true;
  }

  function doPrepareStep(){
    if(!canPrepare()) return false;
    state.prepIdx++;
    if(state.prepIdx === JOB8_IDX+1 && state.preHaltOn){
      state.preHalted = true;
    }
    return true;
  }
  function doExecuteStep(){
    if(!canExecute()) return false;
    if(state.execIdx === JOB8_IDX && state.waitEventOn && !state.waitEventFiredAt){
      state.waitBlocked = true;
      return false;
    }
    state.execIdx++;
    return true;
  }
  function fireEvent(){
    state.waitBlocked = false;
    state.waitEventFiredAt = state.elapsedMs;
  }

  function reset(){
    state.prepIdx=0; state.execIdx=0; state.elapsedMs=0;
    state.preHalted=false; state.waitBlocked=false; state.waitEventFiredAt=null;
    state.prepAcc=0; state.execAcc=0;
    setPlaying(false);
    render();
  }

  function setPlaying(on){
    state.playing = on;
    els.play.setAttribute("aria-pressed", on ? "true" : "false");
    els.playLabel.textContent = on ? "Pause" : "Play";
    els.playIcon.setAttribute("d", on ? "M6 5h4v14H6zM14 5h4v14h-4z" : "M8 5v14l11-7z");
  }

  function badge(text, cls){
    var b = document.createElement("span");
    b.className = "badge" + (cls?(" "+cls):"");
    b.textContent = text;
    return b;
  }
  function fireBtn(){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "badge stall";
    b.style.cursor = "pointer";
    b.textContent = "Fire waitEvent() now";
    b.addEventListener("click", fireEvent);
    return b;
  }

  function render(){
    for(var i=0;i<N;i++){
      prepTileEls[i].dataset.prepped = i < state.prepIdx ? "1" : "0";
      prepTileEls[i].removeAttribute("data-head");
      execTileEls[i].dataset.executed = i < state.execIdx ? "1" : "0";
      execTileEls[i].removeAttribute("data-head");
    }
    if(state.prepIdx < N) prepTileEls[state.prepIdx].setAttribute("data-head","prep");
    if(state.execIdx < N) execTileEls[state.execIdx].setAttribute("data-head","exec");

    els.prepFill.style.width = (100*state.prepIdx/N) + "%";
    els.execFill.style.width = (100*state.execIdx/N) + "%";

    var lvl = round5(clamp(100*(state.prepIdx-state.execIdx)/cap(), 0, 100));
    els.level.textContent = lvl + "%";
    els.counts.textContent = state.prepIdx + " / " + state.execIdx;
    els.kinCount.textContent = kinUnexecuted() + " / 30";
    els.elapsed.textContent = (state.elapsedMs/1000).toFixed(1) + " s";
    els.timeoutComputed.textContent = (startDelayMs()/1000).toFixed(1);

    els.badges.textContent = "";
    var generalStall = (state.prepIdx - state.execIdx) >= cap() && state.prepIdx < N;
    var kinStall = kinUnexecuted() >= 30 && state.prepIdx < N;
    if(generalStall) els.badges.appendChild(badge("Preparation interrupted — job sequence full", "stall"));
    else if(kinStall) els.badges.appendChild(badge("Preparation interrupted — 30 kinematics jobs already prepared", "stall"));
    else if(state.preHalted) els.badges.appendChild(badge("Preparation halted — preHalt() at job 8", "stall"));
    else if(state.prepIdx >= N) els.badges.appendChild(badge("Preparation complete", "ok"));

    if(state.waitBlocked){
      els.badges.appendChild(badge("Execution blocked — waiting for waitEvent() at job 8", "stall"));
      els.badges.appendChild(fireBtn());
    }else if(state.execIdx===0 && state.elapsedMs < startDelayMs()){
      els.badges.appendChild(badge("Execution has not started — StartTimeout not yet reached", ""));
    }else if(state.execIdx >= N){
      els.badges.appendChild(badge("Execution complete", "ok"));
    }
  }

  function tick(dt){
    if(!state.playing) return;
    state.elapsedMs += dt;
    state.prepAcc += dt;
    state.execAcc += dt;
    var changed = false;
    while(state.prepAcc >= PREP_TICK){
      state.prepAcc -= PREP_TICK;
      if(doPrepareStep()) changed = true;
    }
    while(state.execAcc >= EXEC_TICK){
      state.execAcc -= EXEC_TICK;
      if(doExecuteStep()) changed = true;
    }
    if(state.prepIdx>=N && state.execIdx>=N) setPlaying(false);
    if(changed || true) render();
  }
  registerTicker(tick);

  els.play.addEventListener("click", function(){ setPlaying(!state.playing); render(); });
  els.step.addEventListener("click", function(){
    if(!doPrepareStep()) doExecuteStep();
    render();
  });
  els.reset.addEventListener("click", reset);
  els.cap.addEventListener("input", function(){ els.capVal.textContent = els.cap.value; render(); });
  els.timeout.addEventListener("input", function(){ els.timeoutVal.textContent = parseFloat(els.timeout.value).toFixed(1); render(); });
  function wireSwitch(btn, key){
    btn.addEventListener("click", function(){
      var on = btn.getAttribute("aria-checked") !== "true";
      btn.setAttribute("aria-checked", on ? "true":"false");
      state[key] = on;
      render();
    });
  }
  wireSwitch(els.preHalt, "preHaltOn");
  wireSwitch(els.waitEvent, "waitEventOn");

  render();
}

export var STATUS = [
  ["X0","Control","technology object is in operation / a job is active"],
  ["X1","Error","the technology object reports an error"],
  ["X2","RestartActive","the technology object is being reinitialised"],
  ["X3","OnlineStartValuesChanged","restart required; changes apply after a TO restart"],
  ["X4","MasterControlActive","the programming editor toolbar has master control"],
  ["X5","InRun","the TO is executing an Interpreter program"],
  ["X6","Done","execution of the Interpreter program is complete"],
  ["X7","Stopping","execution will be or has been stopped"],
  ["X8","Interrupted","execution was interrupted and can be continued"],
  ["X9","Loading","loading the Interpreter program; preparation running"],
  ["X10","Loaded","the Interpreter program is loaded and prepared"]
];
export var ERROR_BITS = [
  ["X0","SystemFault",""],["X1","ConfigFault",""],["X2","UserFault",""],
  ["X3","CommandNotAccepted",""],["X4","UserProgramFault","error in the current Interpreter program"],
  ["X5","UserMappingFault","error in the current Interpreter mapping"]
];
export var WARNING_BITS = [
  ["X0","SystemWarning",""],["X1","ConfigWarning",""],["X2","UserWarning",""],
  ["X3","CommandNotAccepted",""],["X4","UserProgrammWarning",""],["X5","UserMappingWarning",""]
];

export var RIBBON_STEPS = [
  { label:"idle", bits:[] },
  { label:"MC_LoadProgram (Mode 1)", bits:[] },
  { label:"X9 Loading", bits:["X9"] },
  { label:"X10 Loaded", bits:["X10"], clears:["X9"] },
  { label:"MC_RunProgram", bits:["X10"] },
  { label:"X5 InRun", bits:["X5","X10"] },
  { label:"X6 Done", bits:["X6"], clears:["X5"] },
  { label:"prepared again — may re-run", bits:["X10"], clears:["X6"] }
];

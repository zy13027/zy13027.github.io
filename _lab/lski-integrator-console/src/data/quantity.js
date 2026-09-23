// Quantity-structure table, project constants and runtime configuration table,
// moved verbatim from the artifact's reference <script>.
  export const QUANTITY = [
    ["Retain memory","101 kB","162 kB","162 kB"],
    ["Total number of commands","500","1000","1000"],
    ["Paths","1","1","1"],
    ["Inputs","50","50","50"],
    ["Outputs","50","50","50"],
    ["Conditions","50","100","100"],
    ["Variables","50","100","100"],
    ["Labels","100","100","100"],
    ["Points","50","100","100"],
    ["Messages","10","10","10"],
    ["Used retain memory","46%","33%","3%"]
  ];

  export const CONSTANTS = [
    ["LSKI_NO_OF_CHANNELS","Number of SKI channels (kinematics) in the project; each extra channel needs its own set of FB calls."],
    ["LSKI_NO_OF_PROGRAM_SLOTS","Number of program-slot columns available in the program table."],
    ["LSKI_NO_OF_COMMANDS","Number of command rows available per program slot."],
    ["LSKI_NO_OF_PARALLEL_SEQUENCES","Maximum number of parallel sequences that can run at once; every active sequence is evaluated every PLC cycle."],
    ["LSKI_INTERPR_ERRORBUFFER_UPPER_LIM","Size of the interpreter's error buffer used to diagnose problems in the program."],
    ["LSKI_NO_OF_CONDITIONS","Size of the conditions array; also the upper index limit for the GCode M function (setFlag)."],
    ["LSKI_NO_OF_VARIABLES","Size of the variables array; also the upper index limit for the GCode H function (valueFlag)."],
    ["LSKI_NO_OF_GCODES","Number of GCode files that can be referenced and executed in a program."],
    ["LSKI_NO_OF_SUBSTITUTION","Size of the #tempVarSub variable-substitution array; index 0 always means “no substitution”."],
    ["LSKI_NO_OF_INFEEDS","Number of SINAMICS infeeds addressable via the SinaInfeed plugin."],
    ["LSKI_NO_OF_EXTERNAL_DEVICES","Number of generic external devices addressable per channel."],
    ["LSKI_NO_OF_CHARACTERISTICS_VARIANTS","Number of expected variants per ProductRegister object characteristic (e.g. 2 for colour = red / blue)."],
    ["LSKI_NO_OF_OBJECT_CHARACTERISTICS","Number of user-defined object characteristics in the ProductRegister plugin (default: colour and shape = 2)."]
  ];

  export const RUNTIME = [
    ["interpreterModuleRegistrationTime","Time until each TO module reports a successful registration back to the interpreter; increase it if an axis enable sequence takes longer than this."],
    ["kinematicsModule.errorStopMode","Dynamic reaction of the kinematics module in case of an error during execution."],
    ["kinematicsModule.interruptMode","Dynamic reaction of the kinematics module in case of an interrupt (external and HMI)."],
    ["axesEnableMode[..]","Enable mode of the axis at program start — LSKI_AXIS_ENABLE_MODE_DEFAULT (enabled with program start) / _EXPLICIT (needs an explicit power-on command in the program) / _EXTERNAL (enable handled entirely outside the SKI; the program assumes the axis is already enabled)."]
  ];

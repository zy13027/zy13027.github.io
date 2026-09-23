// The 19-command LSKI program the simulator interprets, moved verbatim from the
// artifact's simulator <script>.
  export const PROGRAM = [
    {n:0,  name:"LSKI_CmdInitStart",       kind:"text",  text:"Start initialisation",                    trans:"fixed"},
    {n:1,  name:"LSKI_CmdPowerAxis",       kind:"text",  text:"All axes · Enable",                  trans:"done"},
    {n:2,  name:"LSKI_CmdHoming",          kind:"text",  text:"All axes · Active homing",           trans:"done"},
    {n:3,  name:"LSKI_CmdInitDone",        kind:"text",  text:"Initialisation end",                      trans:"fixed"},
    {n:4,  name:"LSKI_CmdLabel",           kind:"label", text:"*** PICK CYCLE ***",                      trans:"immediate"},
    {n:5,  name:"LSKI_CmdMoveDirectAbs",   kind:"text",  text:"Point 1 · Pick approach",            trans:"next",     motion:true},
    {n:6,  name:"LSKI_CmdMoveLinearAbs",   kind:"text",  text:"Point 2 · Pick",                     trans:"done",     motion:true},
    {n:7,  name:"LSKI_CmdSetOutput",       kind:"text",  text:"Output 0 · Gripper close := TRUE",   trans:"immediate"},
    {n:8,  name:"LSKI_CmdWaitForInput",    kind:"text",  text:"Input 0 · Part gripped = TRUE",      trans:"done"},
    {n:9,  name:"LSKI_CmdMoveLinearRel",   kind:"text",  text:"Z +120.0 mm",                             trans:"next",     motion:true},
    {n:10, name:"LSKI_CmdMoveDirectAbs",   kind:"text",  text:"Point 3 · Place approach",           trans:"next",     motion:true},
    {n:11, name:"LSKI_CmdMoveLinearAbs",   kind:"text",  text:"Point 4 · Place",                    trans:"done",     motion:true},
    {n:12, name:"LSKI_CmdSetOutput",       kind:"text",  text:"Output 0 · Gripper close := FALSE",  trans:"immediate"},
    {n:13, name:"LSKI_CmdIncVariable",     kind:"text",  text:"Variable 0 · Product counter += 1",  trans:"immediate"},
    {n:14, name:"LSKI_CmdMoveLinearRel",   kind:"text",  text:"Z +120.0 mm",                             trans:"next",     motion:true},
    {n:15, name:"LSKI_CmdJumpCycleStop",   kind:"ref",   refText:"*** STOP ROUTINE ***", suffix:" if cycle stop", trans:"immediate"},
    {n:16, name:"LSKI_CmdJump",            kind:"ref",   refText:"*** PICK CYCLE ***",                   trans:"immediate"},
    {n:17, name:"LSKI_CmdStopProgRoutine", kind:"label", text:"*** STOP ROUTINE ***",                    trans:"fixed"},
    {n:18, name:"LSKI_CmdPowerAxis",       kind:"text",  text:"All axes · Disable",                 trans:"done"}
  ];
  export const TRANS_LABEL = {fixed:"Fixed", done:"When command done", next:"Next cycle", immediate:"Immediately"};
  export const MAX_IMMEDIATE_PER_CYCLE = 10;

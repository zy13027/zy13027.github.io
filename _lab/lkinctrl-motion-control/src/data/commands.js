// Command catalogue — the 13 command families covering the library's 29
// cmdType values, lifted verbatim from the artifact's reference-section script.
export const CMD_FAMILIES = [
{id:"linear",name:"Linear",chapter:"§3.3",chips:["1 (abs)","2 (rel)"],
 summary:"The plain building block: a straight-line motion to a target, run as interpolated (continuous-path) motion. cmdType 1 takes an absolute target; cmdType 2 treats the same Cartesian fields as a distance to travel.",
 params:["cmdCoordinates — target position, or a point-table reference via point","coordSystem — WCS or OCS1–3 (relative commands travel within this frame too)","pathDynamics, bufferMode, transitionParameter[1] — as in the PathData field reference"],
 rules:["Point references are supported (§3.2).","Relative commands interpret cartesianPosition as a signed distance, not a target position."]},
{id:"circular",name:"Circular",chapter:"§3.4",chips:["3 (abs)","4 (rel)"],
 summary:"A circular arc, selected by circMode. All three definitions share the same cmdType — circMode decides which fields are read.",
 params:["circleParameters.{circMode, auxPoint | radius | point, pathChoice, circlePlane, arc}","point — optional point-table reference for AuxPoint"],
 detail:"<div class=\"rf-detail\"><div class=\"scrollx\"><table><thead><tr><th>CircMode</th><th>Defined by</th><th>Notes</th></tr></thead><tbody>"
  +"<tr><td class=\"mono\">1</td><td>AuxPoint = circle centre + Arc (opening angle)</td><td>Full circles possible in a 2D plane; arc ≥ 360° draws more than one turn.</td></tr>"
  +"<tr><td class=\"mono\">2</td><td>EndPoint (cartesianPosition) + Radius</td><td>Circles below 360° in a 2D plane. pathChoice 2 &amp; 3 (longer segment) are only valid here.</td></tr>"
  +"<tr><td class=\"mono\">0</td><td>EndPoint (cartesianPosition) + AuxPoint (a point on the arc)</td><td>Circles below 360° in 3D space; circlePlane and pathChoice are irrelevant.</td></tr>"
  +"</tbody></table></div>"
  +"<div class=\"scrollx\" style=\"margin-top:.6rem\"><table><thead><tr><th>circlePlane</th><th>System term</th><th>Coord. 1</th><th>Coord. 2</th></tr></thead><tbody>"
  +"<tr><td class=\"mono\">0</td><td>X-Z plane</td><td>Z</td><td>X</td></tr><tr><td class=\"mono\">1</td><td>X-Y plane</td><td>Y</td><td>Z</td></tr><tr><td class=\"mono\">2</td><td>X-Y plane</td><td>X</td><td>Y</td></tr>"
  +"</tbody></table></div>"
  +"<div class=\"scrollx\" style=\"margin-top:.6rem\"><table><thead><tr><th>pathChoice</th><th>Segment</th><th>Math</th><th>Clock</th></tr></thead><tbody>"
  +"<tr><td class=\"mono\">0</td><td>Shorter positive</td><td>Positive</td><td>Counter-clockwise</td></tr>"
  +"<tr><td class=\"mono\">1</td><td>Shorter negative</td><td>Negative</td><td>Clockwise</td></tr>"
  +"<tr><td class=\"mono\">2</td><td>Longer positive</td><td>Positive</td><td>CCW (circMode 2 only)</td></tr>"
  +"<tr><td class=\"mono\">3</td><td>Longer negative</td><td>Negative</td><td>CW (circMode 2 only)</td></tr>"
  +"</tbody></table></div></div>",
 rules:["circMode 0 ignores circlePlane and pathChoice entirely — it's a free arc in 3D space.","A rotated user frame (UCS with A/B/C ≠ 0) rejects circMode 1 and 2 with an error — see Frame commands."]},
{id:"sptp",name:"MoveDirect / sPTP",chapter:"§3.5",chips:["5 (abs)","6 (rel)"],
 summary:"Synchronous point-to-point: every axis reaches its target at the same time via the shortest joint-space route, not a continuous Cartesian path.",
 params:["coordSystem 100 = axis positions (A1…A6), 101 = joint positions (J1…J6)","moveDirectParameters.{linkConstellation, positionMode, turnJoint}","pathDynamics scaled 0.0–1.0 (velocity/acceleration/deceleration); jerk 0.1–0.9"],
 rules:["Progress is reported as executionTimeStatus (0.0–1.0), not a remaining distance — sPTP has no path length to measure against.","positionMode only applies to absolute commands (cmdType 5) and only affects orientation A.","turnJoint = 0 takes the shortest distance to the target joint position; any other value selects a specific turn range.","Velocity, acceleration and deceleration cannot be 0.0."]},
{id:"modal",name:"Modal dynamics",chapter:"§3.6",chips:["70 (path)","71 (orientation)","72 (sPTP)"],
 summary:"Sets the dynamics used by later motion commands programmed with the default value (−1), separated into path, orientation and sPTP dynamics.",
 params:["cmdParameters.pathDynamics (70 and 72) or .OrientationDynamics (71) — velocity, acceleration, deceleration, jerk"],
 detail:"<div class=\"rf-detail\"><div class=\"scrollx\"><table><thead><tr><th>Value</th><th>Meaning</th></tr></thead><tbody>"
  +"<tr><td class=\"mono\">−2</td><td>Parameter inactive — keeps the current modal value.</td></tr>"
  +"<tr><td class=\"mono\">−1</td><td>Parameter active, set to the TO default.</td></tr>"
  +"<tr><td class=\"mono\">&gt;0</td><td>Parameter active, set to this manual value.</td></tr>"
  +"</tbody></table></div></div>",
 rules:["Modal values reset to the kinematics defaults on the next path execution, unless MovePath's Configuration.resetModelDynamics is set to keep them.","Each of velocity/acceleration/deceleration/jerk switches independently — set only the ones actually changing."]},
{id:"frame",name:"Frame commands",chapter:"§3.8",chips:["20 (OCS)","21 (UCS)","22 (define tool)","23 (set tool)"],
 summary:"Redefine or select the coordinate systems and tool a path is programmed in.",
 params:[],
 detail:"<div class=\"rf-detail\"><div class=\"scrollx\"><table><thead><tr><th>cmdType</th><th>Command</th><th>Notes</th></tr></thead><tbody>"
  +"<tr><td class=\"mono\">20</td><td>OCS frame</td><td>Sets position + rotation of OCS[1..3] (coordSystem 1–3) relative to the WCS, from cartesianPosition.</td></tr>"
  +"<tr><td class=\"mono\">21</td><td>UCS frame</td><td>Sets a user frame in LKINCTRL_CS_NO_OF_FIRST_USER_FRAME…LAST_USER_FRAME. Start values come from Configuration; live values read back at output activeUserFrames.</td></tr>"
  +"<tr><td class=\"mono\">22</td><td>Define tool</td><td>Redefines tool 1's frame from cartesianPosition. Forces standstill first — MovePath drains the motion queue automatically, so no blending here.</td></tr>"
  +"<tr><td class=\"mono\">23</td><td>Set tool</td><td>Activates the tool given by toolNumber. Also forces standstill first; no blending.</td></tr>"
  +"</tbody></table></div></div>",
 rules:["Only issue MC_DefineTool / MC_SetTool / MC_SetOCSFrame directly while LKinCtrl_MC_MovePath is not busy — the FB tracks tool and frame state internally, and an outside change while it's active leaves that state invalid.","A UCS with a rotation set (A, B or C ≠ 0) rejects circular commands using circMode 1 or 2 — MovePath raises an error if one is programmed there."]},
{id:"zone",name:"Zone commands",chapter:"§3.9",chips:["30","31","32","33","34","35"],
 summary:"Redefine and switch workspace zones (Cartesian) and kinematics zones (joint space) without leaving the PathData list.",
 params:[],
 detail:"<div class=\"rf-detail\"><div class=\"scrollx\"><table><thead><tr><th>cmdType</th><th>Command</th><th>Notes</th></tr></thead><tbody>"
  +"<tr><td class=\"mono\">30</td><td>Define workspace zone</td><td>Redefines the zone from Configuration.workspaceZones, selected by zoneConfigurationIndex; target zone is zoneNumber.</td></tr>"
  +"<tr><td class=\"mono\">31</td><td>Activate workspace zone</td><td>Activates zoneNumber.</td></tr>"
  +"<tr><td class=\"mono\">32</td><td>Deactivate workspace zone</td><td>Deactivates per deactivationMode (table below).</td></tr>"
  +"<tr><td class=\"mono\">33</td><td>Define kinematics zone</td><td>Redefines the zone from Configuration.kinematicsZones.</td></tr>"
  +"<tr><td class=\"mono\">34</td><td>Activate kinematics zone</td><td>Activates zoneNumber.</td></tr>"
  +"<tr><td class=\"mono\">35</td><td>Deactivate kinematics zone</td><td>Deactivates per deactivationMode (table below).</td></tr>"
  +"</tbody></table></div>"
  +"<div class=\"scrollx\" style=\"margin-top:.6rem\"><table><thead><tr><th>Mode</th><th>Workspace zone (32)</th><th>Kinematics zone (35)</th></tr></thead><tbody>"
  +"<tr><td class=\"mono\">0</td><td colspan=\"2\">Specific zone (needs zoneNumber)</td></tr>"
  +"<tr><td class=\"mono\">1</td><td>All workspace zones</td><td>All kinematics zones</td></tr>"
  +"<tr><td class=\"mono\">2</td><td>All blocked zones</td><td>—</td></tr>"
  +"<tr><td class=\"mono\">3</td><td>All signal zones</td><td>—</td></tr>"
  +"<tr><td class=\"mono\">4</td><td>Currently active workspace</td><td>—</td></tr>"
  +"</tbody></table></div></div>",
 rules:["Zone definitions carried on the Configuration input are not active by default — issue an activate command (31/34) to use them.","Mode 0 (specific zone) is the only mode that reads zoneNumber; the others act on whole categories."]},
{id:"conveyor",name:"Conveyor",chapter:"§3.7",chips:["10 (track)","50 (desync)"],
 summary:"Track conveyor belt and Desynchronize conveyor. Full parameters, prerequisites and blending restrictions are covered in the dedicated Conveyor tracking section.",
 params:[],
 rules:["<a href=\"#tracking\">Jump to Conveyor tracking →</a>"]},
{id:"flagonly",name:"FlagOnly",chapter:"§3.11",chips:["0"],
 summary:"Fires flags without commanding any motion — the same setFlags/ValueFlags mechanism as every other command, just with cmdType = 0.",
 params:[],
 rules:["Every flag mode is supported; most behave almost identically to their motion-command form, since there's no motion duration to time against.","Acknowledgement modes still interrupt the execution of later commands, so a FlagOnly entry can plant an interim wait point in the path."]},
{id:"wait",name:"Wait time",chapter:"§3.12",chips:["100"],
 summary:"A pause between the previous and next command, in milliseconds.",
 params:["cmdParameters.pathDynamics.velocity — wait duration in ms (the field is reused, not a typo)"],
 rules:["While waiting, activeCmdNo shows this command's index and remainingDistanceActCmd counts down the remaining ms.","The motion queue runs dry during the wait — velocity drops to 0.0 until it elapses."]},
{id:"offset",name:"Offset &amp; radius compensation",chapter:"§3.13",chips:["41/42 (start)","40 (end)"],
 summary:"Contour offset and tool-radius compensation: follow a programmed contour at a constant offset — a tool radius and length — rather than exactly on it, e.g. grinding or deburring.",
 params:[],
 detail:"<div class=\"rf-detail\"><div class=\"scrollx\"><table><thead><tr><th>cmdType</th><th>Command</th><th>Notes</th></tr></thead><tbody>"
  +"<tr><td class=\"mono\">41 / 42</td><td>Start compensation, left / right</td><td>Placed one command before the contour begins. offsetParaNo selects the tool (name, radius, length) from Configuration; mainPathPlane (0 XZ · 1 YZ · 2 XY) sets the compensation plane.</td></tr>"
  +"<tr><td class=\"mono\">40</td><td>End compensation</td><td>Placed right after the contour ends.</td></tr>"
  +"</tbody></table></div></div>",
 rules:["Two calculation methods, set globally by LKINCTRL_CONTOUR_OFFSET_APPROACH: 0 (default) blends tangential and orthogonal shift; 1 uses orthogonal shift only.","offsetParaNo indexes tool entries (name, radius in mm, length in mm) configured on the MovePath interface, not inside the PathData itself."]},
{id:"shift",name:"Relative OCS shift",chapter:"§3.14",chips:["60 (shift)","61 (reset)"],
 summary:"Translate and rotate an object coordinate system on the fly — MC_Shift_CS_Rel — so the same PathData can repeat a motion at a new OCS origin.",
 params:[],
 rules:["Only one shift is active per coordinate system at a time; shifting a different CS resets the previous shift, but re-shifting the same CS stacks.","Switching coordinate systems implicitly clears the shift; cmdType 61 (MC_Reset_Shift, no parameters) clears it explicitly.","Works for absolute/relative linear, absolute/relative circular, MoveDirect and pick-and-place commands.","Insert a linear move to the coordinate system's origin before a circular command that immediately follows a shift."]},
{id:"pnp",name:"Pick and place",chapter:"§3.15",chips:["11"],
 summary:"Runs a full pick-and-place motion sequence — start vector, transition, target vector, optional conveyor tracking — from one PathData entry, via LKinCtrl_MC_MovePickAndPlaceLinear internally.",
 params:[],
 rules:["Start position and coordinate system are resolved automatically by MovePath; only the vector and tracking parameters need setting, in cmdParameters.pickAndPlaceParameters.","Conveyor tracking switches on by itself once conveyorParameters.conveyorParaNo &gt; 0 — no separate track-conveyor command is needed.","Full vector, dynamics and blending rules are shared with the standalone block — <a href=\"#standalone\">see LKinCtrl_MC_MovePickAndPlaceLinear →</a>"]},
{id:"measurement",name:"Measurement command",chapter:"§3.16",chips:[],
 summary:"Not a cmdType of its own — a per-command flag (measuringCmd) that lets a motion command be aborted mid-flight without aborting the rest of the path, e.g. a probing move onto a pallet.",
 params:[],
 detail:"<div class=\"rf-detail\"><div class=\"scrollx\"><table><thead><tr><th>Mode</th><th>Behaviour</th></tr></thead><tbody>"
  +"<tr><td class=\"mono\">0</td><td>Disabled (default).</td></tr>"
  +"<tr><td class=\"mono\">1</td><td>Continue without acknowledge — the abort is not confirmed; a following measurement command aborts immediately too if the abort input is still set.</td></tr>"
  +"<tr><td class=\"mono\">2</td><td>Wait for acknowledge — motion only resumes once the abort has been explicitly acknowledged.</td></tr>"
  +"</tbody></table></div></div>",
 rules:["Blending after a measurement command is not possible.","Mode 2 waits for acknowledgement even if earlier mode-1 commands in the same run were aborted without one."]}
];

// Flag / ValueFlag timing modes reference — the 14 flagMode values,
// lifted verbatim from the artifact's reference-section script.
// [mode, identifier, description][]
export const FLAG_MODES = [
[0,"LKINCTRL_FM_DEACTIVATED","Flag deactivated — no set, no reset, no wait. This is the default value (−1 on the field itself never matches a mode, so nothing triggers)."],
[1,"SET_BEFORE_AND_NO_RESET","Sets the flag as soon as this command becomes active. No reset until the path ends, unless reset externally."],
[2,"SET_BEFORE_AND_RESET_AFTER","Sets the flag as soon as this command becomes active; resets it once this command finishes and the next one starts."],
[3,"SET_BEFORE_AND_RESET_AFTER_ONE_CYCLE","Sets the flag as soon as this command becomes active; resets it after exactly one PLC cycle."],
[5,"SET_BEFORE_AND_NO_RESET_AND_WAIT_FOR_ACKNOWLEDGE","Sets the flag immediately, no auto-reset — and halts further path execution until the flag is reset externally (‘acknowledged’). Creates a wait point."],
[10,"SET_IN_REMAINING_DISTANCE_TO_TARGET","Sets the flag at a specified remainingDistance to the command's target; no auto-reset. The command's ‘end’ is where the next command's blending radius begins, so remainingDistance = 0.0 isn't always the literal target point."],
[11,"SET_AFTER_AND_NO_RESET","Sets the flag once this command finishes and the next one starts; no auto-reset."],
[13,"SET_AFTER_AND_RESET_AFTER_ONE_CYCLE","Sets the flag when this command finishes; resets it after one PLC cycle."],
[15,"SET_AFTER_AND_NO_RESET_AND_WAIT_FOR_ACKNOWLEDGE","Sets the flag when this command finishes, no auto-reset — and halts further execution until it's acknowledged externally. A wait point after the motion, rather than at its start."],
[20,"RESET_BEFORE","Resets the flag as soon as this command becomes active."],
[21,"RESET_AFTER","Resets the flag once this command finishes and the next one starts."],
[22,"RESET_AT_REMAINING_DISTANCE","Resets the flag at a specified remainingDistance to the command's target (same blending-radius caveat as mode 10)."],
[25,"NO_SET_AND_WAIT_FOR_FALSE_ONCE","Never sets or resets the flag itself — halts execution after this command until the flag reads FALSE once. Reset early and it doesn't block; once satisfied, toggling the flag again won't re-halt it."],
[26,"NO_SET_AND_WAIT_FOR_TRUE_ONCE","The mirror of mode 25: halts until the flag reads TRUE once, with the same early-satisfy and no-re-halt behaviour."]
];

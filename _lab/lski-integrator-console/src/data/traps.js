// "What bites people first" symptom/fix pairs, moved verbatim from the artifact's
// reference <script>.
  export const TRAPS = [
    ["Technology-object changes made on the HMI disappear on the next download.","They live only in the PLC's load memory — upload or synchronise the TOs before downloading again."],
    ["Downloading with reinitialisation of data blocks loses kinematics/axis DB numbers and tab registrations.","Both live in non-retain data blocks — a PLC restart after that download restores them."],
    ["A plugin seems to ignore the core's state entirely.","All non-_HMI blocks must share the same OB as LSKI_Core; _HMI blocks need calling at least every 25 ms."],
    ["Tab names, external-device status text or user-screen tabs show blank after an import.","HMI tag connections and text lists (LSKI_MainNavigation_TabNames, LSKI_Diagnostics_ExternalDevices_StatusMultiplexer, LSKI_SubNavigation_TabNames_UserScreens) must be re-established after import and after every library update."],
    ["A multi-channel screen always shows channel 0's data.","Multiplex the HMI tag on LSKI_ChannelNavigation_ActiveChannel, or every channel renders the same one."],
    ["A renamed user role silently stops protecting anything.","User roles must not be renamed, or they are never evaluated again."],
    ["Two conditions that reference each other behave unpredictably.","There is no cyclic-dependency check — conditions are simply evaluated one after another, in order."],
    ["A message can never be acknowledged.","Its trigger condition stays TRUE — acknowledgement can't clear a message whose cause hasn't gone away."],
    ["The program skips its own initialisation sequence.","Setting the interpreter pointer by hand marks the program as already initialised."],
    ["A path traced in single-step testing doesn't match the automatic path.","Blending is off in single-step mode, so the path genuinely differs — only use it where the workspace is free of collision risk."],
    ["Some commands come back invalid after migrating a V3.1.x project.","Migration runs through the data manager's CSV-to-JSON conversion; reconfigure any command still flagged invalid by hand."],
    ["A V2.1.x or earlier project won't open in the data manager at all.","That migration path isn't supported — step through an intermediate V2.2–V3.0 → V3.1.x → V4.1.x CSV export/import chain instead."]
  ];

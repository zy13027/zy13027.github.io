// Per-block detail-panel markup for the architecture diagram, moved verbatim from
// the artifact's concepts/architecture <script>.
  export const archDetails = {
    core: '<div class="cx-detail-head"><span class="pill on">Mandatory</span><h3>LSKI_Core</h3></div>' +
      '<p class="cx-detail-lede">The one block every LSKI project must call. It interprets the program table and evaluates operation mode, overrides and motion enable.</p>' +
      '<div class="cx-detail-group"><b>Inputs</b><div class="cx-tagwrap">' +
      ['enable','channelIndex','motionEnable','externalGlobalAcknowledge','externalInitializeProgram','externalStartProgram','externalStopProgram','externalFastStopProgram','externalInterruptProgram','externalContinueProgram','externalCycleStopProgram','externalNextProgramStep','externalProgramMode','externalProgramOverride','externalManualOverride','externalOperationMode','externalAbortMeasurementCommand']
        .map(function(t){return '<span class="tag">'+t+'</span>';}).join('') +
      '</div></div>' +
      '<div class="cx-detail-group"><b>Outputs</b><div class="cx-tagwrap">' +
      ['valid','busy','error','status','programActive','programInitialized','fastStopActive','cycleStopRequested','globalAcknowledge','actualProgramMode','actualProgramState','actualOperationMode','actualProgramOverride','actualSequenceData','activeSequenceData','errorBuffer']
        .map(function(t){return '<span class="tag">'+t+'</span>';}).join('') +
      '</div></div>' +
      '<div class="cx-detail-group"><b>Mandatory in/out</b><div class="cx-tagwrap"><span class="tag">projectData</span><span class="tag">projectConfiguration</span><span class="tag">dataExchange</span></div>' +
      '<p class="cx-detail-small">Types <span class="tag">LSKI_typeProjectData</span> / <span class="tag">LSKI_typeProjectConfiguration</span> / <span class="tag">LSKI_typeDataExchange</span> &mdash; normally wired to the <span class="tag">LSKI_ProjectData_Channel&lt;x&gt;</span>, <span class="tag">LSKI_ProjectConfiguration_Channel&lt;x&gt;</span> and <span class="tag">LSKI_DataExchange_Channel&lt;x&gt;</span> blocks from <span class="tag">LSKI_ExampleBlocks_V4_1_0</span>.</p></div>' +
      '<ul class="cx-detail-notes">' +
      '<li><span class="tag">externalInitializeProgram</span> must stay TRUE until <span class="tag">programInitialized</span> goes TRUE.</li>' +
      '<li><span class="tag">externalStartProgram</span> only takes effect once the program is initialised.</li>' +
      '<li>A TRUE <span class="tag">externalStopProgram</span> or <span class="tag">externalFastStopProgram</span> blocks starting.</li>' +
      '<li>Override inputs at <span class="mono">-1</span> hand control to the HMI &mdash; the same is true of <span class="tag">externalOperationMode</span>.</li>' +
      '</ul>',

    corehmi: '<div class="cx-detail-head"><span class="pill">Optional*</span><h3>LSKI_Core_HMI</h3></div>' +
      '<p class="cx-detail-lede">*Becomes mandatory the moment any other HMI plugin is used. Drives the status bar and HMI navigation.</p>' +
      '<div class="cx-detail-group"><b>Inputs</b><div class="cx-tagwrap">' +
      ['enable','interlockProgramControl','eStopActive','safeKinStopActive','hmiInterface']
        .map(function(t){return '<span class="tag">'+t+'</span>';}).join('') +
      '</div><p class="cx-detail-small"><span class="tag">hmiInterface</span> is type <span class="tag">LSKI_typeHMIInterface</span>, from <span class="tag">LSKI_HMIInterface_Unit</span>.</p></div>' +
      '<div class="cx-detail-group"><b>Mandatory in/out</b><div class="cx-tagwrap"><span class="tag">projectData</span><span class="tag">projectConfiguration</span><span class="tag">dataExchange</span></div>' +
      '<p class="cx-detail-small">Same three project blocks as <span class="tag">LSKI_Core</span> &mdash; both must see the same instances.</p></div>' +
      '<div class="cx-detail-group"><b>Gives you the status bar</b><ul class="cx-detail-notes">' +
      '<li>Operation-mode popup (Automatic, Manual, Test run)</li>' +
      '<li>Program mode control</li>' +
      '<li>Program control &mdash; initialize, start, stop, and more</li>' +
      '<li>Program override</li>' +
      '<li>User log-in</li>' +
      '<li>Messages</li>' +
      '<li>Teach shortcut (Teach plugin required)</li>' +
      '</ul></div>',

    to: '<div class="cx-detail-head"><h3>Technology objects</h3></div>' +
      '<p class="cx-detail-lede">LSKI programs the motion of these four TO types from the HMI once they are commissioned.</p>' +
      '<div class="cx-detail-group"><b>Supported types</b><div class="cx-tagwrap"><span class="tag">TO_Kinematics</span><span class="tag">TO_PositioningAxis</span><span class="tag">TO_SynchronousAxis</span><span class="tag">TO_SpeedAxis</span></div></div>' +
      '<p style="margin-top:12px;font-size:13px;color:var(--text-2)">Commission in TIA Portal first &mdash; jogging via the kinematics control panel must already work correctly before LSKI programs anything.</p>' +
      '<div class="box notice" style="margin-top:12px"><b>HMI changes don\'t travel back to TIA Portal</b>Configuration changes made on the HMI are written straight into the technology objects\' PLC load memory, never back into the offline project. A later download without first uploading the technology objects silently discards those changes.</div>',

    reg: '<div class="cx-detail-head"><h3>Registration</h3></div>' +
      '<p class="cx-detail-lede">The bridge between the technology objects and <span class="tag">LSKI_Core</span>. Every function here is called exactly once, only in a Startup OB.</p>' +
      '<div class="cx-detail-group"><b>Functions</b><ul class="cx-detail-notes">' +
      '<li><span class="tag">LSKI_RegisterKinematics</span> &mdash; also registers the axes already connected to that kinematics.</li>' +
      '<li><span class="tag">LSKI_RegisterAdditionalAxis</span> &mdash; needs a unique <span class="mono">index</span> starting at 1; its <span class="mono">initialName</span> only takes if the axis still has its default name.</li>' +
      '<li><span class="tag">LSKI_RegisterTrackingTO</span> &mdash; conveyor tracking; the axis must already be linked under Conveyor tracking in the TO. Combine with <span class="tag">LSKI_RegisterAdditionalAxis</span> for full axis control, not just tracking.</li>' +
      '<li><span class="tag">LSKI_UpdateConveyorOrigin</span></li>' +
      '<li><span class="tag">LSKI_UpdateTrackingPosition</span></li>' +
      '</ul></div>' +
      '<p class="cx-detail-small">Only one channel may ever control a given <span class="tag">TO_Axis</span>.</p>'
  };

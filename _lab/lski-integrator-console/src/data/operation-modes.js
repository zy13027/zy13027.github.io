// Operation-mode capability table, moved verbatim from the artifact's
// concepts/architecture <script>.
  export const modes = {
    full:   {label:'Full operation', exec:'yes', execME:false, editor:'yes', teach:'yes', teachME:true,  config:'yes', role:'none &mdash; not offered on the HMI'},
    auto:   {label:'Automatic',      exec:'yes', execME:false, editor:'yes', teach:'no',  teachME:false, config:'yes', role:'<span class="tag">LSKI_ProgramControl</span>'},
    manual: {label:'Manual',         exec:'no',  execME:false, editor:'yes', teach:'yes', teachME:true,  config:'yes', role:'<span class="tag">LSKI_ProgramControl</span>, <span class="tag">LSKI_Commissioning</span>, <span class="tag">LSKI_Programming</span> or <span class="tag">LSKI_Teach</span>'},
    test:   {label:'Test run',       exec:'yes', execME:true,  editor:'yes', teach:'yes', teachME:true,  config:'yes', role:'<span class="tag">LSKI_ProgramControl</span> or <span class="tag">LSKI_Programming</span>'},
    none:   {label:'No operation',   exec:'no',  execME:false, editor:'no',  teach:'no',  teachME:false, config:'no',  role:'none'}
  };

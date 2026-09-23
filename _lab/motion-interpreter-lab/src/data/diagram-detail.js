export var DETAIL = {
  "box-interpreter":
    "<h3>TO_Interpreter</h3>" +
    "<ul>" +
      "<li>Loading/unloading of an interpreter program</li>" +
      "<li>Loading/unloading of an interpreter mapping</li>" +
      "<li>Preparation of the interpreter program</li>" +
      "<li>Technology and time-optimised processing of the interpreter program</li>" +
      "<li>Execution of motion jobs</li>" +
    "</ul>" +
    "<p>Connects to exactly ONE kinematics TO; can additionally control mapped Speed Axis, Positioning Axis and Synchronous Axis TOs.</p>" +
    "<p class=\"note\">Configured under Basic parameters &gt; Connected kinematics; Extended parameters carry job sequence, max wait time, program override, clipboard.</p>",
  "box-program":
    "<h3>TO_InterpreterProgram</h3>" +
    "<p>Holds the motion jobs, written in MCL. Loaded into the Interpreter at runtime and interpreted &mdash; it is NOT compiled in TIA Portal. One Interpreter can have exactly one program loaded at a time; one program can be loaded into multiple Interpreters. Swapping programs = swapping the product the machine handles.</p>",
  "box-mapping":
    "<h3>TO_InterpreterMapping</h3>" +
    "<p>Declares which CPU objects the MCL program may reach, symbolically.</p>" +
    "<p>Mappable: Speed axis / Positioning axis / Synchronous axis TOs; variables of global data blocks. Data types for tags: BOOL, DINT, UDINT, DWORD, LREAL; complex position types (TO_Struct_Ipr_Frame, TO_Struct_Ipr_Position, TO_Struct_Ipr_AxPosition, TO_Struct_Ipr_JtPosition); and ARRAYs of those. Max 100 table entries (an entry may be a single tag or a whole array). Read-only per entry is available &mdash; and is MANDATORY if the DB variable itself is read-only. One mapping loaded at a time; one mapping usable by several Interpreters.</p>" +
    "<p class=\"note\">NOTE for V10.0: mapping complex position data types and mapping arrays are NEW in V10.0.</p>",
  "box-user":
    "<h3>User program</h3>" +
    "<p>Three PLCopen-style Motion Control instructions, called from the cyclic OB.</p>" +
    "<p>Data also crosses via the clipboard and via mapped DB tags.</p>",
  "box-kinematics":
    "<h3>TO_Kinematics</h3>" +
    "<p>Interpreter executes the transferred jobs; axes execute cyclically in MC_Interpolator.</p>",
  "box-axes":
    "<h3>Mapped axes</h3>" +
    "<p>Interpreter executes the transferred jobs; axes execute cyclically in MC_Interpolator.</p>"
};

// Entry point: import every stylesheet in cascade order, then boot every feature
// module in the order their original <script> blocks ran in the artifact.

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/sections/concept.css";
import "./styles/sections/flowobjects.css";
import "./styles/sections/simulator.css";
import "./styles/sections/manager.css";
import "./styles/sections/engineering.css";
import "./styles/sections/faceplate.css";
import "./styles/sections/scenarios.css";
import "./styles/sections/crossplc.css";
import "./styles/sections/errors.css";
import "./styles/sections/traps.css";

import { initFlowObjects } from "./modules/flowobjects.js";
import { initSimulator } from "./modules/simulator.js";
import { initScenarios } from "./modules/scenarios.js";
import { initErrors } from "./modules/errors.js";
import { initTheme } from "./modules/theme.js";
import { initScrollspy } from "./modules/scrollspy.js";

initFlowObjects();
initSimulator();
initScenarios();
initErrors();
initTheme();
initScrollspy();

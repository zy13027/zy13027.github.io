// Entry point: import every stylesheet in cascade order, then boot every feature
// module in the original artifact's script order.

// 1. styles — cascade order matters: tokens -> base -> layout -> components ->
//    sections, in the order their <style> blocks appeared in the artifact.
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/sections/concepts-architecture.css';
import './styles/sections/simulator.css';
import './styles/sections/reference.css';

// 2. feature modules — called in the artifact's own <script> order: simulator, then
//    concepts/architecture (architecture detail panel + operation modes), then
//    reference (plugins, commands, status, quantity, demo, traps), then the closing
//    theme toggle and scroll-spy.
import { initSimulator } from './modules/simulator/index.js';
import { initArchitectureDetail } from './modules/architecture-detail.js';
import { initOperationModes } from './modules/operation-modes.js';
import { initPlugins } from './modules/plugins.js';
import { initCommands } from './modules/commands.js';
import { initStatus } from './modules/status.js';
import { initQuantity } from './modules/quantity.js';
import { initDemo } from './modules/demo.js';
import { initTraps } from './modules/traps.js';
import { initTheme } from './modules/theme.js';
import { initScrollspy } from './modules/scrollspy.js';

initSimulator();
initArchitectureDetail();
initOperationModes();
initPlugins();
initCommands();
initStatus();
initQuantity();
initDemo();
initTraps();
initTheme();
initScrollspy();

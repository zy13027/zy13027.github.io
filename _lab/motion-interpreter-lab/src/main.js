import './styles/reset.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/sections/hero.css';
import './styles/sections/architecture.css';
import './styles/sections/two-clocks.css';
import './styles/sections/path-simulator.css';
import './styles/sections/instruction-explorer.css';
import './styles/sections/workflow.css';
import './styles/sections/statusword.css';
import './styles/sections/notes.css';
import './styles/sections/footer.css';

import { safeRun } from './lib/dom.js';
import { startTicker } from './lib/ticker.js';

import { init as themeToggleInit } from './modules/theme-toggle.js';
import { init as heroInit } from './modules/hero.js';
import { init as architectureInit } from './modules/architecture.js';
import { init as twoClocksInit } from './modules/two-clocks.js';
import { init as pathSimulatorInit } from './modules/path-simulator.js';
import { init as instructionExplorerInit } from './modules/instruction-explorer.js';
import { init as workflowInit } from './modules/workflow.js';
import { init as statuswordInit } from './modules/statusword.js';

/* start the shared rAF loop exactly as the original inline script did
   (at script evaluation, before any module runs) */
startTicker();

safeRun(themeToggleInit);
safeRun(heroInit);
safeRun(architectureInit);
safeRun(twoClocksInit);
safeRun(pathSimulatorInit);
safeRun(instructionExplorerInit);
safeRun(workflowInit);
safeRun(statuswordInit);

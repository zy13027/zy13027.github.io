// Entry point. Stylesheets are imported first, in the exact cascade order
// the artifact's <style> blocks appeared in the document (tokens -> base ->
// layout -> components -> each section's own block, in page order). Feature
// modules are then booted in the original document's script order — each
// module's init() runs the body of the IIFE it was lifted from.

import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/sections/pc.css';
import './styles/sections/sim.css';
import './styles/sections/gs.css';
import './styles/sections/rf.css';

import { initConceptMovepath } from './modules/conceptMovepath.js';
import { initSimulator } from './modules/simulator.js';
import { initGettingStarted } from './modules/gettingStarted.js';
import { initPathDataReference } from './modules/pathDataReference.js';
import { initCommandCatalogue } from './modules/commandCatalogue.js';
import { initFlagModes } from './modules/flagModes.js';
import { initErrorReference } from './modules/errorReference.js';
import { initTheme } from './modules/theme.js';
import { initScrollspy } from './modules/scrollspy.js';

initConceptMovepath();
initSimulator();
initGettingStarted();
initPathDataReference();
initCommandCatalogue();
initFlagModes();
initErrorReference();
initTheme();
initScrollspy();

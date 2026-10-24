/* global vm */
import { installScratchAdapter } from './scratch-adapter.js';

// TurboWarp evaluates this bundle after creating its VM and before loading project.sb3.
installScratchAdapter(vm);

import { switchTab } from './tab.js';
import { updateFluidProps, calcPipeFlow, calcOrifice } from './fluid.js';
import { updateSpringMat, calcSpring } from './spring.js';
import { calcShaft } from './shaft.js';
import { calcGear } from './gear.js';
import { calcBuckling } from './buckling.js';

Object.assign(window, {
  switchTab,
  updateFluidProps,
  calcPipeFlow,
  calcOrifice,
  updateSpringMat,
  calcSpring,
  calcShaft,
  calcGear,
  calcBuckling
});

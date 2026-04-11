import { switchTab } from './tab.js';
import { updateFluidProps, calcPipeFlow, calcOrifice } from './fluid.js';
import { updateSpringMat, calcSpring } from './spring.js';
import { calcShaft } from './shaft.js';
import { calcGear } from './gear.js';
import { calcBuckling } from './buckling.js';
import { addLoadRow, removeLoadRow, updateBeamSectionMode, updateBeamSectionDims, calcBeam, initBeam } from './beam.js';

Object.assign(window, {
  switchTab,
  updateFluidProps,
  calcPipeFlow,
  calcOrifice,
  updateSpringMat,
  calcSpring,
  calcShaft,
  calcGear,
  calcBuckling,
  addLoadRow,
  removeLoadRow,
  updateBeamSectionMode,
  updateBeamSectionDims,
  calcBeam
});

initBeam();

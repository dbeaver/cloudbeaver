import { pluginD3js } from './manifest';

export default pluginD3js;

export {
  select,
  line,
  curveBundle,
  zoom,
  zoomTransform,
  zoomIdentity,
  drag,
  format,
  scaleBand,
  max,
  scaleLinear,
  interpolateRound,
  axisBottom,
  axisLeft,
  scaleOrdinal,
  pie,
  arc,
  schemeTableau10,
  sum,
} from 'd3';
export type { Selection, ZoomBehavior, Line, DragBehavior, SubjectPosition, PieArcDatum, ScaleOrdinal } from 'd3';

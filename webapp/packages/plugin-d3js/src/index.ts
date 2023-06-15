import { pluginD3js } from './manifest';

export default pluginD3js;

export {
  select, line, curveBundle, zoom, zoomTransform, zoomIdentity, drag, format,
  scaleBand, max, scaleLinear, interpolateRound, axisBottom, axisLeft
} from 'd3';
export type { Selection, ZoomBehavior, Line, DragBehavior, SubjectPosition } from 'd3';
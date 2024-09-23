/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { pluginD3js } from './manifest.js';

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

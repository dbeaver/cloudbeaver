/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ILayoutEdge } from '../layout/ILayoutEdge.js';

import './ExecutionPlanEdge.css';

export interface IExecutionPlanEdgeProps {
  edge: ILayoutEdge;
  heavyRoute?: boolean;
  horizontal?: boolean;
}

export function ExecutionPlanEdge({ edge, heavyRoute, horizontal }: IExecutionPlanEdgeProps): React.ReactElement {
  let d: string;

  if (horizontal) {
    const midX = (edge.x1 + edge.x2) / 2;
    d = `M ${edge.x1} ${edge.y1} C ${midX} ${edge.y1}, ${midX} ${edge.y2}, ${edge.x2} ${edge.y2}`;
  } else {
    const midY = (edge.y1 + edge.y2) / 2;
    d = `M ${edge.x1} ${edge.y1} C ${edge.x1} ${midY}, ${edge.x2} ${midY}, ${edge.x2} ${edge.y2}`;
  }

  return <path className="dbv-plan-edge" d={d} data-heavy-route={heavyRoute || undefined} />;
}

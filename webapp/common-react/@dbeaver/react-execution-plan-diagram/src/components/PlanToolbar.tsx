/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IPanZoomState } from '../hooks/usePanZoom.js';

import './PlanToolbar.css';

export interface PlanToolbarProps {
  panZoom: IPanZoomState;
  contentWidth: number;
  contentHeight: number;
}

export function PlanToolbar({ panZoom, contentWidth, contentHeight }: PlanToolbarProps) {
  return (
    <div className="dbv-plan-toolbar">
      <button className="dbv-plan-toolbar__button" title="Zoom in" type="button" onClick={panZoom.zoomIn}>
        +
      </button>
      <button className="dbv-plan-toolbar__button" title="Zoom out" type="button" onClick={panZoom.zoomOut}>
        −
      </button>
      <button
        className="dbv-plan-toolbar__button"
        title="Fit to screen"
        type="button"
        onClick={() => panZoom.fitToScreen(contentWidth, contentHeight)}
      >
        ⊡
      </button>
      <button className="dbv-plan-toolbar__button" title="Reset view" type="button" onClick={panZoom.resetView}>
        ↺
      </button>
    </div>
  );
}

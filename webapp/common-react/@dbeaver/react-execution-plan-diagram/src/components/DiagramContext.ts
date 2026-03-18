/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext, use } from 'react';

export interface IDiagramActions {
  zoomIn(): void;
  zoomOut(): void;
  fitToScreen(): void;
  resetView(): void;
}

export const DiagramContext = createContext<IDiagramActions | null>(null);

export function useDiagramActions(): IDiagramActions {
  const actions = use(DiagramContext);

  if (!actions) {
    throw new Error('useDiagramActions must be used inside ExecutionPlanDiagram');
  }

  return actions;
}

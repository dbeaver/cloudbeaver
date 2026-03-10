/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ReactElement } from 'react';
import { useTranslate } from '@cloudbeaver/core-blocks';
import { IconButton } from '@dbeaver/ui-kit';
import { useDiagramActions } from '@dbeaver/react-execution-plan-diagram';

import './PlanDiagramToolbar.css';

export function PlanDiagramToolbar(): ReactElement {
  const actions = useDiagramActions();
  const translate = useTranslate();

  return (
    <div className="plan-diagram-toolbar">
      <IconButton aria-label={translate('sql_execution_plan_diagram_zoom_in')} onClick={actions.zoomIn}>
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.5 6.5C10.5 8.70914 8.70914 10.5 6.5 10.5C4.29086 10.5 2.5 8.70914 2.5 6.5C2.5 4.29086 4.29086 2.5 6.5 2.5C8.70914 2.5 10.5 4.29086 10.5 6.5ZM9.68256 10.9862C8.78427 11.6246 7.68597 12 6.5 12C3.46243 12 1 9.53757 1 6.5C1 3.46243 3.46243 1 6.5 1C9.53757 1 12 3.46243 12 6.5C12 7.88792 11.4859 9.15577 10.6378 10.1235L10.7678 10.1464L15.0104 14.3891L13.9497 15.4497L9.70711 11.2071L9.68256 10.9862ZM4.8 7.29999V5.79999H5.8V4.79999H7.3V5.79999H8.3V7.29999H7.3V8.29999H5.8V7.29999H4.8Z"
            fill="currentColor"
          />
        </svg>
      </IconButton>
      <IconButton aria-label={translate('sql_execution_plan_diagram_zoom_out')} onClick={actions.zoomOut}>
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6.5 10.5C8.70914 10.5 10.5 8.70914 10.5 6.5C10.5 4.29086 8.70914 2.5 6.5 2.5C4.29086 2.5 2.5 4.29086 2.5 6.5C2.5 8.70914 4.29086 10.5 6.5 10.5ZM6.5 12C7.68597 12 8.78427 11.6246 9.68256 10.9862L9.70711 11.2071L13.9497 15.4497L15.0104 14.3891L10.7678 10.1464L10.6378 10.1235C11.4859 9.15577 12 7.88792 12 6.5C12 3.46243 9.53757 1 6.5 1C3.46243 1 1 3.46243 1 6.5C1 9.53757 3.46243 12 6.5 12ZM4.8 5.79999V7.29999H8.3V5.79999H4.8Z"
            fill="currentColor"
          />
        </svg>
      </IconButton>
      <IconButton aria-label={translate('sql_execution_plan_diagram_fit_to_screen')} onClick={actions.fitToScreen}>
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" stroke="currentColor" strokeWidth="1">
          <rect x="2" y="2" width="12" height="12" rx="1" fill="none" />
        </svg>
      </IconButton>
      <IconButton aria-label={translate('sql_execution_plan_diagram_reset_view')} onClick={actions.resetView}>
        <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em">
          <polygon fill="currentColor" points="12 10 11 10 11 14 12 14 12 10" />
          <polygon fill="currentColor" points="15 13 11 13 11 14 15 14 15 13" />
          <path
            fill="currentColor"
            d="M8,1c-3.87,0-7,3.13-7,7s3.13,7,7,7v-1.1c-3.25,0-5.9-2.65-5.9-5.9s2.65-5.9,5.9-5.9,5.9,2.65,5.9,5.9c0,2.04-1.04,3.84-2.62,4.9.33.2.57.5.71.85,1.82-1.26,3.01-3.37,3.01-5.75,0-3.87-3.13-7-7-7Z"
          />
        </svg>
      </IconButton>
    </div>
  );
}

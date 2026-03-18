/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import './ExecutionPlanCollapseIndicator.css';

interface IExecutionPlanNodeProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ExecutionPlanCollapseIndicator({ collapsed, onToggleCollapse }: IExecutionPlanNodeProps): React.ReactElement {
  return (
    <div
      className="dbv-plan-node__collapse-indicator"
      aria-hidden
      onClick={e => {
        e.stopPropagation();
        onToggleCollapse?.();
      }}
    >
      <svg width="8" height="8" viewBox="0 0 8 8">
        <line x1="1" y1="4" x2="7" y2="4" stroke="currentColor" strokeWidth="1.5" />
        {collapsed && <line x1="4" y1="1" x2="4" y2="7" stroke="currentColor" strokeWidth="1.5" />}
      </svg>
    </div>
  );
}

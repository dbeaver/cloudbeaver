/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { memo, useCallback, type FocusEventHandler, type KeyboardEventHandler, type ReactElement, type Ref } from 'react';
import { useTranslate } from '@dbeaver/react-translate';
import { formatNumber } from '@dbeaver/js-helpers';

import type { IPlanFeatures } from '../types/IPlanFeatures.js';
import type { IPlanNode } from '../types/IPlanNode.js';

import { ExecutionPlanNodeMetric } from './ExecutionPlanNodeMetric.js';
import { ExecutionPlanCollapseIndicator } from './ExecutionPlanCollapseIndicator.js';
import './ExecutionPlanNode.css';

export interface IExecutionPlanNodeProps {
  node: IPlanNode;
  x: number;
  y: number;
  width?: number;
  height: number;
  minWidth?: number;
  maxWidth?: number;
  features: IPlanFeatures;
  selected?: boolean;
  heavyRoute?: boolean;
  collapsed?: boolean;
  hasChildren?: boolean;
  horizontal?: boolean;
  tabIndex?: number;
  nodeRef?: Ref<HTMLDivElement>;
  onFocus?: (nodeId: string) => void;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  onSelect?: (nodeId: string) => void;
  onToggleCollapse?: (nodeId: string) => void;
}

export const ExecutionPlanNode = memo(function ExecutionPlanNode({
  node,
  x,
  y,
  width,
  height,
  minWidth,
  maxWidth,
  features,
  selected,
  heavyRoute,
  collapsed,
  hasChildren,
  horizontal,
  tabIndex,
  nodeRef,
  onFocus,
  onKeyDown,
  onSelect,
  onToggleCollapse,
}: IExecutionPlanNodeProps): ReactElement {
  const translate = useTranslate();
  const percent = node.percent != null ? Math.round(node.percent * 100) : null;
  const hint = hasChildren
    ? translate(
        collapsed ? 'plugin_sql_execution_plan_diagram_node_expand_hint' : 'plugin_sql_execution_plan_diagram_node_collapse_hint',
        collapsed ? '{arg:type} — press C to expand' : '{arg:type} — press C to collapse',
        { type: node.type },
      )
    : undefined;
  const handleFocus: FocusEventHandler<HTMLDivElement> = useCallback(() => {
    onFocus?.(node.id);
  }, [node.id, onFocus]);

  const handleCollapseToggle = useCallback(() => {
    if (hasChildren) {
      onToggleCollapse?.(node.id);
    }
  }, [hasChildren, node.id, onToggleCollapse]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      onSelect?.(node.id);
    },
    [node.id, onSelect],
  );

  return (
    <div
      ref={nodeRef}
      className="dbv-plan-node"
      data-hint={hint}
      data-node-id={node.id}
      style={{ left: x, top: y, width, minWidth, maxWidth, minHeight: height || undefined }}
      data-selected={selected || undefined}
      data-heavy-route={heavyRoute || undefined}
      data-collapsed={collapsed || undefined}
      data-horizontal={horizontal || undefined}
      data-kind={node.kind}
      role="option"
      tabIndex={tabIndex}
      aria-selected={selected ?? false}
      aria-expanded={hasChildren ? !collapsed : undefined}
      onFocus={handleFocus}
      onKeyDown={onKeyDown}
      onClick={handleClick}
    >
      <div className="dbv-plan-node__caption">{node.type}</div>
      {node.name && <div className="dbv-plan-node__name">{node.name}</div>}
      <div className="dbv-plan-node__metrics">
        {features.hasCost && node.cost != null && (
          <ExecutionPlanNodeMetric labelKey="plugin_sql_execution_plan_diagram_cost" label="Cost">
            {formatNumber(node.cost, 2)}
            {percent != null && ` (${percent}%)`}
          </ExecutionPlanNodeMetric>
        )}
        {features.hasRows && node.rowCount != null && (
          <ExecutionPlanNodeMetric labelKey="plugin_sql_execution_plan_diagram_rows" label="Rows">
            {formatNumber(node.rowCount, 0)}
          </ExecutionPlanNodeMetric>
        )}
        {features.hasDuration && node.duration != null && (
          <ExecutionPlanNodeMetric labelKey="plugin_sql_execution_plan_diagram_time" label="Time">
            {formatDuration(node.duration)}
          </ExecutionPlanNodeMetric>
        )}
      </div>
      {features.hasCost && percent != null && (
        <div className="dbv-plan-node__cost-bar">
          <div className="dbv-plan-node__cost-bar-fill" style={{ width: `${percent}%` }} />
        </div>
      )}
      {hasChildren && <ExecutionPlanCollapseIndicator collapsed={collapsed} onToggleCollapse={handleCollapseToggle} />}
    </div>
  );
});

function formatDuration(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }

  return `${ms.toFixed(2)}ms`;
}

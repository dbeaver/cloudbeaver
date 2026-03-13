/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { FocusEventHandler, KeyboardEventHandler, ReactElement, Ref } from 'react';
import { useTranslate } from '@dbeaver/react-translate';
import { formatNumber } from '@dbeaver/js-helpers';

import type { IPlanFeatures } from '../types/IPlanFeatures.js';
import type { IPlanNode } from '../types/IPlanNode.js';

import { PlanNodeMetric } from './PlanNodeMetric.js';
import './PlanNode.css';

export interface PlanNodeProps {
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

export function PlanNode({
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
}: PlanNodeProps): ReactElement {
  const translate = useTranslate();
  const percent = node.percent != null ? Math.round(node.percent * 100) : null;
  const isHighCost = percent != null && percent > 50;
  const hint = hasChildren
    ? translate(
        collapsed ? 'sql_execution_plan_diagram_node_expand_hint' : 'sql_execution_plan_diagram_node_collapse_hint',
        collapsed ? '{arg:type} — press C to expand' : '{arg:type} — press C to collapse',
        { type: node.type },
      )
    : undefined;
  const handleFocus: FocusEventHandler<HTMLDivElement> = () => {
    onFocus?.(node.id);
  };

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
      role="option"
      tabIndex={tabIndex}
      aria-selected={selected ?? false}
      aria-expanded={hasChildren ? !collapsed : undefined}
      onFocus={handleFocus}
      onKeyDown={onKeyDown}
      onClick={e => {
        e.stopPropagation();
        onSelect?.(node.id);
      }}
    >
      <div className="dbv-plan-node__caption">{node.type}</div>
      {node.name && <div className="dbv-plan-node__name">{node.name}</div>}
      <div className="dbv-plan-node__metrics">
        {features.hasCost && node.cost != null && (
          <PlanNodeMetric labelKey="sql_execution_plan_diagram_cost" label="Cost">
            {formatNumber(node.cost, 2)}
            {percent != null && ` (${percent}%)`}
          </PlanNodeMetric>
        )}
        {features.hasRows && node.rowCount != null && (
          <PlanNodeMetric labelKey="sql_execution_plan_diagram_rows" label="Rows">
            {formatNumber(node.rowCount, 0)}
          </PlanNodeMetric>
        )}
        {features.hasDuration && node.duration != null && (
          <PlanNodeMetric labelKey="sql_execution_plan_diagram_time" label="Time">
            {formatDuration(node.duration)}
          </PlanNodeMetric>
        )}
      </div>
      {features.hasCost && percent != null && (
        <div className="dbv-plan-node__cost-bar">
          <div className="dbv-plan-node__cost-bar-fill" style={{ width: `${percent}%` }} data-high-cost={isHighCost || undefined} />
        </div>
      )}
      {hasChildren && (
        <div
          className="dbv-plan-node__collapse-indicator"
          aria-hidden
          onClick={e => {
            e.stopPropagation();
            onToggleCollapse?.(node.id);
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8">
            <line x1="1" y1="4" x2="7" y2="4" stroke="currentColor" strokeWidth="1.5" />
            {collapsed && <line x1="4" y1="1" x2="4" y2="7" stroke="currentColor" strokeWidth="1.5" />}
          </svg>
        </div>
      )}
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }

  return `${ms.toFixed(2)}ms`;
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { FocusEventHandler, KeyboardEventHandler, ReactElement, Ref } from 'react';

import type { IPlanFeatures } from '../types/IPlanFeatures.js';
import type { IPlanNode } from '../types/IPlanNode.js';

import './PlanNode.css';

export interface PlanNodeProps {
  node: IPlanNode;
  x: number;
  y: number;
  width: number;
  height: number;
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
  const percent = node.percent != null ? Math.round(node.percent * 100) : null;
  const isHighCost = percent != null && percent > 50;
  const handleFocus: FocusEventHandler<HTMLDivElement> = () => {
    onFocus?.(node.id);
  };

  return (
    <div
      ref={nodeRef}
      className="dbv-plan-node"
      data-node-id={node.id}
      style={{ left: x, top: y, width, minHeight: height || undefined }}
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
      <div className="dbv-plan-node__caption" title={node.type}>
        {node.type}
      </div>
      {node.name && (
        <div className="dbv-plan-node__name" title={node.name}>
          {node.name}
        </div>
      )}
      <div className="dbv-plan-node__metrics">
        {features.hasCost && node.cost != null && (
          <div className="dbv-plan-node__metric">
            <span className="dbv-plan-node__metric-label">Cost</span>
            <span className="dbv-plan-node__metric-value">
              {formatNumber(node.cost)}
              {percent != null && ` (${percent}%)`}
            </span>
          </div>
        )}
        {features.hasRows && node.rowCount != null && (
          <div className="dbv-plan-node__metric">
            <span className="dbv-plan-node__metric-label">Rows</span>
            <span className="dbv-plan-node__metric-value">{formatNumber(node.rowCount)}</span>
          </div>
        )}
        {features.hasDuration && node.duration != null && (
          <div className="dbv-plan-node__metric">
            <span className="dbv-plan-node__metric-label">Time</span>
            <span className="dbv-plan-node__metric-value">{formatDuration(node.duration)}</span>
          </div>
        )}
      </div>
      {features.hasCost && percent != null && (
        <div className="dbv-plan-node__cost-bar">
          <div className="dbv-plan-node__cost-bar-fill" style={{ width: `${percent}%` }} data-high-cost={isHighCost || undefined} />
        </div>
      )}
      {hasChildren && (
        <button
          type="button"
          className="dbv-plan-node__collapse-indicator"
          aria-label={collapsed ? `Expand ${node.type}` : `Collapse ${node.type}`}
          aria-expanded={!collapsed}
          onKeyDown={e => {
            e.stopPropagation();
          }}
          onKeyUp={e => {
            e.stopPropagation();
          }}
          onClick={e => {
            e.stopPropagation();
            onToggleCollapse?.(node.id);
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8">
            <line x1="1" y1="4" x2="7" y2="4" stroke="currentColor" strokeWidth="1.5" />
            {collapsed && <line x1="4" y1="1" x2="4" y2="7" stroke="currentColor" strokeWidth="1.5" />}
          </svg>
        </button>
      )}
    </div>
  );
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value % 1 === 0 ? String(value) : value.toFixed(2);
}

function formatDuration(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }

  return `${ms.toFixed(2)}ms`;
}

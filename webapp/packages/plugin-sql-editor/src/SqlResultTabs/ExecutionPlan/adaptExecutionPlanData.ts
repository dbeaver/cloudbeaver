/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IPlanData, IPlanNode, IPlanNodeProperty, PlanNodeKind } from '@dbeaver/react-execution-plan-diagram';
import type { SqlExecutionPlanNode } from '@cloudbeaver/core-sdk';

/* We try to extract these values from properties with various possible names depending on the database and driver
 should be implemented on backend side in the future to avoid this mess */
const COST_PROPERTY_IDS = ['Total-Cost', 'read_cost', 'query_cost', 'Cost', 'cost'];
const ROWS_PROPERTY_IDS = ['actualRows', 'Plan-Rows', 'rows_examined_per_scan', 'Cardinality', 'rows'];
const DURATION_PROPERTY_IDS = ['totalTime', 'Elapsed Time'];

function parseNumericValue(value: string): number | undefined {
  // Handle range format like "0.00 - 3.25" — take the max (last) value
  const rangeMatch = value.match(/[\d.]+\s*-\s*([\d.]+)/);

  if (rangeMatch) {
    const num = Number(rangeMatch[1]);
    return isNaN(num) ? undefined : num;
  }

  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

function findPropertyValue(node: SqlExecutionPlanNode, ids: string[]): number | undefined {
  for (const id of ids) {
    const prop = node.properties.find(p => p.id === id);

    if (prop?.value != null) {
      const result = parseNumericValue(String(prop.value));

      if (result !== undefined) {
        return result;
      }
    }
  }

  return undefined;
}

function mapNode(node: SqlExecutionPlanNode): IPlanNode {
  const cost = findPropertyValue(node, COST_PROPERTY_IDS);
  const rowCount = findPropertyValue(node, ROWS_PROPERTY_IDS);
  const duration = findPropertyValue(node, DURATION_PROPERTY_IDS);

  const properties: IPlanNodeProperty[] = node.properties.map(p => ({
    id: p.id ?? '',
    displayName: p.displayName ?? p.id ?? '',
    value: p.value ?? null,
    description: p.description ?? undefined,
    category: p.category ?? undefined,
  }));

  return {
    id: node.id,
    kind: (node.kind as PlanNodeKind) ?? 'DEFAULT',
    name: node.name ?? undefined,
    type: node.type,
    condition: node.condition ?? undefined,
    description: node.description ?? undefined,
    parentId: node.parentId ?? undefined,
    cost,
    duration,
    rowCount,
    properties,
  };
}

export function adaptExecutionPlanData(nodes: SqlExecutionPlanNode[]): IPlanData {
  const planNodes = nodes.map(mapNode);

  const hasCost = planNodes.some(n => n.cost != null);
  const hasRows = planNodes.some(n => n.rowCount != null);
  const hasDuration = planNodes.some(n => n.duration != null);

  if (hasCost && !planNodes.some(n => n.percent != null)) {
    const maxCost = Math.max(...planNodes.map(n => n.cost ?? 0));

    if (maxCost > 0) {
      for (const node of planNodes) {
        if (node.cost != null) {
          node.percent = node.cost / maxCost;
        }
      }
    }
  }

  return {
    nodes: planNodes,
    features: { hasCost, hasRows, hasDuration },
  };
}

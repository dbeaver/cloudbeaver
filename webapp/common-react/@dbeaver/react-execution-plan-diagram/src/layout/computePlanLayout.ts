/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import dagre from 'dagre';

import type { IPlanDiagramOptions } from '../types/IPlanDiagramOptions.js';
import type { IPlanNode } from '../types/IPlanNode.js';
import type { ILayoutResult } from './ILayoutResult.js';

const NODE_SEP = 40;
const RANK_SEP = 60;
const MARGIN = 20;

export function computePlanLayout(
  nodes: IPlanNode[],
  nodeSizes: Map<string, { width: number; height: number }>,
  options?: IPlanDiagramOptions,
): ILayoutResult {
  const g = new dagre.graphlib.Graph();

  const direction = options?.direction ?? 'LR';

  g.setGraph({
    rankdir: direction,
    nodesep: NODE_SEP,
    ranksep: RANK_SEP,
    marginx: MARGIN,
    marginy: MARGIN,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    const size = nodeSizes.get(node.id) ?? { width: 120, height: 60 };
    g.setNode(node.id, { width: size.width, height: size.height });
  }

  const nodeIds = new Set(nodes.map(n => n.id));

  for (const node of nodes) {
    if (node.children) {
      for (const child of node.children) {
        if (nodeIds.has(child.id)) {
          g.setEdge(node.id, child.id);
        }
      }
    }
  }

  dagre.layout(g);

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const graphLabel = g.graph()!;

  const layoutNodes = g.nodes().map(id => {
    const dagreNode = g.node(id);

    return {
      id,
      node: nodeMap.get(id)!,
      x: dagreNode.x - dagreNode.width / 2,
      y: dagreNode.y - dagreNode.height / 2,
      width: dagreNode.width,
      height: dagreNode.height,
    };
  });

  const layoutNodeMap = new Map(layoutNodes.map(n => [n.id, n]));

  const isHorizontal = direction === 'LR' || direction === 'RL';

  const layoutEdges = g.edges().map(e => {
    const source = layoutNodeMap.get(e.v)!;
    const target = layoutNodeMap.get(e.w)!;

    if (isHorizontal) {
      // LR: right-center → left-center; RL: left-center → right-center
      const sourceRight = direction === 'LR';

      return {
        sourceId: e.v,
        targetId: e.w,
        x1: sourceRight ? source.x + source.width : source.x,
        y1: source.y + source.height / 2 + 1,
        x2: sourceRight ? target.x : target.x + target.width,
        y2: target.y + target.height / 2 + 1,
      };
    }

    return {
      sourceId: e.v,
      targetId: e.w,
      x1: source.x + source.width / 2,
      y1: source.y + source.height,
      x2: target.x + target.width / 2,
      y2: target.y,
    };
  });

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    width: graphLabel.width ?? 0,
    height: graphLabel.height ?? 0,
  };
}

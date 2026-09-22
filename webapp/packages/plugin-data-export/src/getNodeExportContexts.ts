/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { EObjectFeature, type NavNode } from '@cloudbeaver/core-navigation-tree';
import { withTimestamp } from '@dbeaver/js-helpers';

import type { IExportContext } from './IExportContext.js';

export interface INodeExportConnection {
  key: IConnectionInfoParams;
  name: string;
}

export function isExportableNode(node: NavNode): boolean {
  return node.objectFeatures.includes(EObjectFeature.dataContainer);
}

/**
 * Builds one export context per exportable node. The server exports a single container per task,
 * so a multi-object export is a list of contexts sharing the same processor configuration.
 *
 * Nodes that can't be exported (columns, indexes) and nodes without a resolvable connection are skipped.
 * A repeated connection name + object name pair (e.g. same table name in two schemas) gets a
 * disambiguating suffix so the batch never produces two identical file names.
 */
export function getNodeExportContexts(nodes: NavNode[], getConnection: (nodeId: string) => INodeExportConnection | undefined): IExportContext[] {
  const contexts: IExportContext[] = [];
  const occurrences = new Map<string, number>();

  for (const node of nodes) {
    if (!isExportableNode(node)) {
      continue;
    }

    const connection = getConnection(node.uri);

    if (!connection) {
      continue;
    }

    const baseName = `${connection.name}${node.name ? ` - ${node.name}` : ''}`;
    const occurrence = (occurrences.get(baseName) ?? 0) + 1;
    occurrences.set(baseName, occurrence);

    contexts.push({
      connectionKey: connection.key,
      name: node.name,
      fileName: withTimestamp(occurrence > 1 ? `${baseName} (${occurrence})` : baseName),
      containerNodePath: node.uri,
    });
  }

  return contexts;
}

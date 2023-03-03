/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export const NodeManagerUtils = {
  parentsFromPath(nodeId: string): string[] {
    const parts = nodeId
      .replace('//', '\\')
      .split('/');
    let lastPath = '';
    const parents: string[] = [];

    if (parts.length < 2) {
      return parents;
    }

    for (const part of parts) {
      if (lastPath !== '') {
        lastPath += '/';
      }
      lastPath += part.replace('\\', '//');

      parents.push(lastPath);
    }

    return parents;
  },

  connectionIdToConnectionNodeId(connectionId: string): string {
    return `database://${connectionId}`;
  },

  isDatabaseObject(objectId: string): boolean {
    return objectId.startsWith('database://');
  },

  concatSchemaAndCatalog(catalogId?: string, schemaId?: string): string {
    return `${schemaId || ''}${schemaId && catalogId ? '@' : ''}${catalogId || ''}`;
  },
};

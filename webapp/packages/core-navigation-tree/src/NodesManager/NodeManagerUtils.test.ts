/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { NodeManagerUtils } from './NodeManagerUtils.js';
import type { NavNode } from './EntityTypes.js';

function makeNode(objectId?: string): NavNode {
  return { uri: '', objectId, folder: false, hasChildren: false, inline: false, navigable: false, filtered: false, objectFeatures: [] };
}

describe('NodeManagerUtils', () => {
  describe('connectionIdToConnectionNodeId', () => {
    it('should prepend "node://" to the connectionId', () => {
      const connectionId = '12345';
      const result = NodeManagerUtils.connectionIdToConnectionNodeId('project', connectionId);
      expect(result).toBe('node://project/datasources/12345');
    });

    it('should work with different connectionId values', () => {
      expect(NodeManagerUtils.connectionIdToConnectionNodeId('project', 'abc')).toBe('node://project/datasources/abc');
      expect(NodeManagerUtils.connectionIdToConnectionNodeId('project', '')).toBe('node://project/datasources');
    });
  });

  describe('isDatabaseObject', () => {
    it('should return true for nodes with an objectId', () => {
      expect(NodeManagerUtils.isDatabaseObject(makeNode('connection-123'))).toBe(true);
      expect(NodeManagerUtils.isDatabaseObject(makeNode('schema-abc'))).toBe(true);
    });

    it('should return false for connection folders and navigation-only nodes without objectId', () => {
      expect(NodeManagerUtils.isDatabaseObject(makeNode(undefined))).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(NodeManagerUtils.isDatabaseObject(undefined)).toBe(false);
    });
  });

  describe('concatSchemaAndCatalog', () => {
    it('should concatenate schemaId and catalogId with "@" when both are provided', () => {
      const result = NodeManagerUtils.concatSchemaAndCatalog('catalog1', 'schema1');
      expect(result).toBe('schema1@catalog1');
    });

    it('should return just schemaId if catalogId is undefined', () => {
      expect(NodeManagerUtils.concatSchemaAndCatalog(undefined, 'schema1')).toBe('schema1');
    });

    it('should return just catalogId if schemaId is undefined', () => {
      expect(NodeManagerUtils.concatSchemaAndCatalog('catalog1', undefined)).toBe('catalog1');
    });

    it('should return an empty string if both are undefined', () => {
      expect(NodeManagerUtils.concatSchemaAndCatalog(undefined, undefined)).toBe('');
    });

    it('should handle cases with empty strings', () => {
      expect(NodeManagerUtils.concatSchemaAndCatalog('', 'catalog1')).toBe('catalog1');
      expect(NodeManagerUtils.concatSchemaAndCatalog('schema1', '')).toBe('schema1');
      expect(NodeManagerUtils.concatSchemaAndCatalog('', '')).toBe('');
    });
  });
});

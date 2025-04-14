/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { NodeManagerUtils } from './NodeManagerUtils.js';

describe('NodeManagerUtils', () => {
  describe('connectionIdToConnectionNodeId', () => {
    it('should prepend "database://" to the connectionId', () => {
      const connectionId = '12345';
      const result = NodeManagerUtils.connectionIdToConnectionNodeId(connectionId);
      expect(result).toBe('database://12345');
    });

    it('should work with different connectionId values', () => {
      expect(NodeManagerUtils.connectionIdToConnectionNodeId('abc')).toBe('database://abc');
      expect(NodeManagerUtils.connectionIdToConnectionNodeId('')).toBe('database://');
    });
  });

  describe('isDatabaseObject', () => {
    it('should return true for objectIds starting with "database://"', () => {
      expect(NodeManagerUtils.isDatabaseObject('database://123')).toBe(true);
      expect(NodeManagerUtils.isDatabaseObject('database://abc')).toBe(true);
    });

    it('should return false for objectIds not starting with "database://"', () => {
      expect(NodeManagerUtils.isDatabaseObject('http://example.com')).toBe(false);
      expect(NodeManagerUtils.isDatabaseObject('12345')).toBe(false);
      expect(NodeManagerUtils.isDatabaseObject('')).toBe(false);
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

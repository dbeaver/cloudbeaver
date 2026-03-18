/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export enum EPlanNodeKind {
  DEFAULT = 'DEFAULT',
  SELECT = 'SELECT',
  TABLE_SCAN = 'TABLE_SCAN',
  INDEX_SCAN = 'INDEX_SCAN',
  JOIN = 'JOIN',
  HASH = 'HASH',
  UNION = 'UNION',
  FILTER = 'FILTER',
  AGGREGATE = 'AGGREGATE',
  SORT = 'SORT',
  RESULT = 'RESULT',
  SET = 'SET',
  MERGE = 'MERGE',
  GROUP = 'GROUP',
  MATERIALIZE = 'MATERIALIZE',
  FUNCTION = 'FUNCTION',
  MODIFY = 'MODIFY',
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISyncContextLoader } from '@cloudbeaver/core-executor';

import type { ISQLScriptSegment } from '../SQLParser.js';
import type { ISQLEditorData } from './ISQLEditorData.js';

export interface ISQLEditorMode {
  activeSegment: ISQLScriptSegment | undefined;
  activeSegmentMode: boolean;
}

export const SQLEditorModeContext: ISyncContextLoader<ISQLEditorMode, ISQLEditorData> = function SQLEditorModeContext(context, data) {
  const from = Math.min(data.cursor.anchor, data.cursor.head);
  const to = Math.max(data.cursor.anchor, data.cursor.head);

  return {
    activeSegment: data.parser.getSegment(from, to),
    activeSegmentMode: false,
  };
};

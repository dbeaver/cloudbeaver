/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ISyncContextLoader } from '@cloudbeaver/core-executor';

import type { ISQLScriptSegment } from '../SQLParser';
import type { ISQLEditorData } from './ISQLEditorData';


export interface ISQLEditorMode {
  activeSegment: ISQLScriptSegment | undefined;
  activeSegmentMode: boolean;
}

export const SQLEditorModeContext: ISyncContextLoader<ISQLEditorMode, ISQLEditorData> = function SQLEditorModeContext(context, data) {
  return {
    activeSegment: data.parser.getSegment(data.cursor.begin, data.cursor.end),
    activeSegmentMode: false,
  };
};
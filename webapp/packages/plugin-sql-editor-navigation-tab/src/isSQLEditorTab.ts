/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ITab } from '@cloudbeaver/plugin-navigation-tabs';
import type { ISqlEditorTabState } from '@cloudbeaver/plugin-sql-editor';

import { sqlEditorTabHandlerKey } from './sqlEditorTabHandlerKey.js';

export function isSQLEditorTab(tab: ITab): tab is ITab<ISqlEditorTabState>;
export function isSQLEditorTab(predicate: (tab: ITab<ISqlEditorTabState>) => boolean): (tab: ITab) => tab is ITab<ISqlEditorTabState>;
export function isSQLEditorTab(tab: ITab | ((tab: ITab<ISqlEditorTabState>) => boolean)): boolean | ((tab: ITab) => tab is ITab<ISqlEditorTabState>) {
  if (typeof tab === 'function') {
    const predicate = tab;
    return (tab: ITab): tab is ITab<ISqlEditorTabState> => {
      const sqlEditorTab = tab.handlerId === sqlEditorTabHandlerKey;
      if (!sqlEditorTab) {
        return sqlEditorTab;
      }
      return predicate(tab);
    };
  }
  return tab.handlerId === sqlEditorTabHandlerKey;
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ActionService, ACTION_OPEN_IN_TAB, KeyBindingService, KEY_BINDING_OPEN_IN_TAB } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_SQL_EDITOR_STATE } from '@cloudbeaver/plugin-sql-editor';

import { SqlEditorScreenService } from './Screen/SqlEditorScreenService';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly actionService: ActionService,
    private readonly keyBindingService: KeyBindingService,
    private readonly sqlEditorScreenService: SqlEditorScreenService,
    private readonly notificationService: NotificationService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.actionService.addHandler({
      id: 'sql-editor-screen',
      isActionApplicable: (contexts, action) => (
        action === ACTION_OPEN_IN_TAB
        && contexts.has(DATA_CONTEXT_SQL_EDITOR_STATE)
      ),
      handler: (context, action) => { },
    });
    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor',
      binding: KEY_BINDING_OPEN_IN_TAB,
      isBindingApplicable: (contexts, action) => action === ACTION_OPEN_IN_TAB,
      handler: (contexts, action) => {
        const context = contexts.get(DATA_CONTEXT_SQL_EDITOR_STATE);

        if (!context.executionContext) {
          this.notificationService.logError({
            title: 'sd',
          });
          return;
        }

        const url = this.sqlEditorScreenService.createURL({
          connectionId: context.executionContext.connectionId,
          contextId: context.executionContext.baseId,
        });

        window.open(url, '_blank')?.focus();
      },
    });
  }

  async load(): Promise<void> { }
}

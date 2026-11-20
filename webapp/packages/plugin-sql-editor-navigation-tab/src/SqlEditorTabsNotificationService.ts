/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionExecutionContextNotificationService } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { INotification } from '@cloudbeaver/core-events';
import type { ITab } from '@cloudbeaver/plugin-navigation-tabs';
import { getSqlEditorName, type ISqlEditorTabState, SqlDataSourceService } from '@cloudbeaver/plugin-sql-editor';

import { SqlEditorTabService } from './SqlEditorTabService.js';

@injectable(() => [SqlEditorTabService, SqlDataSourceService, ConnectionExecutionContextNotificationService])
export class SqlEditorTabsNotificationService extends Bootstrap {
  private readonly notifications: Map<string, INotification>;

  constructor(
    private readonly sqlEditorTabService: SqlEditorTabService,
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly connectionExecutionContextNotificationService: ConnectionExecutionContextNotificationService,
  ) {
    super();
    this.notifications = new Map();
  }

  override register(): void {
    this.sqlEditorTabService.onClose.addHandler(({ tab, stage }) => {
      if (stage === 'before') {
        this.showNotification(tab);
      } else {
        this.notifications.get(tab.id)?.close();
        this.notifications.delete(tab.id);
      }
    });
  }

  private showNotification(tab: ITab<ISqlEditorTabState>): void {
    const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);
    const context = dataSource?.executionContext;

    if (!context) {
      return;
    }

    const notification = this.connectionExecutionContextNotificationService.notifyClosing(context.id, getSqlEditorName(tab.handlerState, dataSource));

    this.notifications.set(tab.id, notification);
  }
}

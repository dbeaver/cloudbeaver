/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { runInAction } from 'mobx';

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { ServerEventId, SessionDataResource } from '@cloudbeaver/core-root';
import { GraphQLService, type LogEntry } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import { LogViewerSettingsService } from './LogViewer/LogViewerSettingsService.js';
import { SessionLogsEventHandler } from './SessionLogsEventHandler.js';

export interface ILogEntry extends LogEntry {
  id: string;
}

@injectable()
export class SessionLogsResource extends CachedDataResource<ILogEntry[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly logViewerSettingsService: LogViewerSettingsService,
    sessionDataResource: SessionDataResource,
    appAuthService: AppAuthService,
    sessionLogsEventHandler: SessionLogsEventHandler,
  ) {
    super(() => []);
    this.sync(
      sessionDataResource,
      () => {},
      () => {},
    );
    sessionDataResource.onDataUpdate.addHandler(() => {
      this.clear();
    });

    appAuthService.requireAuthentication(this);

    sessionLogsEventHandler.onEvent(
      ServerEventId.CbSessionLogUpdated,
      () => {
        this.markOutdated();
      },
      undefined,
      this,
    );
  }

  protected async loader(): Promise<ILogEntry[]> {
    const maxLogRecords = this.logViewerSettingsService.maxLogRecords;
    const batchSize = this.logViewerSettingsService.logBatchSize;

    const { log } = await this.graphQLService.sdk.readSessionLog({
      maxEntries: batchSize,
      clearEntries: true,
    });

    const logs = log.map<ILogEntry>(item => ({
      ...item,
      id: uuid(),
    }));

    runInAction(() => {
      this.data.unshift(...logs.reverse());

      if (this.data.length > maxLogRecords) {
        this.data.splice(maxLogRecords, this.data.length - maxLogRecords);
      }
    });

    return this.data;
  }
}

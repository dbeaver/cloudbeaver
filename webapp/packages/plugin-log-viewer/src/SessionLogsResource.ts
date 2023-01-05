/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { runInAction, toJS } from 'mobx';

import { CoreSettingsService } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { EPermission, ServerEventId, SessionDataResource, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { GraphQLService, CachedDataResource, LogEntry } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import { LogViewerSettingsService } from './LogViewer/LogViewerSettingsService';
import { SessionLogsEventHandler } from './SessionLogsEventHandler';

export interface ILogEntry extends LogEntry {
  id: string;
}

@injectable()
export class SessionLogsResource extends CachedDataResource<ILogEntry[]> {

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly coreSettingsService: CoreSettingsService,
    private readonly logViewerSettingsService: LogViewerSettingsService,
    sessionDataResource: SessionDataResource,
    permissionsResource: SessionPermissionsResource,
    sessionLogsEventHandler: SessionLogsEventHandler,
  ) {
    super([]);
    this.sync(sessionDataResource, () => { }, () => { });
    sessionDataResource.onDataUpdate.addHandler(() => {
      this.clear();
    });

    permissionsResource.require(this, EPermission.public);

    sessionLogsEventHandler.onEvent(ServerEventId.CbSessionLogUpdated, () => {
      this.markOutdated();
      console.log('mark outdated', toJS(this.data));
    }, undefined, this);
  }

  clear() {
    this.data = [];
    this.markOutdated();
  }

  protected async loader(): Promise<ILogEntry[]> {
    const maxLogEntries = this.logViewerSettingsService.settings.isValueDefault('logBatchSize')
      ? this.coreSettingsService.settings.getValue('app.logViewer.logBatchSize')
      : this.logViewerSettingsService.settings.getValue('logBatchSize');

    const { log } = await this.graphQLService.sdk.readSessionLog({
      maxEntries: maxLogEntries,
      clearEntries: true,
    });

    const logs = log.map<ILogEntry>(item => ({
      ...item,
      id: uuid(),
    }));

    runInAction(() => {
      this.data.unshift(...logs.reverse());

      if (this.data.length > maxLogEntries) {
        this.data.splice(maxLogEntries, this.data.length - maxLogEntries);
      }
    });

    return this.data;
  }
}

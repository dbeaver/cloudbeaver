/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';

import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { GraphQLService } from '@dbeaver/core/sdk';
import { CoreSettingsService } from '@dbeaver/core/settings';
import { uuid } from '@dbeaver/core/utils';

import { ILogEntry } from './ILogEntry';

@injectable()
export class LogViewerService {

  @observable isActive = false;

  @observable private log: ILogEntry[] = [];
  private interval: any = null;

  constructor(private graphQLService: GraphQLService,
              private coreSettingsService: CoreSettingsService,
              private notificationService: NotificationService) {
  }

  toggle() {
    if (this.isActive) {
      this.stopLog();
      this.isActive = false;
    } else {
      this.startLog();
      this.isActive = true;
    }
  }

  getLog() {
    return this.log;
  }

  async startLog() {
    if (this.interval) {
      return;
    }
    await this.updateLog();
    const refreshInterval = this.coreSettingsService.settings.getValue('app.logViewer.refreshInterval');
    this.interval = setInterval(() => {
      this.updateLog();
    }, refreshInterval);
  }

  stopLog() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  @action
  clearLog() {
    this.log = [];
  }

  private async updateLog() {
    try {
      const newEntries = await this.loadLog();
      this.addNewEntries(newEntries);
    } catch (e) {
      this.notificationService.logException(e, 'Failed to load log');
    }
  }

  @action
  addNewEntries(entries: ILogEntry[]) {
    this.log.unshift(...entries.reverse());
    const maxLogEntries = this.coreSettingsService.settings.getValue('app.logViewer.maxLogEntries');
    if (this.log.length > maxLogEntries) {
      this.log.splice(maxLogEntries, this.log.length - maxLogEntries);
    }
  }

  async loadLog(): Promise<ILogEntry[]> {
    const maxLogEntries = this.coreSettingsService.settings.getValue('app.logViewer.maxLogEntries');
    const { log } = await this.graphQLService.gql.readSessionLog({
      maxEntries: maxLogEntries,
      clearEntries: true,
    });
    const entries: ILogEntry[] = (log || []).map(item => ({
      ...item,
      id: uuid(),
    }));
    return entries;
  }
}

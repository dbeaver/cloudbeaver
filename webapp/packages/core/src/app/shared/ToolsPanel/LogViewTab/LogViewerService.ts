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
import { SettingsService } from '@dbeaver/core/settings';
import { uuid } from '@dbeaver/core/utils';

import { ILogEntry } from './ILogEntry';

const REFRESH_INTERVAL = 3000;
const REFRESH_INTERVAL_TOKEN = 'core.app.logViewer.refreshInterval';
const MAX_LOG_ENTRIES = 1000;
const MAX_LOG_ENTRIES_TOKEN = 'core.app.logViewer.maxLogEntries';

@injectable()
export class LogViewerService {

  @observable isActive = false;

  @observable private log: ILogEntry[] = [];
  private interval: any = null;
  private refreshInterval = this.settingsService.getProperty(REFRESH_INTERVAL_TOKEN, REFRESH_INTERVAL);
  private maxLogEntries = this.settingsService.getProperty(MAX_LOG_ENTRIES_TOKEN, MAX_LOG_ENTRIES);

  constructor(private graphQLService: GraphQLService,
              private settingsService: SettingsService,
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
    this.interval = setInterval(() => {
      this.updateLog();
    }, this.refreshInterval);
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
    if (this.log.length > this.maxLogEntries) {
      this.log.splice(this.maxLogEntries, this.log.length - this.maxLogEntries);
    }
  }

  async loadLog(): Promise<ILogEntry[]> {
    const { log } = await this.graphQLService.gql.readSessionLog({
      maxEntries: this.maxLogEntries,
      clearEntries: true,
    });
    const entries: ILogEntry[] = (log || []).map(item => ({
      ...item,
      id: uuid(),
    }));
    return entries;
  }
}

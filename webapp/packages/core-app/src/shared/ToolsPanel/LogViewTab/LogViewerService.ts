/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { PermissionsService, EPermission } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import { CoreSettingsService } from '../../../CoreSettingsService';
import { ILogEntry } from './ILogEntry';

@injectable()
export class LogViewerService {

  @observable _isActive = false;

  get isActive() {
    return this._isActive;
  }

  @observable private log: ILogEntry[] = [];
  private interval: any = null;
  private failedRequestsCount = 0;
  private maxFailedRequests = 0;

  constructor(
    private graphQLService: GraphQLService,
    private coreSettingsService: CoreSettingsService,
    private notificationService: NotificationService,
    private permissionsService: PermissionsService,
  ) {
    this.permissionsService.onUpdate.subscribe(this.stopIfHasNoPermission.bind(this));
  }

  toggle() {
    if (this._isActive) {
      this.stopLog();
    } else {
      this.startLog();
    }
  }

  getLog() {
    return this.log;
  }

  async startLog() {
    if (this._isActive) {
      return;
    }
    if (!this.isLogViewerAvailable()) {
      throw new Error('Access denied');
    }
    this._isActive = true;
    await this.updateLog();
    const refreshInterval = this.coreSettingsService.settings.getValue('app.logViewer.refreshTimeout');
    this.maxFailedRequests = this.coreSettingsService.settings.getValue('app.logViewer.maxFailedRequests');
    this.interval = setInterval(() => {
      this.updateLog();
    }, refreshInterval);
  }

  stopLog() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this._isActive = false;
  }

  @action
  clearLog() {
    this.log = [];
  }

  async loadLog(): Promise<ILogEntry[]> {
    const maxLogEntries = this.coreSettingsService.settings.getValue('app.logViewer.logBatchSize');
    const { log } = await this.graphQLService.sdk.readSessionLog({
      maxEntries: maxLogEntries,
      clearEntries: true,
    });
    const entries: ILogEntry[] = (log || []).map(item => ({
      ...item,
      id: uuid(),
    }));
    return entries;
  }

  @action
  private addNewEntries(entries: ILogEntry[]) {
    this.log.unshift(...entries.reverse());
    const maxLogEntries = this.coreSettingsService.settings.getValue('app.logViewer.maxLogRecords');
    if (this.log.length > maxLogEntries) {
      this.log.splice(maxLogEntries, this.log.length - maxLogEntries);
    }
  }

  private async updateLog() {
    if (!this.isLogViewerAvailable()) {
      return;
    }

    try {
      const newEntries = await this.loadLog();
      this.addNewEntries(newEntries);
    } catch (e) {
      this.notificationService.logException(e, 'Failed to load log');

      this.failedRequestsCount++;
      if (this.failedRequestsCount === this.maxFailedRequests) {
        this.stopLog();
      }
    }
  }

  private stopIfHasNoPermission() {
    if (this._isActive && !this.isLogViewerAvailable()) {
      this.stopLog();
    }
  }

  private isLogViewerAvailable() {
    return this.permissionsService.has(EPermission.public);
  }
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { PermissionsService, EPermission, PermissionsResource, SessionExpireService } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import { CoreSettingsService } from '../../../CoreSettingsService';
import type { ILogEntry } from './ILogEntry';

@injectable()
export class LogViewerService {
  _isActive = false;

  get isActive(): boolean {
    return this._isActive;
  }

  private log: ILogEntry[] = [];
  private timeoutTaskId: NodeJS.Timeout | null = null;
  private failedRequestsCount = 0;
  private maxFailedRequests = 0;

  constructor(
    private graphQLService: GraphQLService,
    private coreSettingsService: CoreSettingsService,
    private notificationService: NotificationService,
    private permissionsService: PermissionsService,
    private permissionsResource: PermissionsResource,
    private sessionExpireService: SessionExpireService
  ) {
    makeObservable<LogViewerService, 'log' | 'addNewEntries'>(this, {
      _isActive: observable,
      log: observable,
      clearLog: action,
      addNewEntries: action,
    });

    this.permissionsResource.onDataUpdate.addHandler(this.stopIfHasNoPermission.bind(this));
  }

  toggle(): void {
    if (this._isActive) {
      this.stopLog();
    } else {
      this.startLog();
    }
  }

  getLog(): ILogEntry[] {
    return this.log;
  }

  async startLog(): Promise<void> {
    if (this._isActive) {
      return;
    }
    if (!this.isLogViewerAvailable()) {
      throw new Error('Access denied');
    }
    this.failedRequestsCount = 0;
    this._isActive = true;
    const refreshInterval = this.coreSettingsService.settings.getValue('app.logViewer.refreshTimeout');
    this.maxFailedRequests = this.coreSettingsService.settings.getValue('app.logViewer.maxFailedRequests');

    await this.updateLog();
    this.runInterval(refreshInterval);
  }

  stopLog(): void {
    if (this.timeoutTaskId) {
      clearTimeout(this.timeoutTaskId);
      this.timeoutTaskId = null;
    }
    this._isActive = false;
  }

  clearLog(): void {
    this.log = [];
  }

  async loadLog(): Promise<ILogEntry[]> {
    const maxLogEntries = this.coreSettingsService.settings.getValue('app.logViewer.logBatchSize');
    const { log } = await this.graphQLService.sdk.readSessionLog({
      maxEntries: maxLogEntries,
      clearEntries: true,
    });
    const entries: ILogEntry[] = log.map(item => ({
      ...item,
      id: uuid(),
    }));
    return entries;
  }

  private addNewEntries(entries: ILogEntry[]) {
    this.log.unshift(...entries.reverse());
    const maxLogEntries = this.coreSettingsService.settings.getValue('app.logViewer.maxLogRecords');
    if (this.log.length > maxLogEntries) {
      this.log.splice(maxLogEntries, this.log.length - maxLogEntries);
    }
  }

  private runInterval(refreshInterval: number) {
    this.timeoutTaskId = setTimeout(async () => {
      await this.updateLog();

      if (this._isActive) {
        this.runInterval(refreshInterval);
      }
    }, refreshInterval);
  }

  private async updateLog() {
    try {
      const newEntries = await this.loadLog();
      this.addNewEntries(newEntries);
    } catch (e: any) {
      if (this.failedRequestsCount === 0 && !this.sessionExpireService.sessionExpired) {
        this.notificationService.logException(e, 'Failed to load log');
      }

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

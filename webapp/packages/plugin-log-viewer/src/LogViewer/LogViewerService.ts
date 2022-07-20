/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable, makeObservable, computed } from 'mobx';

import { CoreSettingsService } from '@cloudbeaver/core-app';
import { UserDataService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { PermissionsService, EPermission, SessionPermissionsResource, SessionExpireService } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import type { ILogEntry } from './ILogEntry';
import { LogViewerSettingsService } from './LogViewerSettingsService';

const logViewerSettingsKey = 'log-viewer';

interface ISettings {
  active: boolean;
}

@injectable()
export class LogViewerService {
  get settings() {
    return this.userDataService.getUserData(logViewerSettingsKey, getLogViewerDefaultSettings);
  }

  get isActive(): boolean {
    return this.settings.active;
  }

  private log: ILogEntry[] = [];
  private timeoutTaskId: NodeJS.Timeout | null = null;
  private failedRequestsCount = 0;
  private maxFailedRequests = 0;

  constructor(
    private readonly userDataService: UserDataService,
    private readonly graphQLService: GraphQLService,
    private readonly coreSettingsService: CoreSettingsService,
    private readonly notificationService: NotificationService,
    private readonly permissionsService: PermissionsService,
    private readonly permissionsResource: SessionPermissionsResource,
    private readonly logViewerSettingsService: LogViewerSettingsService,
    private readonly sessionExpireService: SessionExpireService
  ) {

    makeObservable<LogViewerService, 'log' | 'addNewEntries'>(this, {
      settings: computed,
      log: observable,
      clearLog: action,
      addNewEntries: action,
    });

    this.permissionsResource.onDataUpdate.addHandler(this.stopIfHasNoPermission.bind(this));
  }

  toggle(): void {
    if (this.isActive) {
      this.stopLog();
    } else {
      this.startLog();
    }
  }

  getLog(): ILogEntry[] {
    return this.log;
  }

  async startLog(): Promise<void> {
    if (this.isActive) {
      return;
    }
    if (!this.isLogViewerAvailable()) {
      throw new Error('Access denied');
    }
    this.failedRequestsCount = 0;
    this.settings.active = true;

    const refreshInterval = this.logViewerSettingsService.settings.isValueDefault('refreshTimeout')
      ? this.coreSettingsService.settings.getValue('app.logViewer.refreshTimeout')
      : this.logViewerSettingsService.settings.getValue('refreshTimeout');

    this.maxFailedRequests = this.logViewerSettingsService.settings.isValueDefault('maxFailedRequests')
      ? this.coreSettingsService.settings.getValue('app.logViewer.maxFailedRequests')
      : this.logViewerSettingsService.settings.getValue('maxFailedRequests');

    await this.updateLog();
    this.runInterval(refreshInterval);
  }

  stopLog(): void {
    if (this.timeoutTaskId) {
      clearTimeout(this.timeoutTaskId);
      this.timeoutTaskId = null;
    }
    this.settings.active = false;
  }

  clearLog(): void {
    this.log = [];
  }

  async loadLog(): Promise<ILogEntry[]> {
    const maxLogEntries = this.logViewerSettingsService.settings.isValueDefault('logBatchSize')
      ? this.coreSettingsService.settings.getValue('app.logViewer.logBatchSize')
      : this.logViewerSettingsService.settings.getValue('logBatchSize');

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

    const maxLogEntries = this.logViewerSettingsService.settings.isValueDefault('maxLogRecords')
      ? this.coreSettingsService.settings.getValue('app.logViewer.maxLogRecords')
      : this.logViewerSettingsService.settings.getValue('maxLogRecords');

    if (this.log.length > maxLogEntries) {
      this.log.splice(maxLogEntries, this.log.length - maxLogEntries);
    }
  }

  private runInterval(refreshInterval: number) {
    this.timeoutTaskId = setTimeout(async () => {
      await this.updateLog();

      if (this.isActive) {
        this.runInterval(refreshInterval);
      }
    }, refreshInterval);
  }

  private async updateLog() {
    try {
      const newEntries = await this.loadLog();
      this.addNewEntries(newEntries);
    } catch (exception: any) {
      if (this.failedRequestsCount === 0 && !this.sessionExpireService.expired) {
        this.notificationService.logException(exception, 'Failed to load log');
      }

      this.failedRequestsCount++;
      if (this.failedRequestsCount === this.maxFailedRequests) {
        this.stopLog();
      }
    }
  }

  private stopIfHasNoPermission() {
    if (this.isActive && !this.isLogViewerAvailable()) {
      this.stopLog();
    }
  }

  private isLogViewerAvailable() {
    return this.permissionsService.has(EPermission.public);
  }
}

function getLogViewerDefaultSettings(): ISettings {
  return {
    active: false,
  };
}

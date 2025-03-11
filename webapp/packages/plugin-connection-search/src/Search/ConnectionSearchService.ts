/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { ConfirmationDialog } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, ConnectionsManagerService, createConnectionParam } from '@cloudbeaver/core-connections';
import { injectable, IServiceProvider } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, type IExecutorHandler } from '@cloudbeaver/core-executor';
import type { AdminConnectionSearchInfo } from '@cloudbeaver/core-sdk';
import { OptionsPanelService } from '@cloudbeaver/core-ui';
import { ConnectionFormService, ConnectionFormState } from '@cloudbeaver/plugin-connections';

import { SearchDatabase } from './SearchDatabase.js';

const formGetter = () => SearchDatabase;

@injectable()
export class ConnectionSearchService {
  hosts = 'localhost';
  databases: AdminConnectionSearchInfo[];

  disabled = false;

  formState: ConnectionFormState | null = null;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly serviceProvider: IServiceProvider,
    private readonly optionsPanelService: OptionsPanelService,
    private readonly connectionFormService: ConnectionFormService,
    private readonly commonDialogService: CommonDialogService,
    private readonly connectionsManagerService: ConnectionsManagerService,
  ) {
    this.optionsPanelService.closeTask.addHandler(this.closeHandler);

    this.databases = [];
    this.search = this.search.bind(this);
    this.change = this.change.bind(this);
    this.select = this.select.bind(this);

    makeObservable(this, {
      hosts: observable,
      databases: observable,
      disabled: observable,
      formState: observable.shallow,
    });
  }

  open(): void {
    this.optionsPanelService.open(formGetter);
  }

  close(): void {
    this.hosts = 'localhost';
    this.databases = [];
  }

  async load(): Promise<void> {
    if (this.databases.length === 0) {
      await this.search();
    }
  }

  async search(): Promise<void> {
    if (this.disabled || !this.hosts || !this.hosts.trim()) {
      return;
    }

    this.disabled = true;

    try {
      const hosts = this.hosts
        .trim()
        .replace(/[\s,|+-]+/gm, ' ')
        .split(/[\s,|+-]/);

      this.databases = await this.connectionInfoResource.searchDatabases(hosts);
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Databases search failed');
    } finally {
      this.disabled = false;
    }
  }

  private readonly closeHandler: IExecutorHandler<void> = async (data, contexts) => {
    const isDialogClosed = await this.showUnsavedChangesDialog();

    if (!isDialogClosed) {
      ExecutorInterrupter.interrupt(contexts);
      return;
    }

    this.clearFormState();
    this.close();
  };

  private async showUnsavedChangesDialog(): Promise<boolean> {
    if (
      !this.formState ||
      !this.optionsPanelService.isOpen(formGetter) ||
      (this.formState.state.config.connectionId &&
        this.formState.state.projectId !== null &&
        !this.connectionInfoResource.has(createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId)))
    ) {
      return true;
    }

    if (!this.formState.isChanged) {
      return true;
    }

    const result = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'plugin_connections_connection_edit_cancel_title',
      message: 'plugin_connections_connection_edit_cancel_message',
      confirmActionText: 'ui_processing_ok',
    });

    return result !== DialogueStateResult.Rejected;
  }

  change(hosts: string): void {
    this.hosts = hosts;
  }

  saveConnection() {
    this.goBack();
  }

  goBack() {
    this.clearFormState();
  }

  select(database: AdminConnectionSearchInfo): void {
    const projects = this.connectionsManagerService.createConnectionProjects;

    if (projects.length === 0) {
      this.notificationService.logError({ title: 'core_projects_no_default_project' });
      return;
    }

    if (!this.formState) {
      this.formState = new ConnectionFormState(this.serviceProvider, this.connectionFormService, {
        config: {
          ...this.connectionInfoResource.getEmptyConfig(),
          host: database.host,
          port: String(database.port),
          driverId: database.defaultDriver,
        },
        submitType: null,
        projectId: projects[0]!.id,
        availableDrivers: database.possibleDrivers,
        type: 'public',
      });
    }
  }

  private clearFormState() {
    // TODO dispose form state once we have this API
    // this.formState?.dispose();
    this.formState = null;
  }
}

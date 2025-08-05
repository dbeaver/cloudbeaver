/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import { ConfirmationDialog, importLazyComponent } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, ConnectionsManagerService, createConnectionParam } from '@cloudbeaver/core-connections';
import { injectable, IServiceProvider } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, type IExecutorHandler } from '@cloudbeaver/core-executor';
import type { AdminConnectionSearchInfo } from '@cloudbeaver/core-sdk';
import { OptionsPanelService, type OptionsPanelCloseEventData } from '@cloudbeaver/core-ui';
import { ConnectionFormService, ConnectionFormState, getConnectionFormOptionsPart } from '@cloudbeaver/plugin-connections';

const SearchDatabase = importLazyComponent(() => import('./SearchDatabase.js').then(module => module.SearchDatabase));

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
      select: action,
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

  private readonly closeHandler: IExecutorHandler<OptionsPanelCloseEventData> = async (data, contexts) => {
    if (data === 'before') {
      const isDialogClosed = await this.showUnsavedChangesDialog();

      if (!isDialogClosed) {
        ExecutorInterrupter.interrupt(contexts);
        return;
      }

      this.clearFormState();
      this.close();
    }
  };

  private get optionsPart() {
    return this.formState ? getConnectionFormOptionsPart(this.formState) : null;
  }

  private async showUnsavedChangesDialog(): Promise<boolean> {
    if (
      !this.formState ||
      !this.optionsPanelService.isOpen(formGetter) ||
      (this.optionsPart?.state.connectionId &&
        this.formState.state.projectId !== null &&
        !this.connectionInfoResource.has(createConnectionParam(this.formState.state.projectId, this.optionsPart.state.connectionId)))
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

  saveConnection(): void {
    this.goBack();
  }

  goBack(): void {
    this.clearFormState();
  }

  async select(database: AdminConnectionSearchInfo): Promise<void> {
    const projects = this.connectionsManagerService.createConnectionProjects;

    if (projects.length === 0) {
      this.notificationService.logError({ title: 'core_projects_no_default_project' });
      return;
    }

    this.formState?.dispose();
    this.formState = new ConnectionFormState(this.serviceProvider, this.connectionFormService, {
      projectId: projects[0]!.id,
      availableDrivers: database.possibleDrivers,
      type: 'public',
      requiredNetworkHandlersIds: [],
      connectionId: undefined,
    });

    await this.optionsPart?.load();
    await this.optionsPart?.setDriverId(database.defaultDriver);

    this.optionsPart!.state.host = database.host;
    this.optionsPart!.state.port = String(database.port);
    this.optionsPart!.state.driverId = database.defaultDriver;

    this.formState.disposeTask.addHandler(this.goBack.bind(this));
  }

  private clearFormState() {
    this.formState?.dispose();
    this.formState = null;
  }
}

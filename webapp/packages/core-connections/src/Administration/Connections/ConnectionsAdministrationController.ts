/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { resourceKeyList } from '@cloudbeaver/core-sdk';

import { DatabaseConnection, compareConnections, ConnectionsResource } from '../ConnectionsResource';

@injectable()
export class ConnectionsAdministrationController {
  isProcessing = false;
  readonly selectedItems = observable<string, boolean>(new Map());
  readonly expandedItems = observable<string, boolean>(new Map());
  get connections(): DatabaseConnection[] {
    return this.connectionsResource.values.slice().sort(compareConnections);
  }

  get itemsSelected(): boolean {
    return Array.from(this.selectedItems.values()).some(v => v);
  }

  constructor(
    private notificationService: NotificationService,
    private connectionsResource: ConnectionsResource,
    private commonDialogService: CommonDialogService
  ) {
    makeObservable(this, {
      isProcessing: observable,
      connections: computed,
      itemsSelected: computed,
    });
  }

  update = async (): Promise<void> => {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    try {
      await this.connectionsResource.refreshAll();
      this.notificationService.logSuccess({ title: 'connections_administration_tools_refresh_success' });
    } catch (exception) {
      this.notificationService.logException(exception, 'connections_administration_tools_refresh_fail');
    } finally {
      this.isProcessing = false;
    }
  };

  delete = async (): Promise<void> => {
    if (this.isProcessing) {
      return;
    }

    const deletionList = Array
      .from(this.selectedItems)
      .filter(([_, value]) => value)
      .map(([connectionId]) => connectionId);

    if (deletionList.length === 0) {
      return;
    }

    const connectionNames = deletionList
      .map(id => this.connectionsResource.get(id)?.name)
      .filter(Boolean);

    const result = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'ui_data_delete_confirmation',
      message: `You're going to delete these connections: ${connectionNames.map(name => `"${name}"`).join(', ')}. Are you sure?`,
      confirmActionText: 'ui_delete',
    });

    if (result === DialogueStateResult.Rejected) {
      return;
    }

    this.isProcessing = true;

    try {
      await this.connectionsResource.delete(resourceKeyList(deletionList));
      this.selectedItems.clear();

      for (const id of deletionList) {
        this.expandedItems.delete(id);
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Connections delete failed');
    } finally {
      this.isProcessing = false;
    }
  };
}

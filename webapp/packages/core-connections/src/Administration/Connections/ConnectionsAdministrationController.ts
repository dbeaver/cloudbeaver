/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { resourceKeyList } from '@cloudbeaver/core-sdk';

import { AdminConnection, compareConnections, ConnectionsResource } from '../ConnectionsResource';

@injectable()
export class ConnectionsAdministrationController {
  isProcessing = false;
  readonly selectedItems = observable<string, boolean>(new Map());
  readonly expandedItems = observable<string, boolean>(new Map());
  get connections(): AdminConnection[] {
    return Array.from(this.connectionsResource.data.values()).sort(compareConnections);
  }

  get isLoading(): boolean {
    return this.connectionsResource.isLoading() || this.isProcessing;
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
      isLoading: computed,
      itemsSelected: computed,
    });
  }

  update = async (): Promise<void> => {
    try {
      await this.connectionsResource.refresh('all');
    } catch (exception) {
      this.notificationService.logException(exception, 'Connections update failed');
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

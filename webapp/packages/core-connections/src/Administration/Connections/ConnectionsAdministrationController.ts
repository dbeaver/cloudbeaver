/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { resourceKeyList } from '@cloudbeaver/core-sdk';

import { AdminConnection, ConnectionsResource } from '../ConnectionsResource';

@injectable()
export class ConnectionsAdministrationController {
  @observable isProcessing = false;
  readonly selectedItems = observable<string, boolean>(new Map());
  readonly expandedItems = observable<string, boolean>(new Map());
  @computed
  get connections(): AdminConnection[] {
    return Array.from(this.connectionsResource.data.values())
      .sort((a, b) => {
        const isANew = this.connectionsResource.isNew(a.id);
        const isBNew = this.connectionsResource.isNew(b.id);

        if (isANew === isBNew) {
          return 0;
        }

        if (isBNew) {
          return 1;
        }

        return -1;
      });
  }

  @computed
  get isLoading(): boolean {
    return this.connectionsResource.isLoading() || this.isProcessing;
  }

  @computed get itemsSelected(): boolean {
    return Array.from(this.selectedItems.values()).some(v => v);
  }

  constructor(
    private notificationService: NotificationService,
    private connectionsResource: ConnectionsResource,
    private commonDialogService: CommonDialogService
  ) { }

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

/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLErrorCatcher, resourceKeyList } from '@cloudbeaver/core-sdk';

import { DriverSelectDialog } from '../../DriverSelectDialog/DriverSelectDialog';
import { ConnectionsResource, isSearchedConnection } from '../ConnectionsResource';

@injectable()
export class ConnectionsAdministrationController {
  @observable hosts = 'localhost';
  @observable isProcessing = false;
  @observable isSearching = false;
  readonly selectedItems = observable<string, boolean>(new Map())
  readonly expandedItems = observable<string, boolean>(new Map())
  readonly error = new GQLErrorCatcher();

  @computed
  get findConnections() {
    return Array.from(this.connectionsResource.data.values())
      .filter(isSearchedConnection);
  }

  @computed
  get connections() {
    return Array.from(this.connectionsResource.data.values())
      .filter(connection => !isSearchedConnection(connection))
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
  get isLoading() {
    return this.connectionsResource.isLoading() || this.isProcessing;
  }

  constructor(
    private notificationService: NotificationService,
    private connectionsResource: ConnectionsResource,
    private commonDialogService: CommonDialogService,
  ) { }

  create = async () => {
    const driverId = await this.commonDialogService.open(DriverSelectDialog, null);
    if (!driverId) {
      return;
    }

    const connectionInfo = this.connectionsResource.addNew(driverId);
    this.expandedItems.set(connectionInfo.id, true);
  }

  findDatabase = () => {
    this.isSearching = !this.isSearching;
  }

  search = async () => {
    if (this.isProcessing || !this.hosts || !this.hosts.trim()) {
      return;
    }

    this.isProcessing = true;
    for (const connection of this.findConnections) {
      this.expandedItems.delete(connection.id);
    }

    try {
      await this.connectionsResource.searchDatabases(this.hosts.trim().split(' '));
    } catch (exception) {
      if (!this.error.catch(exception)) {
        this.notificationService.logException(exception, 'Databases search failed');
      }
    } finally {
      this.isProcessing = false;
    }
  }

  onSearchChange = (hosts: string) => {
    this.hosts = hosts;
  }

  update = async () => {
    try {
      await this.connectionsResource.refresh('all');
    } catch (exception) {
      if (!this.error.catch(exception)) {
        this.notificationService.logException(exception, 'Connections update failed');
      }
    }
  }

  delete = async () => {
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

    const confirmed = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'authentication_administration_confirm_user_deletion',
      message: `Would you like to delete connections: ${deletionList.join(', ')}`,
    });

    if (!confirmed) {
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
      if (!this.error.catch(exception)) {
        this.notificationService.logException(exception, 'Connections delete failed');
      }
    } finally {
      this.isProcessing = false;
    }
  }

  showDetails = () => {
    if (this.error.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.error.exception);
    }
  }
}

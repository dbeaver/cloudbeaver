/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed, makeObservable } from 'mobx';

import { compareNewConnectionsInfo, Connection, ConnectionInfoActiveProjectKey, ConnectionInfoResource, createConnectionParam, DatabaseConnection, IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialogDelete, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { resourceKeyList } from '@cloudbeaver/core-sdk';
import { isArraysEqual, isDefined, isObjectsEqual } from '@cloudbeaver/core-utils';

@injectable()
export class ConnectionsAdministrationController {
  isProcessing = false;
  readonly selectedItems = observable<IConnectionInfoParams, boolean>(new Map());
  readonly expandedItems = observable<IConnectionInfoParams, boolean>(new Map());

  get keys(): IConnectionInfoParams[] {
    return this.connections.map(createConnectionParam);
  }

  get connections(): DatabaseConnection[] {
    return this.connectionInfoResource
      .get(ConnectionInfoActiveProjectKey)
      .filter<Connection>(isDefined)
      .sort((connectionA, connectionB) => compareNewConnectionsInfo(
        connectionA,
        connectionB
      ));
  }

  get itemsSelected(): boolean {
    return Array.from(this.selectedItems.values()).some(v => v);
  }

  constructor(
    private readonly notificationService: NotificationService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly localizationService: LocalizationService
  ) {
    makeObservable(this, {
      isProcessing: observable,
      connections: computed<DatabaseConnection[]>({ equals: (a, b) => isArraysEqual(a, b) }),
      keys: computed<IConnectionInfoParams[]>({ equals: (a, b) => isArraysEqual(a, b, isObjectsEqual) }),
      itemsSelected: computed,
    });
  }

  update = async (): Promise<void> => {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    try {
      await this.connectionInfoResource.refresh(ConnectionInfoActiveProjectKey);
      this.connectionInfoResource.cleanNewFlags();
      this.notificationService.logSuccess({ title: 'connections_administration_tools_refresh_success' });
    } catch (exception: any) {
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

    const connectionNames = deletionList.map(id => this.connectionInfoResource.get(id)?.name).filter(Boolean);
    const nameList = connectionNames.map(name => `"${name}"`).join(', ');
    const message = `${this.localizationService.translate('connections_administration_delete_confirmation')}${nameList}. ${this.localizationService.translate('ui_are_you_sure')}`;

    const result = await this.commonDialogService.open(ConfirmationDialogDelete, {
      title: 'ui_data_delete_confirmation',
      message,
      confirmActionText: 'ui_delete',
    });

    if (result === DialogueStateResult.Rejected) {
      return;
    }

    this.isProcessing = true;

    try {
      await this.connectionInfoResource.deleteConnection(resourceKeyList(deletionList));
      this.selectedItems.clear();

      for (const id of deletionList) {
        this.expandedItems.delete(id);
      }
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Connections delete failed');
    } finally {
      this.isProcessing = false;
    }
  };
}

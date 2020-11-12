/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed } from 'mobx';

import { AdminUser, AuthProvidersResource, UsersResource } from '@cloudbeaver/core-authentication';
import { injectable, IInitializableController } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLErrorCatcher, resourceKeyList } from '@cloudbeaver/core-sdk';

@injectable()
export class UsersAdministrationController implements IInitializableController {
  @observable isDeleting = false;
  readonly selectedItems = observable<string, boolean>(new Map());
  readonly expandedItems = observable<string, boolean>(new Map());
  readonly error = new GQLErrorCatcher();

  @computed get users(): AdminUser[] {
    return Array.from(this.usersResource.data.values())
      .sort((a, b) => {
        if (this.usersResource.isNew(a.userId) === this.usersResource.isNew(b.userId)) {
          return a.userId.localeCompare(b.userId);
        }
        if (this.usersResource.isNew(a.userId)) {
          return -1;
        }
        return 1;
      });
  }

  get isProvidersLoading(): boolean {
    return this.authProvidersResource.isLoading();
  }

  get isLocalProviderAvailable(): boolean {
    return this.authProvidersResource.data.some(({ id }) => id === 'local');
  }

  get isLoading(): boolean {
    return this.usersResource.isLoading() || this.isDeleting;
  }

  @computed get itemsSelected(): boolean {
    return Array.from(this.selectedItems.values()).some(v => v);
  }

  constructor(
    private notificationService: NotificationService,
    private authProvidersResource: AuthProvidersResource,
    private usersResource: UsersResource,
    private commonDialogService: CommonDialogService,
  ) { }

  init(): void{
    this.authProvidersResource.load();
  }

  update = async () => {
    try {
      await this.usersResource.refreshAll();
    } catch (exception) {
      if (!this.error.catch(exception)) {
        this.notificationService.logException(exception, 'Users update failed');
      }
    }
  };

  delete = async () => {
    if (this.isDeleting) {
      return;
    }

    const deletionList = Array
      .from(this.selectedItems)
      .filter(([_, value]) => value)
      .map(([userId]) => userId);
    if (deletionList.length === 0) {
      return;
    }

    const result = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'ui_data_delete_confirmation',
      message: `You're going to delete these users: ${deletionList.map(name => `"${name}"`).join(', ')}. Are you sure?`,
      confirmActionText: 'ui_delete',
    });

    if (result === DialogueStateResult.Rejected) {
      return;
    }

    this.isDeleting = true;

    try {
      await this.usersResource.delete(resourceKeyList(deletionList));
      this.selectedItems.clear();

      for (const id of deletionList) {
        this.expandedItems.delete(id);
      }
    } catch (exception) {
      if (!this.error.catch(exception)) {
        this.notificationService.logException(exception, 'User delete failed');
      }
    } finally {
      this.isDeleting = false;
    }
  };

  showDetails = () => {
    if (this.error.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.error.exception);
    }
  };
}

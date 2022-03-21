/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed, makeObservable } from 'mobx';

import { AdminUser, AuthProvidersResource, AUTH_PROVIDER_LOCAL_ID, UsersResource } from '@cloudbeaver/core-authentication';
import { injectable, IInitializableController } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialogDelete, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLErrorCatcher, resourceKeyList } from '@cloudbeaver/core-sdk';

@injectable()
export class MetaParametersController
implements IInitializableController {
  isDeleting = false;
  readonly selectedItems = observable<string, boolean>(new Map());
  readonly expandedItems = observable<string, boolean>(new Map());
  readonly error = new GQLErrorCatcher();

  get users(): AdminUser[] {
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
    return this.authProvidersResource.has(AUTH_PROVIDER_LOCAL_ID);
  }

  get isLoading(): boolean {
    return this.usersResource.isLoading() || this.isDeleting;
  }

  get itemsSelected(): boolean {
    return Array.from(this.selectedItems.values()).some(v => v);
  }

  constructor(
    private notificationService: NotificationService,
    private authProvidersResource: AuthProvidersResource,
    private usersResource: UsersResource,
    private commonDialogService: CommonDialogService,
    private localizationService: LocalizationService
  ) {
    makeObservable(this, {
      isDeleting: observable,
      users: computed,
      itemsSelected: computed,
    });
  }

  init(): void {
    this.authProvidersResource.loadAll();
  }

  update = async () => {
    try {
      await this.usersResource.refreshAll();
      this.notificationService.logSuccess({ title: 'authentication_administration_tools_refresh_success' });
    } catch (exception: any) {
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

    const userNames = deletionList.map(name => `"${name}"`).join(', ');
    const message = `${this.localizationService.translate('authentication_administration_users_delete_confirmation')}${userNames}. ${this.localizationService.translate('ui_are_you_sure')}`;

    const result = await this.commonDialogService.open(ConfirmationDialogDelete, {
      title: 'ui_data_delete_confirmation',
      message,
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
    } catch (exception: any) {
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

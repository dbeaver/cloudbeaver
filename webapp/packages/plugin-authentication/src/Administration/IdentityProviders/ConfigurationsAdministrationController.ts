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
import { AdminAuthProviderConfiguration, resourceKeyList } from '@cloudbeaver/core-sdk';

import { AuthProviderConfigurationsResource, compareConfigurations } from './AuthProviderConfigurationsResource';

@injectable()
export class ConfigurationsAdministrationController {
  isProcessing = false;
  readonly selectedItems = observable<string, boolean>(new Map());
  readonly expandedItems = observable<string, boolean>(new Map());
  get configurations(): AdminAuthProviderConfiguration[] {
    return this.authProviderConfigurationsResource.values.slice().sort(compareConfigurations);
  }

  get itemsSelected(): boolean {
    return Array.from(this.selectedItems.values()).some(v => v);
  }

  constructor(
    private notificationService: NotificationService,
    private authProviderConfigurationsResource: AuthProviderConfigurationsResource,
    private commonDialogService: CommonDialogService
  ) {
    makeObservable(this, {
      isProcessing: observable,
      configurations: computed,
      itemsSelected: computed,
    });
  }

  update = async (): Promise<void> => {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      await this.authProviderConfigurationsResource.refreshAll();
      this.notificationService.logSuccess({ title: 'administration_identity_providers_configuration_list_update_success' });
    } catch (exception) {
      this.notificationService.logException(exception, 'administration_identity_providers_configuration_list_update_fail');
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
      .map(([configurationId]) => configurationId);

    if (deletionList.length === 0) {
      return;
    }

    const configurationsNames = deletionList
      .map(id => this.authProviderConfigurationsResource.get(id)?.displayName)
      .filter(Boolean);

    const result = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'ui_data_delete_confirmation',
      message: `You're going to delete these configurations: ${configurationsNames.map(name => `"${name}"`).join(', ')}. Are you sure?`,
      confirmActionText: 'ui_delete',
    });

    if (result === DialogueStateResult.Rejected) {
      return;
    }

    this.isProcessing = true;

    try {
      await this.authProviderConfigurationsResource.deleteConfiguration(resourceKeyList(deletionList));

      this.selectedItems.clear();

      for (const id of deletionList) {
        this.expandedItems.delete(id);
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Configurations delete failed');
    } finally {
      this.isProcessing = false;
    }
  };
}

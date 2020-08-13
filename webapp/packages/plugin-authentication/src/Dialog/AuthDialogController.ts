/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed } from 'mobx';

import { AuthInfoService, AuthProvidersResource, AuthProvider } from '@cloudbeaver/core-authentication';
import { injectable, IInitializableController, IDestructibleController } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLErrorCatcher } from '@cloudbeaver/core-sdk';

@injectable()
export class AuthDialogController implements IInitializableController, IDestructibleController {
  @observable provider: AuthProvider | null = null
  @observable isAuthenticating = false;
  @observable credentials = {};

  get isLoading() {
    return this.authProvidersResource.isLoading();
  }

  @computed get providers(): AuthProvider[] {
    return this.authProvidersResource
      .data
      .concat()
      .sort(this.compareProviders);
  }

  readonly error = new GQLErrorCatcher();
  private isDistructed = false;
  private close!: () => void;

  constructor(
    private notificationService: NotificationService,
    private authProvidersResource: AuthProvidersResource,
    private authInfoService: AuthInfoService,
    private commonDialogService: CommonDialogService,
  ) { }

  init(onClose: () => void) {
    this.close = onClose;
    this.loadProviders();
  }

  destruct(): void {
    this.isDistructed = true;
  }

  login = async () => {
    if (!this.provider || this.isAuthenticating) {
      return;
    }

    this.isAuthenticating = true;
    try {
      await this.authInfoService.login(this.provider.id, this.credentials);
      this.close();
    } catch (exception) {
      if (!this.error.catch(exception) || this.isDistructed) {
        this.notificationService.logException(exception, 'Login failed');
      }
    } finally {
      this.isAuthenticating = false;
    }
  }

  selectProvider = (providerId: string) => {
    if (providerId === this.provider?.id) {
      return;
    }
    this.provider = this.authProvidersResource
      .data.find(provider => provider.id === providerId) || null;
    this.credentials = {};
  }

  showDetails = () => {
    if (this.error.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.error.exception);
    }
  }

  private async loadProviders() {
    try {
      await this.authProvidersResource.load(null);
      if (this.providers.length > 0) {
        this.provider = this.providers[0];
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load auth providers');
    }
  }

  private compareProviders = (providerA: AuthProvider, providerB: AuthProvider): number => {
    if (providerA.defaultProvider === providerB.defaultProvider)
    {
      return providerA.label.localeCompare(providerB.label);
    }

    if (providerA.defaultProvider) {
      return -1;
    }
    return 1;
  }
}

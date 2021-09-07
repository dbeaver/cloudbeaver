/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed, makeObservable } from 'mobx';

import { AuthInfoService, AuthProvidersResource, AuthProvider } from '@cloudbeaver/core-authentication';
import { injectable, IInitializableController, IDestructibleController } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLErrorCatcher } from '@cloudbeaver/core-sdk';

@injectable()
export class AuthDialogController implements IInitializableController, IDestructibleController {
  provider: AuthProvider | null = null;
  isAuthenticating = false;
  credentials = {};

  get isLoading(): boolean {
    return this.authProvidersResource.isLoading();
  }

  get providers(): AuthProvider[] {
    const providers = this.authProvidersResource.getEnabledProviders();
    const primaryId = this.authProvidersResource.getPrimary();

    if (this.admin && !this.authProvidersResource.isAuthEnabled(primaryId)) {
      const primary = this.authProvidersResource.get(primaryId);

      if (primary) {
        providers.push(primary);
      }
    }

    return providers
      .filter(Boolean)
      .sort(compareProviders);
  }

  readonly error = new GQLErrorCatcher();
  private isDestructed = false;
  private link!: boolean;
  private admin: boolean;
  private close!: () => void;

  constructor(
    private notificationService: NotificationService,
    private authProvidersResource: AuthProvidersResource,
    private authInfoService: AuthInfoService,
    private commonDialogService: CommonDialogService
  ) {
    makeObservable<AuthDialogController, 'admin'>(this, {
      provider: observable,
      isAuthenticating: observable,
      credentials: observable,
      admin: observable,
      providers: computed,
    });

    this.admin = false;
  }

  init(link: boolean, onClose: () => void): void {
    this.link = link;
    this.close = onClose;
    this.loadProviders();
  }

  setAdminMode(mode: boolean): void {
    if (this.admin !== mode) {
      this.admin = mode;

      this.selectFirstAvailable();
    }
  }

  destruct(): void {
    this.isDestructed = true;
  }

  login = async (): Promise<void> => {
    if (!this.provider || this.isAuthenticating) {
      return;
    }

    this.isAuthenticating = true;
    try {
      await this.authInfoService.login(this.provider.id, this.credentials, this.link);
      this.close();
    } catch (exception) {
      if (!this.error.catch(exception) || this.isDestructed) {
        this.notificationService.logException(exception, 'Login failed');
      }
    } finally {
      this.isAuthenticating = false;
    }
  };

  selectProvider = (providerId: string): void => {
    if (providerId === this.provider?.id) {
      return;
    }
    this.provider = this.authProvidersResource.get(providerId) || null;
    this.credentials = {};
  };

  showDetails = (): void => {
    if (this.error.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.error.exception);
    }
  };

  private async loadProviders() {
    try {
      await this.authProvidersResource.loadAll();

      this.selectFirstAvailable();
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load auth providers');
    }
  }

  private selectFirstAvailable(): void {
    if (this.providers.length > 0) {
      this.provider = this.providers.find(provider => provider.defaultProvider) ?? this.providers[0];
    }
  }
}

function compareProviders(providerA: AuthProvider, providerB: AuthProvider): number {
  if (providerA.defaultProvider === providerB.defaultProvider) {
    return providerA.label.localeCompare(providerB.label);
  }

  if (providerA.defaultProvider) {
    return -1;
  }
  return 1;
}

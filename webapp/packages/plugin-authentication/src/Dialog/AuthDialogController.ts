/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed, makeObservable } from 'mobx';

import { AuthInfoService, AuthProvidersResource, AuthProvider, IAuthCredentials } from '@cloudbeaver/core-authentication';
import { injectable, IInitializableController, IDestructibleController } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLErrorCatcher } from '@cloudbeaver/core-sdk';

@injectable()
export class AuthDialogController implements IInitializableController, IDestructibleController {
  selectedProvider: AuthProvider | null = null;
  isAuthenticating = false;
  readonly credentials: IAuthCredentials;

  get provider(): AuthProvider | null {
    return (
      this.selectedProvider
      || (
        this.providers.length > 0
          ? this.providers[0]
          : null
      )
    );
  }

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

    if (this.defaultProviderId !== null && !this.authProvidersResource.isAuthEnabled(this.defaultProviderId)) {
      const primary = this.authProvidersResource.get(this.defaultProviderId);

      if (primary) {
        providers.push(primary);
      }
    }

    return providers
      .filter(provider => (
        provider && (
          provider.configurable
            ? !!provider.configurations?.length
            : (this.defaultProviderId === null || provider.id === this.defaultProviderId)
        )
      ))
      .sort(compareProviders);
  }

  readonly error = new GQLErrorCatcher();
  private isDestructed = false;
  private link!: boolean;
  private admin: boolean;
  private close!: () => void;
  private defaultProviderId!: string | null;

  constructor(
    private notificationService: NotificationService,
    private authProvidersResource: AuthProvidersResource,
    private authInfoService: AuthInfoService,
    private commonDialogService: CommonDialogService
  ) {
    this.admin = false;
    this.credentials = {
      profile: '0',
      credentials: {},
    };

    makeObservable<this, 'admin' | 'defaultProviderId' | 'selectedProvider'>(this, {
      selectedProvider: observable.ref,
      provider: computed,
      isAuthenticating: observable.ref,
      credentials: observable,
      admin: observable.ref,
      defaultProviderId: observable.ref,
      providers: computed,
    });
  }

  init(link: boolean, providerId: string | null, onClose: () => void): void {
    this.link = link;
    this.defaultProviderId = providerId;
    this.close = onClose;
    this.loadProviders();
  }

  setAdminMode(mode: boolean, providerId: string | null): void {
    if (this.admin !== mode) {
      this.admin = mode;

      if (!providerId) {
        this.selectFirstAvailable();
      }
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
    if (providerId === this.selectedProvider?.id) {
      return;
    }
    this.selectedProvider = this.authProvidersResource.get(providerId) || null;
    this.credentials.profile = '0';
    this.credentials.credentials = {};
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
      this.selectedProvider = this.providers.find(provider => (
        this.defaultProviderId !== null
          ? provider.id === this.defaultProviderId
          : provider.defaultProvider
      )) ?? this.providers[0];
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

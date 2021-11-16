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

import { CONFIGURABLE_PROVIDERS_ID } from '../CONFIGURABLE_PROVIDERS_ID';

@injectable()
export class AuthDialogController implements IInitializableController, IDestructibleController {
  selectedTab: string | null = null;

  isAuthenticating = false;
  credentials = {};

  get provider(): AuthProvider | null {
    if (!this.selectedTab) {
      return null;
    }

    return this.authProvidersResource.get(this.selectedTab) || null;
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
    makeObservable<this, 'admin' | 'defaultProviderId'>(this, {
      selectedTab: observable.ref,
      provider: computed,
      isAuthenticating: observable.ref,
      credentials: observable,
      admin: observable.ref,
      defaultProviderId: observable.ref,
      providers: computed,
    });

    this.admin = false;
  }

  init(link: boolean, providerId: string | null, onClose: () => void): void {
    this.link = link;
    this.defaultProviderId = providerId;
    this.selectedTab = this.defaultProviderId;
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

  handleTabChange(tabId: string): void {
    if (this.selectedTab === tabId) {
      return;
    }

    this.selectedTab = tabId;
    this.credentials = {};
  }

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
    if (!this.providers.length) {
      return;
    }

    const firstDefault = this.providers.find(p => p.id === this.defaultProviderId || p.defaultProvider);
    const provider = firstDefault || this.providers[0];

    this.selectedTab = provider.configurable ? CONFIGURABLE_PROVIDERS_ID : provider.id;
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

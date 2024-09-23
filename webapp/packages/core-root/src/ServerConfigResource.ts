/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, type ServerConfigFragment, type ServerConfigInput } from '@cloudbeaver/core-sdk';
import { isArraysEqual } from '@cloudbeaver/core-utils';

import { DataSynchronizationQueue } from './DataSynchronization/DataSynchronizationQueue.js';
import { DataSynchronizationService } from './DataSynchronization/DataSynchronizationService.js';
import { ServerConfigEventHandler } from './ServerConfigEventHandler.js';

export const FEATURE_GIT_ID = 'git';

export type ServerConfig = ServerConfigFragment;

@injectable()
export class ServerConfigResource extends CachedDataResource<ServerConfig | null> {
  update: ServerConfigInput;

  private readonly syncQueue: DataSynchronizationQueue;

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly dataSynchronizationService: DataSynchronizationService,
    serverConfigEventHandler: ServerConfigEventHandler,
  ) {
    super(() => null, undefined, []);

    this.syncQueue = new DataSynchronizationQueue(state => {
      if (state) {
        this.markOutdated();
      }
    });
    this.update = {};

    makeObservable<this, 'syncUpdateData'>(this, {
      update: observable,
      unlinkUpdate: action,
      syncUpdateData: action,
    });

    serverConfigEventHandler.on(
      () => {
        this.syncQueue.add(this.dataSynchronizationService.requestSynchronization('server-config', 'Server Configuration'));
      },
      () => undefined,
      undefined,
      this,
    );
  }

  get redirectOnFederatedAuth(): boolean {
    return this.data?.redirectOnFederatedAuth ?? false;
  }

  get serverVersion(): string {
    return this.data?.version || '';
  }

  get workspaceId(): string {
    return this.data?.workspaceId || '';
  }

  get distributed(): boolean {
    return this.data?.distributed || false;
  }

  get configurationMode(): boolean {
    return !!this.data?.configurationMode;
  }

  get adminCredentialsSaveEnabled(): boolean {
    return this.data?.adminCredentialsSaveEnabled ?? false;
  }

  get publicCredentialsSaveEnabled(): boolean {
    return this.data?.publicCredentialsSaveEnabled ?? false;
  }

  get anonymousAccessEnabled(): boolean {
    return this.data?.anonymousAccessEnabled ?? false;
  }

  get enabledFeatures(): string[] {
    return this.update.enabledFeatures || this.data?.enabledFeatures || [];
  }

  get enabledAuthProviders(): string[] {
    return this.update.enabledAuthProviders || this.data?.enabledAuthProviders || [];
  }

  get disabledDrivers(): string[] {
    return this.update.disabledDrivers || this.data?.disabledDrivers || [];
  }

  get credentialsSaveEnabled(): boolean {
    return this.update.adminCredentialsSaveEnabled ?? this.data?.adminCredentialsSaveEnabled ?? false;
  }

  get userCredentialsSaveEnabled(): boolean {
    return this.update.publicCredentialsSaveEnabled ?? this.data?.publicCredentialsSaveEnabled ?? false;
  }

  get resourceManagerEnabled() {
    return this.update.resourceManagerEnabled ?? this.data?.resourceManagerEnabled ?? false;
  }

  isBetaFeatureDisabled(feature: string): boolean {
    return this.data?.disabledBetaFeatures?.includes(feature) || false;
  }

  isFeatureEnabled(feature: string, serverSide = false): boolean {
    if (serverSide) {
      return this.data?.enabledFeatures.includes(feature) || false;
    }
    return this.enabledFeatures.includes(feature);
  }

  isChanged(): boolean {
    if (!this.data || Object.keys(this.update).length === 0) {
      return false;
    }

    if (this.update.adminName || this.update.adminPassword) {
      return true;
    }

    return (
      this.update.serverName !== this.data.name ||
      this.update.serverURL !== this.data.serverURL ||
      this.update.sessionExpireTime !== this.data.sessionExpireTime ||
      this.update.anonymousAccessEnabled !== this.data.anonymousAccessEnabled ||
      this.update.resourceManagerEnabled !== this.data.resourceManagerEnabled ||
      this.update.adminCredentialsSaveEnabled !== this.data.adminCredentialsSaveEnabled ||
      this.update.publicCredentialsSaveEnabled !== this.data.publicCredentialsSaveEnabled ||
      this.update.customConnectionsEnabled !== this.data.supportsCustomConnections ||
      !isArraysEqual(this.update.enabledAuthProviders || [], this.data.enabledAuthProviders) ||
      !isArraysEqual(this.update.enabledFeatures || [], this.data.enabledFeatures) ||
      !isArraysEqual(this.update.disabledDrivers || [], this.data.disabledDrivers)
    );
  }

  setDataUpdate(update: ServerConfigInput): void {
    this.update = update;
  }

  resetUpdate(): void {
    if (this.data) {
      this.syncUpdateData(this.data);
    }
  }

  unlinkUpdate(): void {
    this.update = {};
  }

  async updateProductConfiguration(configuration: any) {
    await this.performUpdate(undefined, undefined, async () => {
      await this.graphQLService.sdk.updateProductConfiguration({ configuration });
      this.setData(await this.loader());
      this.onDataOutdated.execute();
    });
  }

  async save(): Promise<void> {
    await this.performUpdate(
      undefined,
      undefined,
      async () => {
        await this.graphQLService.sdk.configureServer({
          configuration: this.update,
        });
        this.setData(await this.loader());
        this.onDataOutdated.execute();
      },
      () => !this.isChanged(),
    );
  }

  async finishConfiguration(onlyRestart = false): Promise<void> {
    await this.performUpdate(
      undefined,
      undefined,
      async () => {
        await this.graphQLService.sdk.configureServer({
          configuration: !this.isChanged() && onlyRestart ? {} : this.update,
        });

        this.setData(await this.loader());
        this.onDataOutdated.execute();
      },
      () => !this.isChanged() && !onlyRestart,
    );
  }

  protected async loader(): Promise<ServerConfig> {
    const { serverConfig } = await this.graphQLService.sdk.serverConfig();

    this.syncUpdateData(serverConfig);

    return serverConfig;
  }

  private syncUpdateData(serverConfig: ServerConfig) {
    if (serverConfig.configurationMode) {
      return;
    }

    this.update.serverName = serverConfig.name;
    this.update.serverURL = serverConfig.serverURL;
    this.update.sessionExpireTime = serverConfig.sessionExpireTime;

    this.update.adminName = undefined;
    this.update.adminPassword = undefined;

    this.update.anonymousAccessEnabled = serverConfig.anonymousAccessEnabled;

    this.update.adminCredentialsSaveEnabled = serverConfig.adminCredentialsSaveEnabled;
    this.update.publicCredentialsSaveEnabled = serverConfig.publicCredentialsSaveEnabled;

    this.update.resourceManagerEnabled = serverConfig.resourceManagerEnabled;

    this.update.customConnectionsEnabled = serverConfig.supportsCustomConnections;
    this.update.enabledAuthProviders = [...serverConfig.enabledAuthProviders];
    this.update.enabledFeatures = [...serverConfig.enabledFeatures];
    this.update.disabledDrivers = [...serverConfig.disabledDrivers];
  }
}

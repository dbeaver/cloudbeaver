/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, type ServerConfigFragment, type ServerConfigInput } from '@cloudbeaver/core-sdk';

import { DataSynchronizationQueue } from './DataSynchronization/DataSynchronizationQueue.js';
import { DataSynchronizationService } from './DataSynchronization/DataSynchronizationService.js';
import { ServerConfigEventHandler } from './ServerConfigEventHandler.js';

export const FEATURE_GIT_ID = 'git';

export type ServerConfig = ServerConfigFragment;

@injectable()
export class ServerConfigResource extends CachedDataResource<ServerConfig | null> {
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
    return this.data?.enabledFeatures || [];
  }

  get enabledAuthProviders(): string[] {
    return this.data?.enabledAuthProviders || [];
  }

  get disabledDrivers(): string[] {
    return this.data?.disabledDrivers || [];
  }

  get credentialsSaveEnabled(): boolean {
    return this.data?.adminCredentialsSaveEnabled ?? false;
  }

  get userCredentialsSaveEnabled(): boolean {
    return this.data?.publicCredentialsSaveEnabled ?? false;
  }

  get resourceManagerEnabled() {
    return this.data?.resourceManagerEnabled ?? false;
  }

  get secretManagerEnabled() {
    return this.data?.secretManagerEnabled ?? false;
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

  async updateProductConfiguration(configuration: any) {
    await this.performUpdate(undefined, undefined, async () => {
      await this.graphQLService.sdk.updateProductConfiguration({ configuration });
      this.setData(await this.loader());
      this.onDataOutdated.execute();
    });
  }

  async save(configuration: ServerConfigInput): Promise<void> {
    await this.performUpdate(undefined, undefined, async () => {
      await this.graphQLService.sdk.configureServer({
        configuration,
      });

      this.setData(await this.loader());
      this.onDataOutdated.execute();
    });
  }

  protected async loader(): Promise<ServerConfig> {
    const { serverConfig } = await this.graphQLService.sdk.serverConfig();
    return serverConfig;
  }
}

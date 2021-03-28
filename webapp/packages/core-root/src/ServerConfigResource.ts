/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, CachedDataResource, ServerConfig, ServerConfigInput } from '@cloudbeaver/core-sdk';

@injectable()
export class ServerConfigResource extends CachedDataResource<ServerConfig | null, void> {
  update: ServerConfigInput;

  constructor(
    private graphQLService: GraphQLService
  ) {
    super(null);
    makeObservable(this, {
      update: observable,
    });

    this.update = {};
  }

  get serverVersion(): string {
    return this.data?.version || '';
  }

  get workspaceId(): string {
    return this.data?.workspaceId || '';
  }

  get configurationMode(): boolean {
    return !!this.data?.configurationMode;
  }

  get publicDisabled(): boolean {
    if (this.data?.configurationMode
    || (this.data?.licenseRequired && !this.data?.licenseValid)) {
      return true;
    }

    return false;
  }

  get enabledAuthProviders(): string[] {
    return this.update.enabledAuthProviders || this.data?.enabledAuthProviders || [];
  }

  get credentialsSaveEnabled(): boolean {
    return this.update.adminCredentialsSaveEnabled ?? this.data?.adminCredentialsSaveEnabled ?? false;
  }

  get userCredentialsSaveEnabled(): boolean {
    return this.update.publicCredentialsSaveEnabled ?? this.data?.publicCredentialsSaveEnabled ?? false;
  }

  setDataUpdate(update: ServerConfigInput): void {
    this.update = update;
  }

  async save(): Promise<void> {
    await this.performUpdate(undefined, undefined, async () => {
      await this.graphQLService.sdk.configureServer({
        configuration: this.update,
      });

      this.data = await this.loader();
    });
  }

  protected async loader(): Promise<ServerConfig> {
    const { serverConfig } = await this.graphQLService.sdk.serverConfig();

    this.update.serverName = serverConfig.name;
    this.update.sessionExpireTime = serverConfig.sessionExpireTime;

    this.update.adminName = undefined;
    this.update.adminPassword = undefined;

    this.update.anonymousAccessEnabled = serverConfig.anonymousAccessEnabled;
    this.update.authenticationEnabled = serverConfig.authenticationEnabled;

    this.update.adminCredentialsSaveEnabled = serverConfig.adminCredentialsSaveEnabled;
    this.update.publicCredentialsSaveEnabled = serverConfig.publicCredentialsSaveEnabled;

    this.update.customConnectionsEnabled = serverConfig.supportsCustomConnections;
    this.update.enabledAuthProviders = serverConfig.enabledAuthProviders;

    return serverConfig as ServerConfig;
  }
}

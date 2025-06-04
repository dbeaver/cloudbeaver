/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import {
  type ConnectionInfoAuthProperties,
  ConnectionInfoAuthPropertiesResource,
  ConnectionInfoNetworkHandlersResource,
  ConnectionInfoResource,
  type ConnectionInitConfig,
  type DBDriver,
  DBDriverResource,
  type IConnectionInfoParams,
  USER_NAME_PROPERTY_ID,
} from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NetworkHandlerAuthType } from '@cloudbeaver/core-sdk';
import type { ILoadableState } from '@cloudbeaver/core-utils';

import type { IConnectionAuthenticationConfig } from '../../ConnectionAuthentication/IConnectionAuthenticationConfig.js';

interface IState extends ILoadableState {
  readonly authModelId: string | null;
  driver: DBDriver | null;
  connectionAuthProperties: ConnectionInfoAuthProperties | null;
  config: IConnectionAuthenticationConfig;
  authenticating: boolean;
  loading: boolean;
  loaded: boolean;
  exception: Error | null;
  authException: Error | null;
  load: () => Promise<void>;
  login: () => Promise<void>;
  getConfig: () => ConnectionInitConfig;
}

export function useDatabaseCredentialsAuthDialog(
  key: IConnectionInfoParams,
  networkHandlers: string[],
  resetCredentials?: boolean,
  onInit?: () => void,
) {
  const connectionInfoResource = useService(ConnectionInfoResource);
  const dbDriverResource = useService(DBDriverResource);
  const connectionInfoAuthPropertiesResource = useService(ConnectionInfoAuthPropertiesResource);
  const connectionInfoNetworkHandlersLoader = useService(ConnectionInfoNetworkHandlersResource);

  const state: IState = useObservableRef(
    () => ({
      get authModelId() {
        if (!this.connectionAuthProperties?.authNeeded && !this.resetCredentials) {
          return null;
        }

        return this.connectionAuthProperties?.authModel || this.driver?.defaultAuthModel || null;
      },
      connectionAuthProperties: null as ConnectionInfoAuthProperties | null,
      driver: null as DBDriver | null,
      authenticating: false,
      loading: false,
      loaded: false,
      exception: null,
      authException: null,
      config: {
        credentials: {},
        networkHandlersConfig: [],
        saveCredentials: false,
      } as IConnectionAuthenticationConfig,
      async load() {
        if (this.loaded || this.loading) {
          return;
        }

        try {
          this.exception = null;
          this.loading = true;

          const [connectionAuthProperties, connection, connectionNetworkHandlersConfig] = await Promise.all([
            this.connectionInfoAuthPropertiesResource.load(this.key),
            this.connectionInfoResource.load(this.key),
            this.connectionInfoNetworkHandlersLoader.load(this.key),
          ]);

          const driver = await this.dbDriverResource.load(connection.driverId);

          if (connectionAuthProperties.authNeeded) {
            const property = connectionAuthProperties?.authProperties.find(property => property.id === USER_NAME_PROPERTY_ID);

            if (property?.value) {
              this.config.credentials[USER_NAME_PROPERTY_ID] = property.value;
            }
          }

          for (const id of this.networkHandlers) {
            const handler = connectionNetworkHandlersConfig.networkHandlersConfig?.find(handler => handler.id === id);

            if (handler && (handler.userName || handler.authType !== NetworkHandlerAuthType.Password)) {
              this.config.networkHandlersConfig.push({
                id: handler.id,
                authType: handler.authType,
                userName: handler.userName,
                password: handler.password,
                savePassword: handler.savePassword,
              });
            }
          }

          this.config.saveCredentials = connectionAuthProperties.saveCredentials;
          this.connectionAuthProperties = connectionAuthProperties;
          this.driver = driver;

          this.loaded = true;
        } catch (exception: any) {
          this.exception = exception;
        } finally {
          this.loading = false;
        }
      },
      async login() {
        if (this.authenticating) {
          return;
        }

        try {
          this.authException = null;
          this.authenticating = true;
          await this.connectionInfoResource.init(this.getConfig());
          this.onInit?.();
        } catch (exception: any) {
          this.authException = exception;
        } finally {
          this.authenticating = false;
        }
      },
      getConfig() {
        const config: ConnectionInitConfig = {
          projectId: this.key.projectId,
          connectionId: this.key.connectionId,
        };

        if (this.authModelId) {
          if (Object.keys(this.config.credentials).length > 0) {
            config.credentials = this.config.credentials;
          }

          config.saveCredentials = this.config.saveCredentials;
        }

        if (this.config.networkHandlersConfig.length > 0) {
          config.networkCredentials = this.config.networkHandlersConfig;
        }

        return config;
      },
      isLoading() {
        return this.loading;
      },
      isLoaded() {
        return this.loaded;
      },
      isError() {
        return !!this.exception;
      },
    }),
    {
      authModelId: computed,
      config: observable,
      connectionAuthProperties: observable.ref,
      driver: observable.ref,
      authenticating: observable.ref,
      loading: observable.ref,
      loaded: observable.ref,
      exception: observable.ref,
      authException: observable.ref,
      load: action.bound,
      login: action.bound,
    },
    {
      connectionInfoResource,
      dbDriverResource,
      key,
      networkHandlers,
      resetCredentials,
      connectionInfoAuthPropertiesResource,
      connectionInfoNetworkHandlersLoader,
      onInit,
    },
  );

  return state;
}

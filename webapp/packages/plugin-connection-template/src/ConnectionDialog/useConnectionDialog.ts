/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { AuthProviderService } from '@cloudbeaver/core-authentication';
import { useObservableRef } from '@cloudbeaver/core-blocks';
import {
  type Connection,
  ConnectionInfoProjectKey,
  ConnectionInfoResource,
  type ConnectionInitConfig,
  createConnectionParam,
  type DBDriver,
  DBDriverResource,
  USER_NAME_PROPERTY_ID,
} from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { NetworkHandlerAuthType } from '@cloudbeaver/core-sdk';
import { getUniqueName } from '@cloudbeaver/core-utils';
import type { IConnectionAuthenticationConfig } from '@cloudbeaver/plugin-connections';

import { TemplateConnectionsService } from '../TemplateConnectionsService.js';
import { ConnectionStep } from './EConnectionStep.js';

interface IState {
  readonly networkHandlers: string[];
  readonly authModelId: string | null;
  step: ConnectionStep;
  driver: DBDriver | null;
  template: Connection | null;
  config: IConnectionAuthenticationConfig;
  processing: boolean;
  connectException: Error | null;
  connect: () => Promise<void>;
  setStep: (step: ConnectionStep) => void;
  getConfig: (projectId: string, connectionId: string) => ConnectionInitConfig;
  selectTemplate: (templateId: string) => Promise<void>;
}

function getDefaultConfig(): IConnectionAuthenticationConfig {
  return {
    credentials: {},
    networkHandlersConfig: [],
    saveCredentials: false,
  };
}

export function useConnectionDialog(onConnect?: () => void) {
  const notificationService = useService(NotificationService);
  const connectionInfoResource = useService(ConnectionInfoResource);
  const templateConnectionsService = useService(TemplateConnectionsService);
  const projectsService = useService(ProjectsService);
  const authProviderService = useService(AuthProviderService);
  const dbDriverResource = useService(DBDriverResource);

  const state: IState = useObservableRef(
    () => ({
      get networkHandlers() {
        return this.template?.networkHandlersConfig?.filter(handler => handler.enabled && !handler.savePassword).map(handler => handler.id) || [];
      },
      get authModelId() {
        if (this.template?.authNeeded === false || this.driver?.anonymousAccess === true) {
          return null;
        }

        return this.template?.authModel || this.driver?.defaultAuthModel || null;
      },
      step: ConnectionStep.ConnectionTemplateSelect,
      template: null as Connection | null,
      driver: null as DBDriver | null,
      processing: false,
      connectException: null,
      config: getDefaultConfig(),
      async connect() {
        if (this.processing || !this.template || !this.projectsService.userProject) {
          return;
        }

        try {
          this.connectException = null;
          this.processing = true;

          const connections = await this.connectionInfoResource.load(ConnectionInfoProjectKey(this.projectsService.userProject.id));
          const connectionNames = connections.map(connection => connection.name);

          const uniqueConnectionName = getUniqueName(this.template.name || 'Template connection', connectionNames);
          const connection = await this.connectionInfoResource.createFromTemplate(this.template.projectId, this.template.id, uniqueConnectionName);

          if (connection.requiredAuth) {
            const state = await this.authProviderService.requireProvider(connection.requiredAuth);

            if (!state) {
              this.setStep(ConnectionStep.ConnectionTemplateSelect);
              await this.connectionInfoResource.deleteConnection(createConnectionParam(connection));
              return;
            }
          }

          try {
            await this.connectionInfoResource.init(this.getConfig(connection.projectId, connection.id));
            this.notificationService.logSuccess({ title: 'plugin_connection_template_connect_success', message: connection.name });
            this.onConnect?.();
          } catch (exception: any) {
            this.connectException = exception;
            await this.connectionInfoResource.deleteConnection(createConnectionParam(connection));
          }
        } catch (exception: any) {
          this.connectException = exception;
        } finally {
          this.processing = false;
        }
      },
      getConfig(projectId: string, connectionId: string) {
        const config: ConnectionInitConfig = {
          projectId,
          connectionId,
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
      async selectTemplate(templateId: string) {
        this.template = this.templateConnectionsService.projectTemplates.find(template => template.id === templateId)!;
        this.driver = await this.dbDriverResource.load(this.template.driverId);
        this.config = getDefaultConfig();

        if (this.template.authNeeded) {
          const property = this.template.authProperties?.find(property => property.id === USER_NAME_PROPERTY_ID);

          if (property?.value) {
            this.config.credentials[USER_NAME_PROPERTY_ID] = property.value;
          }
        }

        for (const id of this.networkHandlers) {
          const handler = this.template.networkHandlersConfig?.find(handler => handler.id === id);

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

        this.setStep(ConnectionStep.Connection);

        if (!this.authModelId) {
          this.connect();
        }
      },
      setStep(step: ConnectionStep) {
        this.step = step;
        this.connectException = null;

        if (step === ConnectionStep.ConnectionTemplateSelect) {
          this.template = null;
          this.driver = null;
        }
      },
    }),
    {
      step: observable.ref,
      config: observable,
      template: observable.ref,
      driver: observable.ref,
      processing: observable.ref,
      connectException: observable.ref,
      networkHandlers: computed,
      authModelId: computed,
      connect: action.bound,
      selectTemplate: action.bound,
      setStep: action.bound,
    },
    {
      templateConnectionsService,
      projectsService,
      notificationService,
      authProviderService,
      connectionInfoResource,
      dbDriverResource,
      onConnect,
    },
  );

  return state;
}

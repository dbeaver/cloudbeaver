/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { UsersResource } from '@cloudbeaver/core-authentication';
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { DEFAULT_NAVIGATOR_VIEW_SETTINGS } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { IExecutor, Executor, IExecutorHandler, ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import type { IServerConfigurationPageState } from './IServerConfigurationPageState';

export interface IConfigurationPlaceholderProps extends IServerConfigurationPageState {
  configurationWizard: boolean;
}

export interface IServerConfigSaveData {
  state: IServerConfigurationPageState;
  configurationWizard: boolean;
  finish: boolean;
}

export interface ILoadConfigData {
  state: IServerConfigurationPageState;
  reload: boolean;
}

@injectable()
export class ServerConfigurationService {
  state: IServerConfigurationPageState;
  loading: boolean;

  readonly loadConfigTask: IExecutor<ILoadConfigData>;
  readonly prepareConfigTask: IExecutor<IServerConfigSaveData>;
  readonly saveTask: IExecutor<IServerConfigSaveData>;
  readonly validationTask: IExecutor<IServerConfigSaveData>;
  readonly configurationContainer: PlaceholderContainer<IConfigurationPlaceholderProps>;
  readonly pluginsContainer: PlaceholderContainer;

  private done: boolean;

  constructor(
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly graphQLService: GraphQLService,
    private readonly notificationService: NotificationService,
    private readonly usersResource: UsersResource,
  ) {
    makeObservable<ServerConfigurationService, 'done'>(this, {
      state: observable,
      loading: observable,
      done: observable,
    });

    this.done = false;
    this.loading = true;
    this.state = serverConfigStateContext();
    this.loadConfigTask = new Executor();
    this.prepareConfigTask = new Executor();
    this.saveTask = new Executor();
    this.validationTask = new Executor();
    this.configurationContainer = new PlaceholderContainer();
    this.pluginsContainer = new PlaceholderContainer();

    this.loadConfigTask
      .next(this.validationTask, () => this.getSaveData(false))
      .addHandler(() => { this.loading = true; })
      .addHandler(this.loadServerConfig)
      .addPostHandler(() => { this.loading = false; });

    this.saveTask
      .before(this.validationTask)
      .before(this.prepareConfigTask)
      .addPostHandler(this.save);

    this.prepareConfigTask.addHandler(this.prepareConfig);

    this.validationTask
      .addHandler(this.validateForm)
      .addPostHandler(this.ensureValidation);
  }

  changed(): void {
    this.done = false;
  }

  async loadConfig(): Promise<void> {
    let reload = false;

    try {
      const config = await this.serverConfigResource.load();
      this.state = this.administrationScreenService.getItemState(
        'server-configuration',
        () => {
          reload = true;
          return serverConfigStateContext();
        },
        !config?.configurationMode
      );

      await this.loadConfigTask.execute({
        state: this.state,
        reload,
      });
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load server configuration');
    }
  }

  isDone(): boolean {
    return this.done;
  }

  async activate(): Promise<void> {
    await this.loadConfig();
  }

  async saveConfiguration(finish: boolean): Promise<boolean> {
    const contexts = await this.saveTask.execute(this.getSaveData(finish));

    const validation = contexts.getContext(serverConfigValidationContext);

    return validation.getState();
  }

  private loadServerConfig: IExecutorHandler<ILoadConfigData> = async (data, contexts) => {
    if (!data.reload) {
      return;
    }

    try {
      const config = await this.serverConfigResource.load();

      if (!config) {
        return;
      }

      if (config.configurationMode) {
        data.state.serverConfig.serverName = 'CloudBeaver';
        data.state.serverConfig.sessionExpireTime = 30;

        data.state.serverConfig.adminCredentialsSaveEnabled = true;
        data.state.serverConfig.publicCredentialsSaveEnabled = true;
        data.state.serverConfig.customConnectionsEnabled = true;

        data.state.navigatorConfig = { ...DEFAULT_NAVIGATOR_VIEW_SETTINGS };
      } else {
        data.state.serverConfig.serverName = config.name;
        data.state.serverConfig.sessionExpireTime = (config.sessionExpireTime ?? 1800000) / 1000 / 60;

        data.state.serverConfig.adminCredentialsSaveEnabled = config.adminCredentialsSaveEnabled;
        data.state.serverConfig.publicCredentialsSaveEnabled = config.publicCredentialsSaveEnabled;
        data.state.serverConfig.customConnectionsEnabled = config.supportsCustomConnections;

        data.state.navigatorConfig = { ...config.defaultNavigatorSettings };
      }
    } catch (exception) {
      ExecutorInterrupter.interrupt(contexts);
      this.notificationService.logException(exception, 'Can\'t load server configuration');
    }
  };

  private getSaveData(finish: boolean): IServerConfigSaveData {
    return {
      state: this.state,
      finish,
      configurationWizard: this.administrationScreenService.isConfigurationMode,
    };
  }

  private prepareConfig: IExecutorHandler<IServerConfigSaveData> = (data, contexts) => {
    const state = contexts.getContext(serverConfigStateContext);

    state.serverConfig.serverName = data.state.serverConfig.serverName;
    state.serverConfig.sessionExpireTime = (data.state.serverConfig.sessionExpireTime ?? 30) * 1000 * 60;

    state.serverConfig.adminCredentialsSaveEnabled = data.state.serverConfig.adminCredentialsSaveEnabled;
    state.serverConfig.publicCredentialsSaveEnabled = data.state.serverConfig.publicCredentialsSaveEnabled;
    state.serverConfig.customConnectionsEnabled = data.state.serverConfig.customConnectionsEnabled;

    state.navigatorConfig = { ...data.state.navigatorConfig };
  };

  private save: IExecutorHandler<IServerConfigSaveData> = async (data, contexts) => {
    const validation = contexts.getContext(serverConfigValidationContext);
    const state = contexts.getContext(serverConfigStateContext);

    if (!validation.getState()) {
      return;
    }

    try {
      await this.graphQLService.sdk.setDefaultNavigatorSettings({ settings: state.navigatorConfig });
      if (!data.configurationWizard || data.finish) {
        await this.graphQLService.sdk.configureServer({
          configuration: state.serverConfig,
        });
        await this.serverConfigResource.update();
        this.usersResource.refreshAllLazy();
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t save server configuration');

      throw exception;
    }
  };

  private ensureValidation: IExecutorHandler<IServerConfigSaveData> = (data, contexts) => {
    const validation = contexts.getContext(serverConfigValidationContext);

    if (!validation.getState()) {
      ExecutorInterrupter.interrupt(contexts);
      this.done = false;
    } else {
      this.done = true;
    }
  };

  private validateForm: IExecutorHandler<IServerConfigSaveData> = (data, contexts) => {
    const validation = contexts.getContext(serverConfigValidationContext);

    if (!this.isFormFilled(data.state)) {
      validation.invalidate();
    }
  };

  private isFormFilled(state: IServerConfigurationPageState) {
    if (!state.serverConfig.serverName) {
      return false;
    }
    if ((state.serverConfig.sessionExpireTime ?? 0) < 1) {
      return false;
    }
    return true;
  }
}

export interface IValidationStatusContext {
  getState: () => boolean;
  invalidate: () => void;
}

export function serverConfigValidationContext(): IValidationStatusContext {
  let state = true;

  const invalidate = () => {
    state = false;
  };
  const getState = () => state;

  return {
    getState,
    invalidate,
  };
}

export function serverConfigStateContext(): IServerConfigurationPageState {
  return {
    navigatorConfig: { ...DEFAULT_NAVIGATOR_VIEW_SETTINGS },
    serverConfig: {
      enabledAuthProviders: [],
    },
  };
}

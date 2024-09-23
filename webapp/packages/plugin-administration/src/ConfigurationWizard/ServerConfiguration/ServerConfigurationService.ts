/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { ActionSnackbar, type ActionSnackbarProps, PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { DEFAULT_NAVIGATOR_VIEW_SETTINGS } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { ENotificationType, type INotification, NotificationService } from '@cloudbeaver/core-events';
import { Executor, ExecutorInterrupter, type IExecutor, type IExecutorHandler } from '@cloudbeaver/core-executor';
import { DefaultNavigatorSettingsResource, ProductInfoResource, ServerConfigResource, SessionDataResource } from '@cloudbeaver/core-root';

import { ADMINISTRATION_SERVER_CONFIGURATION_ITEM } from './ADMINISTRATION_SERVER_CONFIGURATION_ITEM.js';
import type { IServerConfigurationPageState } from './IServerConfigurationPageState.js';

export interface IConfigurationPlaceholderProps {
  configurationWizard: boolean;
  state: IServerConfigurationPageState;
}

export interface IServerConfigSaveData {
  state: IServerConfigurationPageState;
  configurationWizard: boolean;
  finish: boolean;
}

export interface ILoadConfigData {
  state: IServerConfigurationPageState;
  reset: boolean;
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
  readonly pluginsContainer: PlaceholderContainer<IConfigurationPlaceholderProps>;

  private done: boolean;
  private stateLinked: boolean;
  private unSaveNotification: INotification<ActionSnackbarProps> | null;

  constructor(
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly defaultNavigatorSettingsResource: DefaultNavigatorSettingsResource,
    private readonly notificationService: NotificationService,
    private readonly sessionDataResource: SessionDataResource,
    private readonly productInfoResource: ProductInfoResource,
  ) {
    this.done = false;
    this.loading = true;
    this.state = serverConfigStateContext();

    makeObservable<ServerConfigurationService, 'done'>(this, {
      state: observable,
      loading: observable,
      done: observable,
    });

    this.stateLinked = false;
    this.unSaveNotification = null;
    this.loadConfigTask = new Executor();
    this.prepareConfigTask = new Executor();
    this.saveTask = new Executor();
    this.validationTask = new Executor();
    this.configurationContainer = new PlaceholderContainer();
    this.pluginsContainer = new PlaceholderContainer();

    this.loadConfigTask
      .next(this.validationTask, () => this.getSaveData(false))
      .addHandler(() => {
        this.loading = true;
      })
      .addHandler(this.loadServerConfig)
      .addPostHandler(() => {
        this.loading = false;
        this.showUnsavedNotification(false);
      });

    this.saveTask.before(this.validationTask).before(this.prepareConfigTask).addPostHandler(this.save);

    this.validationTask.addHandler(this.validateForm).addPostHandler(this.ensureValidation);

    this.serverConfigResource.onDataUpdate.addPostHandler(this.showUnsavedNotification.bind(this, false));

    this.administrationScreenService.activationEvent.addHandler(this.unlinkState.bind(this));
  }

  changed(): void {
    this.done = false;

    this.showUnsavedNotification(true);
  }

  deactivate(configurationWizard: boolean, outside: boolean, outsideAdminPage: boolean): void {
    if (!outsideAdminPage) {
      this.showUnsavedNotification(false);
    }
  }

  async activate(): Promise<void> {
    // this.unSaveNotification?.close(true);
    await this.loadConfig();
  }

  async loadConfig(reset = false): Promise<void> {
    try {
      if (!this.stateLinked) {
        this.state = this.administrationScreenService.getItemState('server-configuration', serverConfigStateContext);
        reset = true;
        this.stateLinked = true;
        await this.serverConfigResource.load();
        await this.defaultNavigatorSettingsResource.load();

        this.serverConfigResource.setDataUpdate(this.state.serverConfig);
        this.defaultNavigatorSettingsResource.setDataUpdate(this.state.navigatorConfig);

        if (reset) {
          this.defaultNavigatorSettingsResource.resetUpdate();
          this.serverConfigResource.resetUpdate();
        }
      }

      await this.loadConfigTask.execute({
        state: this.state,
        reset,
      });
    } catch (exception: any) {
      this.notificationService.logException(exception, "Can't load server configuration");
    }
  }

  isDone(): boolean {
    return this.done;
  }

  async saveConfiguration(finish: boolean): Promise<boolean> {
    const contexts = await this.saveTask.execute(this.getSaveData(finish));

    const validation = contexts.getContext(serverConfigValidationContext);

    return validation.valid;
  }

  private readonly loadServerConfig: IExecutorHandler<ILoadConfigData> = async (data, contexts) => {
    if (!data.reset) {
      return;
    }

    try {
      const config = await this.serverConfigResource.load();
      const productInfo = await this.productInfoResource.load();
      const defaultNavigatorSettings = await this.defaultNavigatorSettingsResource.load();

      if (!config) {
        return;
      }

      data.state.serverConfig.serverName = config.name || productInfo?.name;
      data.state.serverConfig.serverURL = config.serverURL;

      if (this.administrationScreenService.isConfigurationMode && !config.distributed) {
        data.state.serverConfig.serverURL = window.location.origin;
      }

      data.state.serverConfig.sessionExpireTime = config.sessionExpireTime;

      data.state.serverConfig.adminCredentialsSaveEnabled = config.adminCredentialsSaveEnabled;
      data.state.serverConfig.publicCredentialsSaveEnabled = config.publicCredentialsSaveEnabled;
      data.state.serverConfig.customConnectionsEnabled = config.supportsCustomConnections;
      data.state.serverConfig.disabledDrivers = [...config.disabledDrivers];

      Object.assign(data.state.navigatorConfig, defaultNavigatorSettings);
    } catch (exception: any) {
      ExecutorInterrupter.interrupt(contexts);
      this.notificationService.logException(exception, "Can't load server configuration");
    }
  };

  private getSaveData(finish: boolean): IServerConfigSaveData {
    return {
      state: this.state,
      finish,
      configurationWizard: this.administrationScreenService.isConfigurationMode,
    };
  }

  private readonly save: IExecutorHandler<IServerConfigSaveData> = async (data, contexts) => {
    const validation = contexts.getContext(serverConfigValidationContext);

    if (!validation.valid) {
      return;
    }

    try {
      await this.defaultNavigatorSettingsResource.save();
      if (!data.configurationWizard) {
        await this.serverConfigResource.save();
      }

      if (data.configurationWizard && data.finish) {
        await this.serverConfigResource.finishConfiguration();
        await this.sessionDataResource.refresh();
      }
    } catch (exception: any) {
      this.notificationService.logException(exception, "Can't save server configuration");

      throw exception;
    }
  };

  private readonly ensureValidation: IExecutorHandler<IServerConfigSaveData> = (data, contexts) => {
    const validation = contexts.getContext(serverConfigValidationContext);

    if (!validation.valid) {
      ExecutorInterrupter.interrupt(contexts);

      if (validation.messages.length > 0) {
        this.notificationService.notify(
          {
            title: 'administration_configuration_wizard_step_validation_message',
            message: validation.messages.join('\n'),
          },
          validation.valid ? ENotificationType.Info : ENotificationType.Error,
        );
      }
      this.done = false;
    } else {
      this.done = true;
    }
  };

  private readonly validateForm: IExecutorHandler<IServerConfigSaveData> = (data, contexts) => {
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

  private showUnsavedNotification(close: boolean) {
    if (
      (!this.serverConfigResource.isChanged() && !this.defaultNavigatorSettingsResource.isChanged()) ||
      this.administrationScreenService.activeScreen?.item === ADMINISTRATION_SERVER_CONFIGURATION_ITEM
    ) {
      this.unSaveNotification?.close(true);
      return;
    }

    if (
      close ||
      !this.stateLinked ||
      this.unSaveNotification ||
      this.administrationScreenService.isConfigurationMode
      // || !this.administrationScreenService.isAdministrationPageActive
    ) {
      return;
    }

    this.unSaveNotification = this.notificationService.customNotification(
      () => ActionSnackbar,
      {
        actionText: 'administration_configuration_wizard_configuration_server_info_unsaved_navigate',
        onAction: () => this.administrationScreenService.navigateToItem(ADMINISTRATION_SERVER_CONFIGURATION_ITEM),
      },
      {
        title: 'administration_configuration_wizard_configuration_server_info_unsaved_title',
        message: 'administration_configuration_wizard_configuration_server_info_unsaved_message',
        type: ENotificationType.Info,
        onClose: () => {
          this.unSaveNotification = null;
        },
      },
    );
  }

  private unlinkState(state: boolean): void {
    if (state) {
      return;
    }

    this.unSaveNotification?.close(true);
    this.defaultNavigatorSettingsResource.unlinkUpdate();
    this.serverConfigResource.unlinkUpdate();
    this.stateLinked = false;
  }
}

export interface IValidationStatusContext {
  valid: boolean;
  messages: string[];
  invalidate: () => void;
  info: (message: string) => void;
  error: (message: string) => void;
}

export function serverConfigValidationContext(): IValidationStatusContext {
  return {
    valid: true,
    messages: [],
    invalidate() {
      this.valid = false;
    },
    info(message: string) {
      this.messages.push(message);
    },
    error(message: string) {
      this.messages.push(message);
      this.valid = false;
    },
  };
}

export function serverConfigStateContext(): IServerConfigurationPageState {
  return {
    navigatorConfig: { ...DEFAULT_NAVIGATOR_VIEW_SETTINGS },
    serverConfig: {},
  };
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, runInAction, toJS } from 'mobx';

import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { ExecutorHandlersCollection, ExecutorInterrupter, IExecutorHandler, IExecutorHandlersCollection } from '@cloudbeaver/core-executor';
import { TabsContainer } from '@cloudbeaver/core-ui';

import { ConnectionAuthenticationDialog } from '../ConnectionAuthentication/ConnectionAuthenticationDialog';
import { ConnectionFormBaseActions } from './ConnectionFormBaseActions';
import { connectionConfigContext } from './Contexts/connectionConfigContext';
import { connectionCredentialsStateContext } from './Contexts/connectionCredentialsStateContext';
import type { IConnectionFormProps, IConnectionFormState, IConnectionFormFillConfigData, IConnectionFormSubmitData } from './IConnectionFormProps';

export interface IConnectionFormValidation {
  valid: boolean;
  messages: string[];
  info: (message: string) => void;
  error: (message: string) => void;
}

export interface IConnectionFormStatus {
  saved: boolean;
  messages: string[];
  exception: Error | null;
  info: (message: string) => void;
  error: (message: string, exception?: Error) => void;
}

@injectable()
export class ConnectionFormService {
  readonly tabsContainer: TabsContainer<IConnectionFormProps>;
  readonly actionsContainer: PlaceholderContainer<IConnectionFormProps>;

  readonly configureTask: IExecutorHandlersCollection<IConnectionFormState>;
  readonly fillConfigTask: IExecutorHandlersCollection<IConnectionFormFillConfigData>;
  readonly prepareConfigTask: IExecutorHandlersCollection<IConnectionFormSubmitData>;
  readonly formValidationTask: IExecutorHandlersCollection<IConnectionFormSubmitData>;
  readonly formSubmittingTask: IExecutorHandlersCollection<IConnectionFormSubmitData>;
  readonly formStateTask: IExecutorHandlersCollection<IConnectionFormState>;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
  ) {
    this.tabsContainer = new TabsContainer();
    this.actionsContainer = new PlaceholderContainer();
    this.configureTask = new ExecutorHandlersCollection();
    this.fillConfigTask = new ExecutorHandlersCollection();
    this.prepareConfigTask = new ExecutorHandlersCollection();
    this.formSubmittingTask = new ExecutorHandlersCollection();
    this.formValidationTask = new ExecutorHandlersCollection();
    this.formStateTask = new ExecutorHandlersCollection();

    this.formSubmittingTask
      .before(this.formValidationTask)
      .before(this.prepareConfigTask);

    this.formStateTask
      .before<IConnectionFormSubmitData>(this.prepareConfigTask, state => ({ state, submitType: 'submit' }));

    this.prepareConfigTask.addPostHandler(this.askCredentials);
    this.formSubmittingTask.addPostHandler(this.showSubmittingStatusMessage);
    this.formValidationTask.addPostHandler(this.ensureValidation);

    this.actionsContainer.add(ConnectionFormBaseActions);
  }

  connectionValidationContext = (): IConnectionFormValidation => ({
    valid: true,
    messages: [],
    info(message: string) {
      this.messages.push(message);
    },
    error(message: string) {
      this.messages.push(message);
      this.valid = false;
    },
  });

  connectionStatusContext = (): IConnectionFormStatus => ({
    saved: true,
    messages: [],
    exception: null,
    info(message: string) {
      this.messages.push(message);
    },
    error(message: string, exception: Error | null = null) {
      this.messages.push(message);
      this.saved = false;
      this.exception = exception;
    },
  });

  private readonly showSubmittingStatusMessage: IExecutorHandler<IConnectionFormSubmitData> = (data, contexts) => {
    const status = contexts.getContext(this.connectionStatusContext);

    if (!status.saved) {
      ExecutorInterrupter.interrupt(contexts);
    }

    if (status.messages.length > 0) {
      if (status.exception) {
        this.notificationService.logException(
          status.exception,
          status.messages[0],
          status.messages.slice(1).join('\n')
        );
      } else {
        this.notificationService.notify({
          title: status.messages[0],
          message: status.messages.slice(1).join('\n'),
        }, status.saved ? ENotificationType.Success : ENotificationType.Error);
      }
    }
  };

  private readonly askCredentials: IExecutorHandler<IConnectionFormSubmitData> = async (data, contexts) => {
    const credentialsState = contexts.getContext(connectionCredentialsStateContext);

    if (data.submitType !== 'test' || (!credentialsState.authModelId && !credentialsState.networkHandlers.length)) {
      return;
    }

    const config = contexts.getContext(connectionConfigContext);

    runInAction(() => {
      if (credentialsState.authModelId) {
        if (!config.credentials) {
          config.credentials = { ...data.state.config.credentials };
        }

        config.credentials = observable(config.credentials);
      }

      if (credentialsState.networkHandlers.length > 0) {
        if (!config.networkHandlersConfig) {
          config.networkHandlersConfig = toJS(data.state.config.networkHandlersConfig) || [];
        }

        config.networkHandlersConfig = observable(config.networkHandlersConfig);
      }
    });

    const result = await this.commonDialogService.open(ConnectionAuthenticationDialog, {
      config,
      authModelId: credentialsState.authModelId,
      networkHandlers: credentialsState.networkHandlers,
      driverId: config.driverId,
    });

    if (result === DialogueStateResult.Rejected) {
      ExecutorInterrupter.interrupt(contexts);
    }
  };

  private readonly ensureValidation: IExecutorHandler<IConnectionFormSubmitData> = (data, contexts) => {
    const validation = contexts.getContext(this.connectionValidationContext);

    if (!validation.valid) {
      ExecutorInterrupter.interrupt(contexts);
    }

    if (validation.messages.length > 0) {
      this.notificationService.notify({
        title: data.state.mode === 'edit'
          ? 'connections_administration_connection_save_error'
          : 'connections_administration_connection_create_error',
        message: validation.messages.join('\n'),
      }, validation.valid ? ENotificationType.Info : ENotificationType.Error);
    }
  };
}

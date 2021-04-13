/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PlaceholderContainer, TabsContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { Executor, ExecutorInterrupter, IExecutor, IExecutorHandler, IExecutorHandlersCollection } from '@cloudbeaver/core-executor';
import type { CachedMapResource, ConnectionConfig, GetConnectionsQueryVariables } from '@cloudbeaver/core-sdk';
import type { MetadataMap } from '@cloudbeaver/core-utils';

import type { DatabaseConnection } from '../Administration/ConnectionsResource';
import type { IConnectionFormStateContext } from './connectionFormStateContext';

export type ConnectionFormMode = 'edit' | 'create';
export type ConnectionFormType = 'admin' | 'public';

export interface IConnectionFormProps {
  state: IConnectionFormState;
}

export interface IConnectionFormSubmitData {
  submitType: 'submit' | 'test';
  state: IConnectionFormState;
}

export interface IConnectionFormState {
  mode: ConnectionFormMode;
  type: ConnectionFormType;

  config: ConnectionConfig;

  partsState: MetadataMap<string, any>;

  disabled: boolean;
  loading: boolean;

  readonly availableDrivers: string[];
  readonly resource: CachedMapResource<string, DatabaseConnection, GetConnectionsQueryVariables>;
  readonly info: DatabaseConnection | undefined;
  readonly readonly: boolean;
  readonly submittingHandlers: IExecutorHandlersCollection<IConnectionFormSubmitData>;

  readonly setPartsState: (state: MetadataMap<string, any>) => this;
  readonly setOptions: (
    mode: ConnectionFormMode,
    type: ConnectionFormType
  ) => this;
  readonly setConfig: (config: ConnectionConfig) => this;
  readonly setAvailableDrivers: (drivers: string[]) => this;
  readonly save: () => Promise<void>;
  readonly test: () => Promise<void>;
  readonly checkFormState: () => Promise<IConnectionFormStateContext>;
}

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
  readonly prepareConfigTask: IExecutor<IConnectionFormSubmitData>;
  readonly formValidationTask: IExecutor<IConnectionFormSubmitData>;
  readonly formSubmittingTask: IExecutor<IConnectionFormSubmitData>;
  readonly formStateTask: IExecutor<IConnectionFormState>;

  constructor(
    private readonly notificationService: NotificationService
  ) {
    this.tabsContainer = new TabsContainer();
    this.actionsContainer = new PlaceholderContainer();
    this.prepareConfigTask = new Executor();
    this.formSubmittingTask = new Executor();
    this.formValidationTask = new Executor();
    this.formStateTask = new Executor();

    this.formSubmittingTask
      .before(this.formValidationTask)
      .before(this.prepareConfigTask);

    this.formStateTask
      .before<IConnectionFormSubmitData>(this.prepareConfigTask, state => ({ state, submitType: 'submit' }));

    this.formSubmittingTask.addPostHandler(this.showStatusMessage);
    this.formValidationTask.addPostHandler(this.ensureValidation);
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

  private showStatusMessage: IExecutorHandler<IConnectionFormSubmitData> = (data, contexts) => {
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

  private ensureValidation: IExecutorHandler<IConnectionFormSubmitData> = (data, contexts) => {
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

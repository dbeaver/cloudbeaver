/*
 * cloudbeaver - Cloud Database Manager
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

export interface IConnectionForm {
  originLocal: boolean; // connection specific, maybe should be in another place
  disabled: boolean;
  loading: boolean;
}

export interface IConnectionFormData {
  config: ConnectionConfig;
  resource?: CachedMapResource<string, DatabaseConnection, GetConnectionsQueryVariables>;
  info?: DatabaseConnection;
  partsState: MetadataMap<string, any>;
  availableDrivers?: string[];
}

export interface IConnectionFormOptions {
  mode: 'edit' | 'create';
  type: 'admin' | 'public';
}

export interface IConnectionFormProps {
  data: IConnectionFormData;
  options: IConnectionFormOptions;
  form: IConnectionForm;
}

export interface IConnectionFormSubmitData extends IConnectionFormProps {
  submitType: 'submit' | 'test';
}

export interface IConnectionFormState {
  form: IConnectionForm;
  submittingHandlers: IExecutorHandlersCollection<IConnectionFormSubmitData>;
  save: () => Promise<void>;
  test: () => Promise<void>;
}

export interface IConnectionFormTabProps {
  data: IConnectionFormData;
  options: IConnectionFormOptions;
  form: IConnectionFormState;
}

export interface IConnectionFormPartOptions {
  beforeSubmit?: () => void;
  afterSubmit?: () => void;
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
  readonly tabsContainer: TabsContainer<IConnectionFormTabProps, IConnectionFormPartOptions>;
  readonly actionsContainer: PlaceholderContainer<IConnectionFormProps>;
  readonly prepareConfigTask: IExecutor<IConnectionFormSubmitData>;
  readonly formValidationTask: IExecutor<IConnectionFormSubmitData>;
  readonly formSubmittingTask: IExecutor<IConnectionFormSubmitData>;

  constructor(
    private readonly notificationService: NotificationService
  ) {
    this.tabsContainer = new TabsContainer();
    this.actionsContainer = new PlaceholderContainer();
    this.prepareConfigTask = new Executor();
    this.formSubmittingTask = new Executor();
    this.formValidationTask = new Executor();

    this.formSubmittingTask
      .before(this.formValidationTask)
      .before(this.prepareConfigTask);

    this.formSubmittingTask.addPostHandler(this.showStatusMessage);
    this.formValidationTask.addPostHandler(this.ensureValidation);
  }

  connectionConfigContext = (): ConnectionConfig => ({});

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
        title: data.options.mode === 'edit' ? 'connections_administration_connection_save_error' : 'connections_administration_connection_create_error',
        message: validation.messages.join('\n'),
      }, validation.valid ? ENotificationType.Info : ENotificationType.Error);
    }
  };
}

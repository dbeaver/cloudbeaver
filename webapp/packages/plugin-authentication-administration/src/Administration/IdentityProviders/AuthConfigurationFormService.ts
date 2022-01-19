/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { TabsContainer } from '@cloudbeaver/core-ui';
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { ExecutorHandlersCollection, ExecutorInterrupter, IExecutorHandler, IExecutorHandlersCollection } from '@cloudbeaver/core-executor';

import { AuthConfigurationFormBaseActions } from './AuthConfigurationFormBaseActions';
import type { IAuthConfigurationFormFillConfigData, IAuthConfigurationFormProps, IAuthConfigurationFormSubmitData, IAuthConfigurationFormState } from './IAuthConfigurationFormProps';

export interface IConfigurationFormValidation {
  valid: boolean;
  messages: string[];
  info: (message: string) => void;
  error: (message: string) => void;
}

export interface IConfigurationFormStatus {
  saved: boolean;
  messages: string[];
  exception: Error | null;
  info: (message: string) => void;
  error: (message: string, exception?: Error) => void;
}

@injectable()
export class AuthConfigurationFormService {
  readonly tabsContainer: TabsContainer<IAuthConfigurationFormProps>;
  readonly actionsContainer: PlaceholderContainer<IAuthConfigurationFormProps>;

  readonly configureTask: IExecutorHandlersCollection<IAuthConfigurationFormState>;
  readonly fillConfigTask: IExecutorHandlersCollection<IAuthConfigurationFormFillConfigData>;
  readonly prepareConfigTask: IExecutorHandlersCollection<IAuthConfigurationFormSubmitData>;
  readonly formValidationTask: IExecutorHandlersCollection<IAuthConfigurationFormSubmitData>;
  readonly formSubmittingTask: IExecutorHandlersCollection<IAuthConfigurationFormSubmitData>;
  readonly formStateTask: IExecutorHandlersCollection<IAuthConfigurationFormState>;

  constructor(
    private readonly notificationService: NotificationService,
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
      .before<IAuthConfigurationFormSubmitData>(this.prepareConfigTask, state => ({ state, submitType: 'submit' }));

    this.formSubmittingTask.addPostHandler(this.showSubmittingStatusMessage);
    this.formValidationTask.addPostHandler(this.ensureValidation);

    this.actionsContainer.add(AuthConfigurationFormBaseActions);
  }

  configurationValidationContext = (): IConfigurationFormValidation => ({
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

  configurationStatusContext = (): IConfigurationFormStatus => ({
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

  private showSubmittingStatusMessage: IExecutorHandler<IAuthConfigurationFormSubmitData> = (data, contexts) => {
    const status = contexts.getContext(this.configurationStatusContext);

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

  private ensureValidation: IExecutorHandler<IAuthConfigurationFormSubmitData> = (data, contexts) => {
    const validation = contexts.getContext(this.configurationValidationContext);

    if (!validation.valid) {
      ExecutorInterrupter.interrupt(contexts);
    }

    if (validation.messages.length > 0) {
      this.notificationService.notify({
        title: data.state.mode === 'edit'
          ? 'administration_identity_providers_provider_save_error'
          : 'administration_identity_providers_provider_create_error',
        message: validation.messages.join('\n'),
      }, validation.valid ? ENotificationType.Info : ENotificationType.Error);
    }
  };
}

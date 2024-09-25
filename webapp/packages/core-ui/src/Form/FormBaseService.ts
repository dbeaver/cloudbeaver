/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { ExecutorHandlersCollection, ExecutorInterrupter, type IExecutorHandler, type IExecutorHandlersCollection } from '@cloudbeaver/core-executor';
import type { LocalizationService } from '@cloudbeaver/core-localization';

import { TabsContainer } from '../Tabs/TabsContainer/TabsContainer.js';
import { formStatusContext } from './formStatusContext.js';
import { formValidationContext } from './formValidationContext.js';
import type { IFormProps } from './IFormProps.js';
import type { IFormState } from './IFormState.js';

export class FormBaseService<TState, TProps extends IFormProps<TState> = IFormProps<TState>> {
  readonly parts: TabsContainer<TProps>;
  readonly actionsContainer: PlaceholderContainer<TProps>;

  readonly onFormat: IExecutorHandlersCollection<IFormState<TState>>;
  readonly onValidate: IExecutorHandlersCollection<IFormState<TState>>;
  readonly onSubmit: IExecutorHandlersCollection<IFormState<TState>>;
  readonly onLoaded: IExecutorHandlersCollection<IFormState<TState>>;
  readonly onState: IExecutorHandlersCollection<TState>;

  constructor(
    private readonly localizationService: LocalizationService,
    private readonly notificationService: NotificationService,
    name: string,
  ) {
    this.parts = new TabsContainer(name);
    this.actionsContainer = new PlaceholderContainer();
    this.onFormat = new ExecutorHandlersCollection();
    this.onValidate = new ExecutorHandlersCollection();
    this.onSubmit = new ExecutorHandlersCollection();
    this.onLoaded = new ExecutorHandlersCollection();
    this.onState = new ExecutorHandlersCollection();

    this.onSubmit.addPostHandler(this.handleSubmittingStatus);
    this.onValidate.addPostHandler(this.handleValidation);
  }

  private readonly handleSubmittingStatus: IExecutorHandler<IFormState<TState>> = (data, contexts) => {
    const status = contexts.getContext(formStatusContext);

    if (!status.saved) {
      ExecutorInterrupter.interrupt(contexts);
    }

    if (status.messages.length > 0) {
      // if (status.exception) {
      //   this.notificationService.logException(status.exception, status.messages[0], status.messages.slice(1).join('\n'));
      // } else {
      //   this.notificationService.notify(
      //     {
      //       title: status.messages[0],
      //       message: status.messages.slice(1).join('\n'),
      //     },
      //     status.saved ? ENotificationType.Success : ENotificationType.Error,
      //   );
      // }
    }
  };

  private readonly handleValidation: IExecutorHandler<IFormState<TState>> = (data, contexts) => {
    const validation = contexts.getContext(formValidationContext);

    if (!validation.valid) {
      ExecutorInterrupter.interrupt(contexts);
    }

    if (validation.messages.length > 0) {
      const messages = validation.messages.map(message => this.localizationService.translate(message));
      this.notificationService.notify(
        {
          title: 'core_ui_form_save_error',
          message: messages.join('\n'),
        },
        validation.valid ? ENotificationType.Info : ENotificationType.Error,
      );
    }
  };
}

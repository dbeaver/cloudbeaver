/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { FormBaseService, type IFormState } from '@cloudbeaver/core-ui';
import type { IConnectionFormProps, IConnectionFormState } from './IConnectionFormState.js';
import { importLazyComponent, PlaceholderContainer } from '@cloudbeaver/core-blocks';

const ConnectionFormBaseActionsLoader = importLazyComponent(() => import('./ConnectionFormBaseActions.js').then(m => m.ConnectionFormBaseActions));

export type ConnectionFormContainerProps = {
  formState: IFormState<IConnectionFormState>;
};

@injectable(() => [LocalizationService, NotificationService])
export class ConnectionFormService extends FormBaseService<IConnectionFormState, IConnectionFormProps> {
  readonly providerPropertiesContainer: PlaceholderContainer<ConnectionFormContainerProps>;
  readonly connectionContainer: PlaceholderContainer<ConnectionFormContainerProps>;

  constructor(localizationService: LocalizationService, notificationService: NotificationService) {
    super(localizationService, notificationService, 'Connection form');
    this.providerPropertiesContainer = new PlaceholderContainer<ConnectionFormContainerProps>();
    this.connectionContainer = new PlaceholderContainer<ConnectionFormContainerProps>();
    this.actionsContainer.add(ConnectionFormBaseActionsLoader);
  }
}

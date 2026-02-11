/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { FormBaseService, type IFormState } from '@cloudbeaver/core-ui';
import { importLazyComponent } from '@cloudbeaver/core-blocks';

import type { IConnectionPreferencesFormProps, IConnectionPreferencesFormState } from './IConnectionPreferencesFormState.js';

const ConnectionFormBaseActionsLoader = importLazyComponent(() =>
  import('./ConnectionPreferencesFormBaseActions.js').then(m => m.ConnectionPreferencesFormBaseActions),
);

export type ConnectionFormContainerProps = {
  formState: IFormState<IConnectionPreferencesFormState>;
};

@injectable(() => [LocalizationService, NotificationService])
export class ConnectionPreferencesFormService extends FormBaseService<IConnectionPreferencesFormState, IConnectionPreferencesFormProps> {
  constructor(localizationService: LocalizationService, notificationService: NotificationService) {
    super(localizationService, notificationService, 'Connection preferences form');
    this.actionsContainer.add(ConnectionFormBaseActionsLoader);
  }
}

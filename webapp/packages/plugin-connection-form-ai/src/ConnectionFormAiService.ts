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
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import type { IConnectionFormProps, IConnectionFormState } from '@cloudbeaver/plugin-connections';

export type ConnectionFormAiContainerProps = {
  formState: IFormState<IConnectionFormState>;
};

@injectable(() => [LocalizationService, NotificationService])
export class ConnectionFormAiService extends FormBaseService<IConnectionFormState, IConnectionFormProps> {
  readonly optionsContainer: PlaceholderContainer<ConnectionFormAiContainerProps>;

  constructor(localizationService: LocalizationService, notificationService: NotificationService) {
    super(localizationService, notificationService, 'Connection AI form');
    this.optionsContainer = new PlaceholderContainer<ConnectionFormAiContainerProps>();
  }
}

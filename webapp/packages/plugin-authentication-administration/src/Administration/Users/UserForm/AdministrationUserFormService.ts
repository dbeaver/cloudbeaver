/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { FormBaseService, type IFormProps } from '@cloudbeaver/core-ui';

export interface IUserFormState {
  userId: string | null;
}

export type UserFormProps = IFormProps<IUserFormState>;

@injectable()
export class AdministrationUserFormService extends FormBaseService<IUserFormState, UserFormProps> {
  constructor(localizationService: LocalizationService, notificationService: NotificationService) {
    super(localizationService, notificationService, 'Administration User form');
  }
}

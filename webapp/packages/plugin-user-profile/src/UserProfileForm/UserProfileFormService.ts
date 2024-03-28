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
import { FormBaseService, IFormProps } from '@cloudbeaver/core-ui';

export interface IUserProfileFormState {}

export type UserProfileFormProps = IFormProps<IUserProfileFormState>;

@injectable()
export class UserProfileFormService extends FormBaseService<IUserProfileFormState, UserProfileFormProps> {
  constructor(localizationService: LocalizationService, notificationService: NotificationService) {
    super(localizationService, notificationService, 'User profile form');
  }
}

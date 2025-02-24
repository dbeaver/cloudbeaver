/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { FormBaseService, type IFormProps } from '@cloudbeaver/core-ui';

export interface IConnectionFormRefactoredState {
  connectionInfoParams: IConnectionInfoParams;
}

export type ConnectionFormRefactoredProps = IFormProps<IConnectionFormRefactoredState>;

@injectable()
export class ConnectionFormServiceRefactored extends FormBaseService<IConnectionFormRefactoredState, ConnectionFormRefactoredProps> {
  constructor(localizationService: LocalizationService, notificationService: NotificationService) {
    super(localizationService, notificationService, 'Connection form');
  }
}

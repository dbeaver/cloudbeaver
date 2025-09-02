/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { AdministrationUserFormService } from '../AdministrationUserFormService.js';
import { getUserFormInfoPart } from './getUserFormInfoPart.js';
import { importLazyComponent } from '@cloudbeaver/core-blocks';

const UserFormInfo = importLazyComponent(() => import('./UserFormInfo.js').then(m => m.UserFormInfo));

@injectable(() => [AdministrationUserFormService])
export class UserFormInfoPartBootstrap extends Bootstrap {
  constructor(private readonly administrationUserFormService: AdministrationUserFormService) {
    super();
  }

  override register(): void {
    this.administrationUserFormService.parts.add({
      key: 'info',
      name: 'authentication_administration_user_info',
      title: 'authentication_administration_user_info',
      order: 1,
      panel: () => UserFormInfo,
      stateGetter: props => () => getUserFormInfoPart(props.formState),
    });
  }
}

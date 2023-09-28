/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { AdministrationUserFormService } from '../AdministrationUserFormService';
import { DATA_CONTEXT_USER_FORM_INFO_PART } from './DATA_CONTEXT_USER_FORM_INFO_PART';

const UserFormInfo = React.lazy(async () => {
  const { UserFormInfo } = await import('./UserFormInfo');
  return { default: UserFormInfo };
});

@injectable()
export class UserFormInfoPartBootstrap extends Bootstrap {
  constructor(private readonly administrationUserFormService: AdministrationUserFormService) {
    super();
  }

  register(): void {
    this.administrationUserFormService.parts.add({
      key: 'info',
      name: 'authentication_administration_user_info',
      title: 'authentication_administration_user_info',
      order: 1,
      panel: () => UserFormInfo,
      stateGetter: props => () => props.formState.dataContext.get(DATA_CONTEXT_USER_FORM_INFO_PART),
    });
  }

  load(): void {}
}

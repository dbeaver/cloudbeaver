/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';

import { AuthDialog } from './AuthDialog';

@injectable()
export class AuthDialogService {
  constructor(
    private commonDialogService: CommonDialogService,
  ) { }

  async showLoginForm(persistent = false) {
    await this.commonDialogService.open(AuthDialog, null, { persistent });
  }
}

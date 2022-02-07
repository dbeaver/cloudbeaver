/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';

import { AuthDialog } from './AuthDialog';

@injectable()
export class AuthDialogService {
  constructor(
    private readonly commonDialogService: CommonDialogService
  ) { }

  showLoginForm(
    persistent = false, 
    providerId: string | null = null, 
    link?: boolean
  ): Promise<DialogueStateResult | null> {
    return this.commonDialogService.open(AuthDialog, { providerId, link }, { persistent });
  }

  closeLoginForm(promise: Promise<DialogueStateResult | null>): void {
    this.commonDialogService.rejectDialog(promise);
  }
}

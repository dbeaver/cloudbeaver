/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';

import type { IAuthOptions } from '../IAuthOptions.js';
import { AuthDialog } from './AuthDialog.js';

@injectable()
export class AuthDialogService {
  get isPersistent(): boolean {
    return this.persistent;
  }

  private persistent: boolean;
  private dialog: Promise<DialogueStateResult | null> | null;

  constructor(private readonly commonDialogService: CommonDialogService) {
    this.persistent = false;
    this.dialog = null;
  }

  showLoginForm(
    persistent = false,
    options: IAuthOptions = {
      providerId: null,
    },
  ): Promise<DialogueStateResult | null> {
    if (this.dialog) {
      return this.dialog;
    }

    this.persistent = persistent;
    this.dialog = this.commonDialogService.open(AuthDialog, options, { persistent });
    this.dialog.finally(() => {
      this.dialog = null;
      this.persistent = false;
    });

    return this.dialog;
  }

  closeLoginForm(): void {
    if (this.dialog) {
      this.commonDialogService.rejectDialog(this.dialog);
    }
  }
}

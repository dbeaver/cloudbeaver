/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CommonDialogService, type DialogResult } from '@cloudbeaver/core-dialogs';

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import type { IAuthOptions } from '../IAuthOptions.js';

const AuthDialog = importLazyComponent(() => import('./AuthDialog.js').then(m => m.AuthDialog));

export class AuthDialogServiceImpl {
  get isPersistent(): boolean {
    return this.persistent;
  }

  private persistent: boolean;
  private dialog: Promise<DialogResult> | null;

  constructor(private readonly commonDialogService: CommonDialogService) {
    this.persistent = false;
    this.dialog = null;
  }

  showLoginForm(
    persistent = false,
    options: IAuthOptions = {
      providerId: null,
    },
  ): Promise<DialogResult> {
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

export type AuthDialogService = AuthDialogServiceImpl;

export class AuthDialogServiceDI extends Context.Service<AuthDialogServiceDI, AuthDialogServiceImpl>()(
  '@cloudbeaver/plugin-authentication/Dialog/AuthDialogService#AuthDialogService',
) {
  static readonly implementation = AuthDialogServiceImpl;

  static readonly dependencies = () => [CommonDialogService] as const;
  static readonly make: Effect.Effect<AuthDialogServiceImpl, never, Context.Service.Identifier<typeof CommonDialogService>> = Effect.gen(
    function* makeAuthDialogService() {
      const commonDialogService = yield* CommonDialogService;

      return new AuthDialogServiceImpl(commonDialogService);
    },
  );
  static readonly layer: Layer.Layer<AuthDialogServiceDI, never, Context.Service.Identifier<typeof CommonDialogService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AuthDialogService = AuthDialogServiceDI;

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { ConfirmationDialog } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';

export class UserLoadingErrorDialogBootstrapImpl extends Bootstrap {
  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
  ) {
    super();
    this.handleException = this.handleException.bind(this);
    userInfoResource.onException.addHandler(this.handleException);
  }

  private async handleException(exception: Error) {
    this.notificationService.logException(exception, 'plugin_authentication_user_loading_error');
    const { status } = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'plugin_authentication_loading_error_dialog_title',
      message: 'plugin_authentication_loading_error_dialog_message',
    });

    if (status === DialogueStateResult.Resolved) {
      await this.userInfoResource.logout();
    }
  }

  protected override dispose(): Promise<void> | void {
    this.userInfoResource.onException.removeHandler(this.handleException);
  }
}

export type UserLoadingErrorDialogBootstrap = UserLoadingErrorDialogBootstrapImpl;

export class UserLoadingErrorDialogBootstrapDI extends Context.Service<UserLoadingErrorDialogBootstrapDI, UserLoadingErrorDialogBootstrapImpl>()(
  '@cloudbeaver/plugin-authentication/UserLoadingErrorDialogBootstrap#UserLoadingErrorDialogBootstrap',
) {
  static readonly implementation = UserLoadingErrorDialogBootstrapImpl;

  static readonly dependencies = () => [UserInfoResource, CommonDialogService, NotificationService] as const;
  static readonly make: Effect.Effect<
    UserLoadingErrorDialogBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof NotificationService>
  > = Effect.gen(function* makeUserLoadingErrorDialogBootstrap() {
    const userInfoResource = yield* UserInfoResource;
    const commonDialogService = yield* CommonDialogService;
    const notificationService = yield* NotificationService;

    return new UserLoadingErrorDialogBootstrapImpl(userInfoResource, commonDialogService, notificationService);
  });
  static readonly layer: Layer.Layer<
    UserLoadingErrorDialogBootstrapDI,
    never,
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof NotificationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const UserLoadingErrorDialogBootstrap = UserLoadingErrorDialogBootstrapDI;

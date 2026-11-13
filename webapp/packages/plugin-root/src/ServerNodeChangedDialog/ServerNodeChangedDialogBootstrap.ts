/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ActionSnackbar, importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { ServerNodeService } from '@cloudbeaver/core-root';
import { RouterService } from '@cloudbeaver/core-routing';

const ServerNodeChangedDialog = importLazyComponent(() => import('./ServerNodeChangedDialog.js').then(m => m.ServerNodeChangedDialog));

export class ServerNodeChangedDialogBootstrapImpl extends Bootstrap {
  constructor(
    private readonly routerService: RouterService,
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly serverNodeService: ServerNodeService,
  ) {
    super();
  }

  override register(): void {
    this.serverNodeService.onApplicationRunIdChange.addPostHandler(this.handleServerNodeChanged.bind(this));
  }

  private async handleServerNodeChanged(): Promise<void> {
    const { status } = await this.commonDialogService.open(ServerNodeChangedDialog, undefined);

    if (status === DialogueStateResult.Rejected) {
      this.notificationService.customNotification(
        () => ActionSnackbar,
        {
          actionText: 'ui_processing_reload',
          onAction: () => this.routerService.reload(),
        },
        {
          title: 'app_root_server_node_changed_title',
          message: 'app_root_server_node_changed_message',
          persistent: true,
          type: ENotificationType.Error,
        },
      );
    }
  }
}

export type ServerNodeChangedDialogBootstrap = ServerNodeChangedDialogBootstrapImpl;

export class ServerNodeChangedDialogBootstrapDI extends Context.Service<ServerNodeChangedDialogBootstrapDI, ServerNodeChangedDialogBootstrapImpl>()(
  '@cloudbeaver/plugin-root/ServerNodeChangedDialog/ServerNodeChangedDialogBootstrap#ServerNodeChangedDialogBootstrap',
) {
  static readonly implementation = ServerNodeChangedDialogBootstrapImpl;

  static readonly dependencies = () => [RouterService, NotificationService, CommonDialogService, ServerNodeService] as const;
  static readonly make: Effect.Effect<
    ServerNodeChangedDialogBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof RouterService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof ServerNodeService>
  > = Effect.gen(function* makeServerNodeChangedDialogBootstrap() {
    const routerService = yield* RouterService;
    const notificationService = yield* NotificationService;
    const commonDialogService = yield* CommonDialogService;
    const serverNodeService = yield* ServerNodeService;

    return new ServerNodeChangedDialogBootstrapImpl(routerService, notificationService, commonDialogService, serverNodeService);
  });
  static readonly layer: Layer.Layer<
    ServerNodeChangedDialogBootstrapDI,
    never,
    | Context.Service.Identifier<typeof RouterService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof ServerNodeService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ServerNodeChangedDialogBootstrap = ServerNodeChangedDialogBootstrapDI;

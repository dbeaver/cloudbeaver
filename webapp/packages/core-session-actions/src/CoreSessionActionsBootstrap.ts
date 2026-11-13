/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConfirmationDialog } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { SessionResource } from '@cloudbeaver/core-root';
import { WindowsService } from '@cloudbeaver/core-routing';
import { CbServerEventId, type WsOpenUrlEvent } from '@cloudbeaver/core-sdk';

import { SessionActionsEventHandler } from './SessionActionsEventHandler.js';
import { renderUrlConfirmationDetails } from './UrlConfirmationDetails.js';

export class CoreSessionActionsBootstrapImpl extends Bootstrap {
  constructor(
    private readonly sessionActionsEventHandler: SessionActionsEventHandler,
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly windowsService: WindowsService,
    private readonly sessionResource: SessionResource,
  ) {
    super();

    this.sessionActionsEventHandler.onEvent(CbServerEventId.CbOpenUrl, this.handleOpenUrlEvent.bind(this), undefined, this.sessionResource);
  }

  private async handleOpenUrlEvent(event: WsOpenUrlEvent): Promise<void> {
    const { url, timestamp, actionId } = event;

    try {
      const { status } = await this.commonDialogService.open(ConfirmationDialog, {
        title: 'core_session_actions_open_url_title',
        message: 'core_session_actions_open_url_message',
        icon: '/icons/preload/info_icon_sm.svg',
        size: 'medium',
        confirmActionText: 'core_session_actions_open_url_button',
        children: () => renderUrlConfirmationDetails(url),
      });

      if (status === DialogueStateResult.Resolved) {
        const popup = this.windowsService.open(`external-url-${timestamp}`, {
          url,
        });

        if (!popup) {
          this.notificationService.logError({
            title: 'core_session_actions_popup_blocked',
          });

          this.sessionActionsEventHandler.cancelAuth(actionId);

          return;
        }
      }

      if (status === DialogueStateResult.Rejected) {
        this.sessionActionsEventHandler.cancelAuth(actionId);
      }
    } catch (exception: any) {
      this.notificationService.logException(exception, 'core_session_actions_open_url_error');
    }
  }
}

export type CoreSessionActionsBootstrap = CoreSessionActionsBootstrapImpl;

export class CoreSessionActionsBootstrapDI extends Context.Service<CoreSessionActionsBootstrapDI, CoreSessionActionsBootstrapImpl>()(
  '@cloudbeaver/core-session-actions/CoreSessionActionsBootstrap#CoreSessionActionsBootstrap',
) {
  static readonly implementation = CoreSessionActionsBootstrapImpl;

  static readonly dependencies = () =>
    [SessionActionsEventHandler, NotificationService, CommonDialogService, WindowsService, SessionResource] as const;
  static readonly make: Effect.Effect<
    CoreSessionActionsBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof SessionActionsEventHandler>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof WindowsService>
    | Context.Service.Identifier<typeof SessionResource>
  > = Effect.gen(function* makeCoreSessionActionsBootstrap() {
    const sessionActionsEventHandler = yield* SessionActionsEventHandler;
    const notificationService = yield* NotificationService;
    const commonDialogService = yield* CommonDialogService;
    const windowsService = yield* WindowsService;
    const sessionResource = yield* SessionResource;

    return new CoreSessionActionsBootstrapImpl(sessionActionsEventHandler, notificationService, commonDialogService, windowsService, sessionResource);
  });
  static readonly layer: Layer.Layer<
    CoreSessionActionsBootstrapDI,
    never,
    | Context.Service.Identifier<typeof SessionActionsEventHandler>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof WindowsService>
    | Context.Service.Identifier<typeof SessionResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const CoreSessionActionsBootstrap = CoreSessionActionsBootstrapDI;

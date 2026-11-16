/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { SessionResource } from '@cloudbeaver/core-root';
import { CbServerEventId } from '@cloudbeaver/core-sdk';
import { ServerNotificationsEventHandler } from './ServerNotificationsEventHandler.js';

export class CoreServerNotificationsBootstrapImpl extends Bootstrap {
  constructor(
    private readonly serverNotificationsEventHandler: ServerNotificationsEventHandler,
    private readonly notificationService: NotificationService,
    private readonly sessionResource: SessionResource,
  ) {
    super();
    this.serverNotificationsEventHandler.onEvent(
      CbServerEventId.CbServerNotification,
      event => {
        this.notificationService.notify(event.options, event.type);
      },
      undefined,
      this.sessionResource,
    );
  }
}

export type CoreServerNotificationsBootstrap = CoreServerNotificationsBootstrapImpl;

export class CoreServerNotificationsBootstrapDI extends Context.Service<CoreServerNotificationsBootstrapDI, CoreServerNotificationsBootstrapImpl>()(
  '@cloudbeaver/core-server-notifications/CoreServerNotificationsBootstrap#CoreServerNotificationsBootstrap',
) {
  static readonly implementation = CoreServerNotificationsBootstrapImpl;

  static readonly dependencies = () => [ServerNotificationsEventHandler, NotificationService, SessionResource] as const;
  static readonly make: Effect.Effect<
    CoreServerNotificationsBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof ServerNotificationsEventHandler>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof SessionResource>
  > = Effect.gen(function* makeCoreServerNotificationsBootstrap() {
    const serverNotificationsEventHandler = yield* ServerNotificationsEventHandler;
    const notificationService = yield* NotificationService;
    const sessionResource = yield* SessionResource;

    return new CoreServerNotificationsBootstrapImpl(serverNotificationsEventHandler, notificationService, sessionResource);
  });
  static readonly layer: Layer.Layer<
    CoreServerNotificationsBootstrapDI,
    never,
    | Context.Service.Identifier<typeof ServerNotificationsEventHandler>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof SessionResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const CoreServerNotificationsBootstrap = CoreServerNotificationsBootstrapDI;

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type INotification, NotificationService } from '@cloudbeaver/core-events';
import { NetworkStateService } from '@cloudbeaver/core-root';

export class NetworkStateNotificationBootstrapImpl extends Bootstrap {
  private activeNotification: INotification | null;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly networkStateService: NetworkStateService,
  ) {
    super();
    this.activeNotification = null;
  }

  override register(): void {
    this.networkStateService.networkStateExecutor.addHandler(this.handleNetworkStateChange.bind(this));
  }

  private handleNetworkStateChange(state: boolean): void {
    if (!state) {
      if (this.activeNotification) {
        return;
      }

      this.activeNotification = this.notificationService.logInfo({
        title: 'plugin_root_network_state_title',
        message: 'plugin_root_network_state_description',
        persistent: true,
      });
    } else {
      this.activeNotification?.close(true);
      this.activeNotification = null;
    }
  }
}

export type NetworkStateNotificationBootstrap = NetworkStateNotificationBootstrapImpl;

export class NetworkStateNotificationBootstrapDI extends Context.Service<
  NetworkStateNotificationBootstrapDI,
  NetworkStateNotificationBootstrapImpl
>()('@cloudbeaver/plugin-root/NetworkStateNotification/NetworkStateNotificationBootstrap#NetworkStateNotificationBootstrap') {
  static readonly implementation = NetworkStateNotificationBootstrapImpl;

  static readonly dependencies = () => [NotificationService, NetworkStateService] as const;
  static readonly make: Effect.Effect<
    NetworkStateNotificationBootstrapImpl,
    never,
    Context.Service.Identifier<typeof NotificationService> | Context.Service.Identifier<typeof NetworkStateService>
  > = Effect.gen(function* makeNetworkStateNotificationBootstrap() {
    const notificationService = yield* NotificationService;
    const networkStateService = yield* NetworkStateService;

    return new NetworkStateNotificationBootstrapImpl(notificationService, networkStateService);
  });
  static readonly layer: Layer.Layer<
    NetworkStateNotificationBootstrapDI,
    never,
    Context.Service.Identifier<typeof NotificationService> | Context.Service.Identifier<typeof NetworkStateService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const NetworkStateNotificationBootstrap = NetworkStateNotificationBootstrapDI;

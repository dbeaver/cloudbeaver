/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ENotificationType, type INotification, NotificationService } from '@cloudbeaver/core-events';
import { DataSynchronizationService, ServerConfigResource } from '@cloudbeaver/core-root';

import { importLazyComponent } from '@cloudbeaver/core-blocks';

const DataSynchronizationNotification = importLazyComponent(() =>
  import('./DataSynchronizationNotification.js').then(m => m.DataSynchronizationNotification),
);

export class DataSynchronizationResolverBootstrapImpl extends Bootstrap {
  private activeNotification: INotification | null;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly dataSynchronizationService: DataSynchronizationService,
  ) {
    super();
    this.activeNotification = null;
  }

  override register(): void {
    this.dataSynchronizationService.onSynchronizationRequest.addHandler(this.handleNetworkStateChange.bind(this));
  }

  private handleNetworkStateChange(): void {
    if (this.activeNotification || this.serverConfigResource.configurationMode) {
      return;
    }

    this.activeNotification = this.notificationService.customNotification(
      () => DataSynchronizationNotification,
      {},
      {
        title: 'plugin_root_data_sync_title',
        message: 'plugin_root_data_sync_message',
        type: ENotificationType.Info,
        onClose: () => {
          this.dataSynchronizationService.resolveAll(false);
          this.activeNotification = null;
        },
      },
    );
  }
}

export type DataSynchronizationResolverBootstrap = DataSynchronizationResolverBootstrapImpl;

export class DataSynchronizationResolverBootstrapDI extends Context.Service<
  DataSynchronizationResolverBootstrapDI,
  DataSynchronizationResolverBootstrapImpl
>()('@cloudbeaver/plugin-root/DataSynchronization/DataSynchronizationResolverBootstrap#DataSynchronizationResolverBootstrap') {
  static readonly implementation = DataSynchronizationResolverBootstrapImpl;

  static readonly dependencies = () => [NotificationService, ServerConfigResource, DataSynchronizationService] as const;
  static readonly make: Effect.Effect<
    DataSynchronizationResolverBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof DataSynchronizationService>
  > = Effect.gen(function* makeDataSynchronizationResolverBootstrap() {
    const notificationService = yield* NotificationService;
    const serverConfigResource = yield* ServerConfigResource;
    const dataSynchronizationService = yield* DataSynchronizationService;

    return new DataSynchronizationResolverBootstrapImpl(notificationService, serverConfigResource, dataSynchronizationService);
  });
  static readonly layer: Layer.Layer<
    DataSynchronizationResolverBootstrapDI,
    never,
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof DataSynchronizationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataSynchronizationResolverBootstrap = DataSynchronizationResolverBootstrapDI;

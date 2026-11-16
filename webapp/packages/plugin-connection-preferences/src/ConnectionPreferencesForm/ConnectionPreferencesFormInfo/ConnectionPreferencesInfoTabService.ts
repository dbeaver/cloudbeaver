/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { ConnectionPreferencesFormService } from '../ConnectionPreferencesFormService.js';

const ConnectionPreferencesFormInfo = importLazyComponent(() =>
  import('./ConnectionPreferencesFormInfo.js').then(m => m.ConnectionPreferencesFormInfo),
);

export class ConnectionPreferencesInfoTabServiceImpl extends Bootstrap {
  constructor(private readonly connectionPreferencesFormService: ConnectionPreferencesFormService) {
    super();
  }

  override register(): void {
    this.connectionPreferencesFormService.parts.add({
      key: 'preferences-info',
      name: 'Info',
      order: 1,
      panel: () => ConnectionPreferencesFormInfo,
    });
  }
}

export type ConnectionPreferencesInfoTabService = ConnectionPreferencesInfoTabServiceImpl;

export class ConnectionPreferencesInfoTabServiceDI extends Context.Service<
  ConnectionPreferencesInfoTabServiceDI,
  ConnectionPreferencesInfoTabServiceImpl
>()(
  '@cloudbeaver/plugin-connection-preferences/ConnectionPreferencesForm/ConnectionPreferencesFormInfo/ConnectionPreferencesInfoTabService#ConnectionPreferencesInfoTabService',
) {
  static readonly implementation = ConnectionPreferencesInfoTabServiceImpl;

  static readonly dependencies = () => [ConnectionPreferencesFormService] as const;
  static readonly make: Effect.Effect<
    ConnectionPreferencesInfoTabServiceImpl,
    never,
    Context.Service.Identifier<typeof ConnectionPreferencesFormService>
  > = Effect.gen(function* makeConnectionPreferencesInfoTabService() {
    const connectionPreferencesFormService = yield* ConnectionPreferencesFormService;

    return new ConnectionPreferencesInfoTabServiceImpl(connectionPreferencesFormService);
  });
  static readonly layer: Layer.Layer<
    ConnectionPreferencesInfoTabServiceDI,
    never,
    Context.Service.Identifier<typeof ConnectionPreferencesFormService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionPreferencesInfoTabService = ConnectionPreferencesInfoTabServiceDI;

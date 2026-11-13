/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { type DataTransferDefaultExportSettings, GraphQLService } from '@cloudbeaver/core-sdk';

export class DefaultExportOutputSettingsResourceImpl extends CachedDataResource<DataTransferDefaultExportSettings | null> {
  constructor(private readonly graphQLService: GraphQLService) {
    super(() => null);
  }

  async loader() {
    return (await this.graphQLService.sdk.getDataTransferDefaultParameters()).settings;
  }
}

export type DefaultExportOutputSettingsResource = DefaultExportOutputSettingsResourceImpl;

export class DefaultExportOutputSettingsResourceDI extends Context.Service<
  DefaultExportOutputSettingsResourceDI,
  DefaultExportOutputSettingsResourceImpl
>()('@cloudbeaver/plugin-data-export/Dialog/DefaultExportOutputSettingsResource#DefaultExportOutputSettingsResource') {
  static readonly implementation = DefaultExportOutputSettingsResourceImpl;

  static readonly dependencies = () => [GraphQLService] as const;
  static readonly make: Effect.Effect<DefaultExportOutputSettingsResourceImpl, never, Context.Service.Identifier<typeof GraphQLService>> = Effect.gen(
    function* makeDefaultExportOutputSettingsResource() {
      const graphQLService = yield* GraphQLService;

      return new DefaultExportOutputSettingsResourceImpl(graphQLService);
    },
  );
  static readonly layer: Layer.Layer<DefaultExportOutputSettingsResourceDI, never, Context.Service.Identifier<typeof GraphQLService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DefaultExportOutputSettingsResource = DefaultExportOutputSettingsResourceDI;

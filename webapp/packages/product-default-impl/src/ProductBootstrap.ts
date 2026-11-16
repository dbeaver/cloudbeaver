/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

const UpdateInstruction = importLazyComponent(() => import('./UpdateInstruction.js').then(m => m.UpdateInstruction));

export class ProductBootstrapImpl extends Bootstrap {
  constructor(private readonly versionUpdateService: VersionUpdateService) {
    super();
  }

  override register() {
    this.versionUpdateService.registerVersionInstruction(() => UpdateInstruction);
  }
}

export type ProductBootstrap = ProductBootstrapImpl;

export class ProductBootstrapDI extends Context.Service<ProductBootstrapDI, ProductBootstrapImpl>()(
  '@cloudbeaver/product-default-impl/ProductBootstrap#ProductBootstrap',
) {
  static readonly implementation = ProductBootstrapImpl;

  static readonly dependencies = () => [VersionUpdateService] as const;
  static readonly make: Effect.Effect<ProductBootstrapImpl, never, Context.Service.Identifier<typeof VersionUpdateService>> = Effect.gen(
    function* makeProductBootstrap() {
      const versionUpdateService = yield* VersionUpdateService;

      return new ProductBootstrapImpl(versionUpdateService);
    },
  );
  static readonly layer: Layer.Layer<ProductBootstrapDI, never, Context.Service.Identifier<typeof VersionUpdateService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ProductBootstrap = ProductBootstrapDI;

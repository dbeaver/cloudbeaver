/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Fill, PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

export class AdministrationTopAppBarServiceImpl {
  readonly navBarPlaceholder = new PlaceholderContainer();
  readonly placeholder = new PlaceholderContainer();

  constructor() {
    this.placeholder.add(Fill, 3);
  }
}

export type AdministrationTopAppBarService = AdministrationTopAppBarServiceImpl;

export class AdministrationTopAppBarServiceDI extends Context.Service<AdministrationTopAppBarServiceDI, AdministrationTopAppBarServiceImpl>()(
  '@cloudbeaver/plugin-administration/AdministrationScreen/AdministrationTopAppBar/AdministrationTopAppBarService#AdministrationTopAppBarService',
) {
  static readonly implementation = AdministrationTopAppBarServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<AdministrationTopAppBarServiceImpl, never, never> = Effect.sync(() => new AdministrationTopAppBarServiceImpl());
  static readonly layer: Layer.Layer<AdministrationTopAppBarServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AdministrationTopAppBarService = AdministrationTopAppBarServiceDI;

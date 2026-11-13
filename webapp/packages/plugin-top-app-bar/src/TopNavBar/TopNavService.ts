/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Fill, PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { AppStateMenu } from './AppStateMenu/AppStateMenu.js';
import { MainMenu } from './MainMenu/MainMenu.js';

export class TopNavServiceImpl {
  readonly placeholder = new PlaceholderContainer();

  constructor() {
    this.placeholder.add(MainMenu, 1);
    this.placeholder.add(Fill, 3);
    this.placeholder.add(AppStateMenu);
  }
}

export type TopNavService = TopNavServiceImpl;

export class TopNavServiceDI extends Context.Service<TopNavServiceDI, TopNavServiceImpl>()(
  '@cloudbeaver/plugin-top-app-bar/TopNavBar/TopNavService#TopNavService',
) {
  static readonly implementation = TopNavServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<TopNavServiceImpl, never, never> = Effect.sync(() => new TopNavServiceImpl());
  static readonly layer: Layer.Layer<TopNavServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TopNavService = TopNavServiceDI;

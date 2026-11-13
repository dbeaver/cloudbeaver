/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { SettingsResolverSource } from './SettingsResolverSource.js';

export class SettingsResolverServiceImpl extends SettingsResolverSource {
  constructor() {
    super();
  }
}

export type SettingsResolverService = SettingsResolverServiceImpl;

export class SettingsResolverServiceDI extends Context.Service<SettingsResolverServiceDI, SettingsResolverServiceImpl>()(
  '@cloudbeaver/core-settings/SettingsResolverService#SettingsResolverService',
) {
  static readonly implementation = SettingsResolverServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<SettingsResolverServiceImpl, never, never> = Effect.sync(() => new SettingsResolverServiceImpl());
  static readonly layer: Layer.Layer<SettingsResolverServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SettingsResolverService = SettingsResolverServiceDI;

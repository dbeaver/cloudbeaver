/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

export class SupportServiceImpl {
  supportInstruction: (() => React.FC) | null;

  constructor() {
    this.supportInstruction = null;
  }

  registerSupportInstruction(componentGetter: (() => React.FC) | null): void {
    this.supportInstruction = componentGetter;
  }
}

export type SupportService = SupportServiceImpl;

export class SupportServiceDI extends Context.Service<SupportServiceDI, SupportServiceImpl>()(
  '@cloudbeaver/core-support/SupportService#SupportService',
) {
  static readonly implementation = SupportServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<SupportServiceImpl, never, never> = Effect.sync(() => new SupportServiceImpl());
  static readonly layer: Layer.Layer<SupportServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SupportService = SupportServiceDI;

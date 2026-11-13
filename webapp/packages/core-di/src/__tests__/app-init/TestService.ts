/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Effect, Layer, disposeService } from '../../Service.js';

export class TestServiceImpl {
  sum(a: number, b: number): number {
    return a + b;
  }
}

export type TestService = TestServiceImpl;

export class TestServiceDI extends Context.Service<TestServiceDI, TestServiceImpl>()(
  '@cloudbeaver/core-di/__tests__/app-init/TestService#TestService',
) {
  static readonly implementation = TestServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<TestServiceImpl, never, never> = Effect.sync(() => new TestServiceImpl());
  static readonly layer: Layer.Layer<TestServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TestService = TestServiceDI;

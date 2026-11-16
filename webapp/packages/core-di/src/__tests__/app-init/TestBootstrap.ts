/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap } from '../../Bootstrap.js';

import { Context, Effect, Layer, disposeService } from '../../Service.js';
import { TestService } from './TestService.js';

export class TestBootstrapImpl extends Bootstrap {
  loaded: boolean;
  registered: boolean;
  sum: number;

  constructor(readonly testService: TestService) {
    super();
    this.loaded = false;
    this.registered = false;
    this.sum = 0;
  }

  override register(): void {
    this.registered = true;
  }

  override async load(): Promise<void> {
    await new Promise(resolve => {
      this.sum = this.testService.sum(1, 2);
      this.loaded = true;
      resolve(undefined);
    });
  }
}

export type TestBootstrap = TestBootstrapImpl;

export class TestBootstrapDI extends Context.Service<TestBootstrapDI, TestBootstrapImpl>()(
  '@cloudbeaver/core-di/__tests__/app-init/TestBootstrap#TestBootstrap',
) {
  static readonly implementation = TestBootstrapImpl;

  static readonly dependencies = () => [TestService] as const;
  static readonly make: Effect.Effect<TestBootstrapImpl, never, Context.Service.Identifier<typeof TestService>> = Effect.gen(
    function* makeTestBootstrap() {
      const testService = yield* TestService;

      return new TestBootstrapImpl(testService);
    },
  );
  static readonly layer: Layer.Layer<TestBootstrapDI, never, Context.Service.Identifier<typeof TestService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TestBootstrap = TestBootstrapDI;

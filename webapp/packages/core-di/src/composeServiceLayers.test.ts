/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { expect, it } from 'vitest';

import { composeServiceLayers } from './composeServiceLayers.js';
import { Context, Effect, Layer, type ServiceType } from './Service.js';

it('reports a circular graph before acquiring either layer', () => {
  let acquired = false;

  class First extends Context.Service<First, object>()('test/cycle/first') {
    static readonly dependencies = (): readonly ServiceType[] => [Second];
    static readonly layer = Layer.effect(
      this,
      Effect.sync(() => {
        acquired = true;
        return {};
      }),
    );
  }

  class Second extends Context.Service<Second, object>()('test/cycle/second') {
    static readonly dependencies = (): readonly ServiceType[] => [First];
    static readonly layer = Layer.succeed(this, {});
  }

  const definitions = new Map<string, ServiceType>([
    [First.key, First],
    [Second.key, Second],
  ]);

  expect(() => composeServiceLayers([First], definitions)).toThrow('test/cycle/first → test/cycle/second → test/cycle/first');
  expect(acquired).toBe(false);
});

it('keeps equally named services in different module namespaces distinct', async () => {
  class First extends Context.Service<First, number>()('test/module-one/LocaleService') {
    static readonly layer = Layer.succeed(this, 1);
  }

  class Second extends Context.Service<Second, number>()('test/module-two/LocaleService') {
    static readonly layer = Layer.succeed(this, 2);
  }

  const definitions = new Map<string, ServiceType>([
    [First.key, First],
    [Second.key, Second],
  ]);

  const layer = composeServiceLayers([First, Second], definitions);

  const values = await Effect.runPromise(
    Effect.gen(function* readNamedServices() {
      return [yield* First, yield* Second];
    }).pipe(Effect.provide(layer)),
  );

  expect(values).toEqual([1, 2]);
});

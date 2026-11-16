/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { cleanup, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, expect, it } from 'vitest';

import { EffectServiceProvider } from './EffectServiceProvider.js';
import { Context, Effect, Layer, ManagedRuntime } from './Service.js';
import { ServiceProvider } from './ServiceProvider.js';
import { useRuntime, useService } from './useService.js';

afterEach(cleanup);

it('reads acquired services in StrictMode without creating or disposing them during React rendering', async () => {
  let created = 0;
  let disposed = 0;

  class Counter extends Context.Service<Counter, { value: number }>()('test/react/counter') {
    static readonly layer = Layer.effect(
      this,
      Effect.acquireRelease(
        Effect.sync(() => ({ value: ++created })),
        () =>
          Effect.sync(() => {
            disposed++;
          }),
      ),
    );
  }

  const runtime = ManagedRuntime.make(Counter.layer);
  const provider = new EffectServiceProvider();
  provider.setRuntime(runtime, await runtime.context());

  function Consumer() {
    const counter = useService(Counter);
    expect(useRuntime()).toBe(provider);

    return <span>{counter.value}</span>;
  }

  try {
    const view = render(
      <StrictMode>
        <ServiceProvider provider={provider}>
          <Consumer />
        </ServiceProvider>
      </StrictMode>,
    );

    expect(screen.getByText('1').textContent).toBe('1');
    expect(created).toBe(1);
    view.unmount();
    expect(disposed).toBe(0);
  } finally {
    await runtime.dispose();
  }

  expect(disposed).toBe(1);
});

it('switches the service context when the application provider changes', () => {
  class Name extends Context.Service<Name, string>()('test/react/name') {}

  const first = new EffectServiceProvider(undefined, Context.make(Name, 'first'));
  const second = new EffectServiceProvider(undefined, Context.make(Name, 'second'));

  function Consumer() {
    return <span>{useService(Name)}</span>;
  }

  const view = render(
    <ServiceProvider provider={first}>
      <Consumer />
    </ServiceProvider>,
  );

  expect(screen.getByText('first').textContent).toBe('first');

  view.rerender(
    <ServiceProvider provider={second}>
      <Consumer />
    </ServiceProvider>,
  );

  expect(screen.getByText('second').textContent).toBe('second');
});

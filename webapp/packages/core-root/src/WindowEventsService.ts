/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';

export class WindowEventsServiceImpl extends Bootstrap {
  readonly onFocusChange: IExecutor<boolean>;

  constructor() {
    super();
    this.onFocusChange = new Executor();
  }

  override register(): void {
    window.addEventListener('focus', () => this.onFocusChange.execute(true));
    window.addEventListener('blur', () => this.onFocusChange.execute(false));
  }
}

export type WindowEventsService = WindowEventsServiceImpl;

export class WindowEventsServiceDI extends Context.Service<WindowEventsServiceDI, WindowEventsServiceImpl>()(
  '@cloudbeaver/core-root/WindowEventsService#WindowEventsService',
) {
  static readonly implementation = WindowEventsServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<WindowEventsServiceImpl, never, never> = Effect.sync(() => new WindowEventsServiceImpl());
  static readonly layer: Layer.Layer<WindowEventsServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const WindowEventsService = WindowEventsServiceDI;

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import type { IAction } from '../../Action/IAction.js';
import type { IKeyBindingHandler, IKeyBindingHandlerOptions } from './IKeyBindingHandler.js';

export class KeyBindingServiceImpl {
  private readonly handlers: Map<string, IKeyBindingHandler>;

  constructor() {
    this.handlers = new Map();
  }

  addKeyBindingHandler(handler: IKeyBindingHandlerOptions): void {
    if (this.handlers.has(handler.id)) {
      throw new Error(`Key binding handler with same id (${handler.id}) already exists`);
    }

    this.handlers.set(handler.id, {
      ...handler,
      actions: new Set(handler.actions),
      contexts: new Set(handler.contexts),
    });
  }

  getKeyBindingHandler(contexts: IDataContextProvider, action: IAction): IKeyBindingHandler | null {
    handlers: for (const handler of this.handlers.values()) {
      if (handler.actions.size > 0 && !handler.actions.has(action)) {
        continue;
      }

      if (handler.contexts.size > 0) {
        for (const context of handler.contexts) {
          if (!contexts.has(context)) {
            continue handlers;
          }
        }
      }

      if (handler.isBindingApplicable?.(contexts, action) !== false) {
        return handler;
      }
    }

    return null;
  }
}

export type KeyBindingService = KeyBindingServiceImpl;

export class KeyBindingServiceDI extends Context.Service<KeyBindingServiceDI, KeyBindingServiceImpl>()(
  '@cloudbeaver/core-view/Action/KeyBinding/KeyBindingService#KeyBindingService',
) {
  static readonly implementation = KeyBindingServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<KeyBindingServiceImpl, never, never> = Effect.sync(() => new KeyBindingServiceImpl());
  static readonly layer: Layer.Layer<KeyBindingServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const KeyBindingService = KeyBindingServiceDI;

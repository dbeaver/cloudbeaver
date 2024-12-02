/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { injectable } from '@cloudbeaver/core-di';

import type { IAction } from '../../Action/IAction.js';
import type { IKeyBindingHandler, IKeyBindingHandlerOptions } from './IKeyBindingHandler.js';

@injectable()
export class KeyBindingService {
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

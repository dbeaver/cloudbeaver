/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import { DATA_CONTEXT_MENU } from '../Menu/DATA_CONTEXT_MENU.js';
import { ActionItem } from './ActionItem.js';
import type { IAction } from './IAction.js';
import type { IActionHandler, IActionHandlerOptions } from './IActionHandler.js';
import type { IActionItem } from './IActionItem.js';
import { KeyBindingService } from './KeyBinding/KeyBindingService.js';

export class ActionServiceImpl {
  private readonly handlers: Map<string, IActionHandler>;

  constructor(private readonly keyBindingService: KeyBindingService) {
    this.handlers = new Map();
  }

  activateAction(context: IDataContextProvider, action: IAction) {
    this.getAction(context, action)?.activate();
  }

  addHandler(handler: IActionHandlerOptions): void {
    if (this.handlers.has(handler.id)) {
      throw new Error(`Action handler with same id (${handler.id}) already exists`);
    }

    this.handlers.set(handler.id, {
      ...handler,
      menus: new Set(handler.menus),
      actions: new Set(handler.actions),
      contexts: new Set(handler.contexts),
    });
  }

  getHandler(contexts: IDataContextProvider, action: IAction): IActionHandler | null {
    handlers: for (const handler of this.handlers.values()) {
      if (handler.actions.size > 0) {
        if (!handler.actions.has(action)) {
          continue;
        }
      }

      if (handler.contexts.size > 0) {
        for (const context of handler.contexts) {
          if (!contexts.has(context)) {
            continue handlers;
          }
        }
      }

      const menu = contexts.getOwn(DATA_CONTEXT_MENU);

      if (handler.menus.size > 0) {
        if (!isNotNullDefined(menu) || !handler.menus.has(menu)) {
          continue;
        }
      }

      if (handler.isActionApplicable?.(contexts, action) !== false) {
        return handler;
      }
    }

    return null;
  }

  getAction(context: IDataContextProvider, action: IAction): IActionItem | null {
    const handler = this.getHandler(context, action);

    if (handler) {
      const binding = this.keyBindingService.getKeyBindingHandler(context, action);

      return new ActionItem(action, handler, binding, context);
    }

    return null;
  }
}

export type ActionService = ActionServiceImpl;

export class ActionServiceDI extends Context.Service<ActionServiceDI, ActionServiceImpl>()(
  '@cloudbeaver/core-view/Action/ActionService#ActionService',
) {
  static readonly implementation = ActionServiceImpl;

  static readonly dependencies = () => [KeyBindingService] as const;
  static readonly make: Effect.Effect<ActionServiceImpl, never, Context.Service.Identifier<typeof KeyBindingService>> = Effect.gen(
    function* makeActionService() {
      const keyBindingService = yield* KeyBindingService;

      return new ActionServiceImpl(keyBindingService);
    },
  );
  static readonly layer: Layer.Layer<ActionServiceDI, never, Context.Service.Identifier<typeof KeyBindingService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ActionService = ActionServiceDI;

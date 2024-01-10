/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { injectable } from '@cloudbeaver/core-di';

import { ActionItem } from './ActionItem';
import type { IAction } from './IAction';
import type { IActionHandler } from './IActionHandler';
import type { IActionItem } from './IActionItem';
import { KeyBindingService } from './KeyBinding/KeyBindingService';

@injectable()
export class ActionService {
  private readonly handlers: Map<string, IActionHandler>;

  constructor(private readonly keyBindingService: KeyBindingService) {
    this.handlers = new Map();
  }

  activateAction(context: IDataContextProvider, action: IAction) {
    this.getAction(context, action)?.activate();
  }

  addHandler(handler: IActionHandler): void {
    if (this.handlers.has(handler.id)) {
      throw new Error(`Action handler with same id (${handler.id}) already exists`);
    }
    this.handlers.set(handler.id, handler);
  }

  getHandler(context: IDataContextProvider, action: IAction): IActionHandler | null {
    for (const handler of this.handlers.values()) {
      if (handler.isActionApplicable(context, action)) {
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

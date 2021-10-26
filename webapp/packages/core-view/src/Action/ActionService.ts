/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import type { IViewContext } from '../View/IViewContext';
import { ActionItem } from './ActionItem';
import type { IAction } from './IAction';
import type { IActionHandler } from './IActionHandler';
import type { IActionItem } from './IActionItem';
import { KeyBindingService } from './KeyBinding/KeyBindingService';

@injectable()
export class ActionService {
  private handlers: Map<string, IActionHandler>;

  constructor(
    private readonly keyBindingService: KeyBindingService
  ) {
    this.handlers = new Map();
  }

  getHandler(context: IViewContext, action: IAction): IActionHandler | null {
    for (const handler of this.handlers.values()) {
      if (handler.isActionApplicable(context, action)) {
        return handler;
      }
    }

    return null;
  }

  getAction(context: IViewContext, action: IAction): IActionItem | null {
    const handler = this.getHandler(context, action);

    if (handler) {
      const binding = this.keyBindingService.getKeyBindingHandler(context, action);

      return new ActionItem(
        action,
        handler,
        binding,
        context
      );
    }

    return null;
  }
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IViewContext } from '../View/IViewContext';
import type { IAction } from './IAction';
import type { IActionHandler } from './IActionHandler';
import type { IActionItem } from './IActionItem';
import type { IKeyBindingHandler } from './KeyBinding/IKeyBindingHandler';

export class ActionItem implements IActionItem {
  readonly action: IAction;
  readonly handler: IActionHandler;
  readonly binding: IKeyBindingHandler | null;
  private context: IViewContext;

  constructor(
    action: IAction,
    handler: IActionHandler,
    binding: IKeyBindingHandler | null,
    context: IViewContext
  ) {
    this.action = action;
    this.handler = handler;
    this.binding = binding;
    this.context = context;
  }

  activate(binding?: boolean | undefined): void {
    if (binding) {
      this.binding?.handler(this.context, this.action);
    }
  }
}

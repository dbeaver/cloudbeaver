/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { flat } from '@cloudbeaver/core-utils';

import type { IAction } from './IAction.js';
import type { IActionHandler } from './IActionHandler.js';
import type { IActionInfo } from './IActionInfo.js';
import type { IActionItem } from './IActionItem.js';
import type { IKeyBindingHandler } from './KeyBinding/IKeyBindingHandler.js';

export class ActionItem implements IActionItem {
  readonly action: IAction;
  readonly handler: IActionHandler;
  readonly binding: IKeyBindingHandler | null;
  private readonly context: IDataContextProvider;

  get actionInfo(): IActionInfo {
    if (this.handler.getActionInfo) {
      return this.handler.getActionInfo(this.context, this.action);
    }

    return this.action.info;
  }

  constructor(action: IAction, handler: IActionHandler, binding: IKeyBindingHandler | null, context: IDataContextProvider) {
    this.action = action;
    this.handler = handler;
    this.binding = binding;
    this.context = context;
  }

  isChecked(): boolean {
    return this.handler.isChecked?.(this.context, this.action) ?? false;
  }

  isLoading(): boolean {
    return (
      this.handler.isLoading?.(this.context, this.action) ||
      flat([this.handler.getLoader?.(this.context, this.action)]).some(loader => loader?.isLoading())
    );
  }

  isDisabled(): boolean {
    return this.handler.isDisabled?.(this.context, this.action) ?? false;
  }

  isHidden(): boolean {
    return this.handler.isHidden?.(this.context, this.action) ?? false;
  }

  isLabelVisible(): boolean {
    return this.handler.isLabelVisible?.(this.context, this.action) ?? true;
  }

  activate(binding?: boolean | undefined): void {
    if (binding) {
      this.binding?.handler(this.context, this.action);
    } else {
      this.handler.handler(this.context, this.action);
    }
  }
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IDataContextProvider } from '../DataContext/IDataContextProvider';
import type { IAction } from './IAction';
import type { IActionHandler } from './IActionHandler';
import type { IActionInfo } from './IActionInfo';
import type { IActionItem } from './IActionItem';
import type { IKeyBindingHandler } from './KeyBinding/IKeyBindingHandler';

export class ActionItem implements IActionItem {
  readonly action: IAction;
  readonly handler: IActionHandler;
  readonly binding: IKeyBindingHandler | null;
  private context: IDataContextProvider;

  get actionInfo(): IActionInfo {
    if (this.handler.getActionInfo) {
      return this.handler.getActionInfo(this.context, this.action);
    }

    return this.action.info;
  }

  constructor(
    action: IAction,
    handler: IActionHandler,
    binding: IKeyBindingHandler | null,
    context: IDataContextProvider
  ) {
    this.action = action;
    this.handler = handler;
    this.binding = binding;
    this.context = context;
  }

  isChecked(): boolean {
    return this.handler.isChecked?.(this.context, this.action) ?? false;
  }

  isLoading(): boolean {
    return this.handler.isLoading?.(this.context, this.action) ?? false;
  }

  isDisabled(): boolean {
    return this.handler.isDisabled?.(this.context, this.action) ?? false;
  }

  isHidden(): boolean {
    return this.handler.isHidden?.(this.context, this.action) ?? false;
  }

  activate(binding?: boolean | undefined): void {
    if (binding) {
      this.binding?.handler(this.context, this.action);
    } else {
      this.handler.handler(this.context, this.action);
    }
  }
}

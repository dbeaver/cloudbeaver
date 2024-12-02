/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IAction } from './IAction.js';
import type { IActionHandler } from './IActionHandler.js';
import type { IActionInfo } from './IActionInfo.js';
import type { IKeyBindingHandler } from './KeyBinding/IKeyBindingHandler.js';

export interface IActionItem {
  action: IAction;
  actionInfo: IActionInfo;
  handler: IActionHandler;
  binding: IKeyBindingHandler | null;

  isHidden: () => boolean;
  isDisabled: () => boolean;
  isChecked: () => boolean;
  isLoading: () => boolean;

  /** @deprecated must be refactored (#1)*/
  isLabelVisible: () => boolean;

  activate: (binding?: boolean) => void;
}

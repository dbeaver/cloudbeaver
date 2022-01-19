/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IAction } from './IAction';
import type { IActionHandler } from './IActionHandler';
import type { IActionInfo } from './IActionInfo';
import type { IKeyBindingHandler } from './KeyBinding/IKeyBindingHandler';

export interface IActionItem {
  action: IAction;
  actionInfo: IActionInfo;
  handler: IActionHandler;
  binding: IKeyBindingHandler | null;

  isHidden: () => boolean;
  isDisabled: () => boolean;
  isChecked: () => boolean;
  isLoading: () => boolean;

  activate: (binding?: boolean) => void;
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IAction } from '../Action/IAction.js';

export interface IMenuInfo {
  label: string;
  icon?: string;
  tooltip?: string;
  /**
   * experimental, can be changed
   */
  action?: IAction;
  /**
   * experimental, can be changed
   */
  group?: boolean;
}

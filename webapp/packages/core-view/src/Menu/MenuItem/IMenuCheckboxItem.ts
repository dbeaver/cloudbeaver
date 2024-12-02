/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IMenuItem } from './IMenuItem.js';

interface IMenuCheckboxItemCommonProperties {
  checked?: boolean;
  label?: string;
  tooltip?: string;
  hidden?: boolean;
  disabled?: boolean;
}

export interface IMenuCheckboxItemOptions extends IMenuCheckboxItemCommonProperties {
  id: string;
  label: string;
}

export interface IMenuCheckboxItem extends IMenuItem, IMenuCheckboxItemCommonProperties {
  label: string;
}

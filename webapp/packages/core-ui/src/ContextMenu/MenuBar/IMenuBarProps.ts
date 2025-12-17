/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IMenuData } from '@cloudbeaver/core-view';

export interface IMenuBarProps extends React.HTMLAttributes<HTMLDivElement> {
  menu: IMenuData;
  compact?: boolean;
  rtl?: boolean;
  ref?: React.ForwardedRef<HTMLDivElement>;
}

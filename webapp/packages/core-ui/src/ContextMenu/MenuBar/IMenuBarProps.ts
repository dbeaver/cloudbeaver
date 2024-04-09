/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { MenuInitialState } from 'reakit';

import type { IMenuData } from '@cloudbeaver/core-view';

export interface IMenuBarNestedMenuSettings extends MenuInitialState {
  onVisibleSwitch?: (visible: boolean) => void;
}

export interface IMenuBarProps extends React.HTMLAttributes<HTMLDivElement> {
  menu: IMenuData;
  nestedMenuSettings?: IMenuBarNestedMenuSettings;
  rtl?: boolean;
}

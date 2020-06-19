/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ReactElement } from 'react';

export interface ITab {
  tabId: string;
  title: string;
  icon?: string;

  onClose?(): void;
  onActivate(): void;

  panel: () => ReactElement | null;
}

export interface ITabContainer {
  tabs: ITab[];
  currentTabId: string | null;
}

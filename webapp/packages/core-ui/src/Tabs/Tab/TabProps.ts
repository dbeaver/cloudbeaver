/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PropsWithChildren } from 'react';

import type { IDataContext } from '@cloudbeaver/core-data-context';

import type { ITabData } from '../TabsContainer/ITabsContainer.js';

export type TabProps = PropsWithChildren<{
  tabId: string;
  title?: string;
  menuContext?: IDataContext;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  after?: React.ReactElement;
  onOpen?: (tab: ITabData<any>) => void;
  onClose?: (tab: ITabData<any>) => void;
  onClick?: (tabId: string) => void;
}>;

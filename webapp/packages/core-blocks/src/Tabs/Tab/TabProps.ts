/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PropsWithChildren } from 'react';

import { DynamicStyle } from '@cloudbeaver/core-theming';

import { ITabData } from '../TabsContext';

export type TabProps = PropsWithChildren<{
  tabId: string;
  disabled?: boolean;
  className?: string;
  style?: DynamicStyle[] | DynamicStyle;
  onOpen?: (tab: ITabData<any>) => void;
  onClose?: (tab: ITabData<any>) => void;
}>;

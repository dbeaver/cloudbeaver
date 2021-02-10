/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import type { ITab } from '@cloudbeaver/core-app';
import type { Style } from '@cloudbeaver/core-theming';

import type { IObjectViewerTabState } from '../IObjectViewerTabState';
import type { ObjectPage } from './ObjectPage';

export interface DBObjectPageTabProps {
  tab: ITab<IObjectViewerTabState>;
  page: ObjectPage;
  onSelect: (tab: ITab<IObjectViewerTabState>, page: ObjectPage) => void;
  style: Style[];
}

export const DBObjectPageTab = observer(function DBObjectPageTab({
  tab, page, onSelect, style,
}: DBObjectPageTabProps) {
  const handleSelect = useCallback(() => onSelect(tab, page), [tab, page, onSelect]);
  const TabComponent = page.getTabComponent();
  return <TabComponent tab={tab} page={page} style={style} onSelect={handleSelect} />;
});

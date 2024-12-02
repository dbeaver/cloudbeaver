/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import type { ITab } from '@cloudbeaver/plugin-navigation-tabs';

import type { IObjectViewerTabState } from '../IObjectViewerTabState.js';
import type { ObjectPage } from './ObjectPage.js';

interface IProps {
  tab: ITab<IObjectViewerTabState>;
  page: ObjectPage;
  onSelect: (tab: ITab<IObjectViewerTabState>, page: ObjectPage) => void;
}

export const DBObjectPageTab = observer<IProps>(function DBObjectPageTab({ tab, page, onSelect }) {
  const handleSelect = useCallback(() => onSelect(tab, page), [tab, page, onSelect]);
  const TabComponent = page.getTabComponent();
  return <TabComponent tab={tab} page={page} onSelect={handleSelect} />;
});

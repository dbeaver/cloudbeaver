/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';

import { clsx, IconButton } from '@dbeaver/ui-kit';

import { useTranslate, Icon } from '@cloudbeaver/core-blocks';
import { useCaptureViewContext } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_NAV_TREE_ROOT } from '../NavigationTree/ElementsTree/ElementsTreeTools/NavigationTreeSettings/DATA_CONTEXT_NAV_TREE_ROOT.js';
import { DATA_CONTEXT_TREE_TOOLBAR } from './DATA_CONTEXT_TREE_TOOLBAR.js';
import type { ITreeToolbar } from './ITreeToolbar.js';
import { TreeToolbarFilter } from './TreeToolbarFilter.js';
import { TreeToolbarMenu } from './TreeToolbarMenu.js';

interface TreeToolbarProps {
  toolbar: ITreeToolbar;
}

export const TreeToolbar = observer<React.PropsWithChildren<TreeToolbarProps>>(function TreeToolbar({ toolbar, children }) {
  const { treeData, settings, treeFilter, disabled, onRefresh, className } = toolbar;
  const translate = useTranslate();
  const [refreshing, setRefreshing] = useState(false);

  useCaptureViewContext((context, id) => {
    context.set(DATA_CONTEXT_NAV_TREE_ROOT, treeData.rootId, id);
    context.set(DATA_CONTEXT_TREE_TOOLBAR, toolbar, id);
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        await treeData.load(treeData.rootId, true);
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className={clsx('tw:theme-background-surface tw:px-2', className)}>
      <div className="tw:flex tw:flex-row tw:overflow-x-auto tw:justify-end tw:items-center tw:h-7 tw:px-1 tw:shrink-0">
        <TreeToolbarMenu toolbar={toolbar} />
        <IconButton
          size="small"
          disabled={disabled || refreshing}
          className={clsx('tw:theme-text-primary', refreshing && 'tw:animate-spin')}
          aria-label={translate('ui_refresh')}
          title={translate('ui_refresh')}
          onClick={handleRefresh}
        >
          <Icon width={16} height={16} name="/icons/refresh_sm.svg" viewBox="0 0 16 16" />
        </IconButton>
      </div>
      <TreeToolbarFilter filter={treeFilter} filterEnabled={settings?.filter} />
      {children}
    </div>
  );
});

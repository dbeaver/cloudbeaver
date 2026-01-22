/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Button, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { CachedResourceOffsetPageKey, CachedResourceOffsetPageTargetKey, getNextPageOffset } from '@cloudbeaver/core-resource';

import type { NavigationNodeRendererComponent } from '../NavigationNodeComponent.js';
import { NAVIGATION_TREE_LIMIT } from './elementsTreeLimitFilter.js';

export function elementsTreeLimitRenderer(nodeId: string): NavigationNodeRendererComponent | undefined {
  if (nodeId === NAVIGATION_TREE_LIMIT.limit) {
    return NavTreeLimitMessage;
  }

  return;
}

const NavTreeLimitMessage: NavigationNodeRendererComponent = observer(function NavTreeLimitMessage({ path }) {
  const translate = useTranslate();
  const navTreeResource = useService(NavTreeResource);
  const limit = navTreeResource.childrenLimit;


  async function loadMore() {
    const parentNodeId = path[path.length - 1];
    const pageInfo = navTreeResource.offsetPagination.getPageInfo(
      CachedResourceOffsetPageKey(0, 0).setParent(CachedResourceOffsetPageTargetKey(parentNodeId)),
    );

    if (pageInfo) {
      await navTreeResource.load(
        CachedResourceOffsetPageKey(getNextPageOffset(pageInfo), limit).setParent(CachedResourceOffsetPageTargetKey(parentNodeId)),
      );
    }
  }

  return (
    <div className='tw:px-6 tw:py-1'>
      <Button
        title={translate('app_navigationTree_limited', undefined, { limit: limit })}
        size='small'
        variant='ghost'
        loader
        onClick={loadMore}
      >
        {translate('ui_load_more')}
      </Button>
    </div>
  );
});

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Button, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { CachedResourceOffsetPageKey, CachedResourceOffsetPageTargetKey, getNextPageOffset } from '@cloudbeaver/core-resource';
import type { NodeComponent } from '@cloudbeaver/plugin-navigation-tree';

import { MORE_PREFIX } from './MORE_PREFIX.js';

export const AiScopeMoreNode: NodeComponent = function AiScopeMoreNode({ nodeId }) {
  const translate = useTranslate();
  const navTreeResource = useService(NavTreeResource);
  const notificationService = useService(NotificationService);

  async function loadMore() {
    const parent = CachedResourceOffsetPageTargetKey(nodeId.slice(MORE_PREFIX.length));
    const page = navTreeResource.offsetPagination.getPageInfo(CachedResourceOffsetPageKey(0, 0).setParent(parent));

    if (page) {
      try {
        await navTreeResource.load(CachedResourceOffsetPageKey(getNextPageOffset(page), navTreeResource.childrenLimit).setParent(parent));
      } catch (exception: any) {
        notificationService.logException(exception);
      }
    }
  }

  return (
    <Button type="button" size="small" variant="ghost" loader onClick={loadMore}>
      {translate('ui_load_more')}
    </Button>
  );
};

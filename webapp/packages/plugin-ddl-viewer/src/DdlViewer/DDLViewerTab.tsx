/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { TabIcon, Tab, TabTitle } from '@cloudbeaver/core-ui';
import type { NavNodeTransformViewComponent } from '@cloudbeaver/plugin-navigation-tree';

import { NAV_NODE_DDL_ID } from '../NAV_NODE_DDL_ID.js';

export const DDLViewerTab: NavNodeTransformViewComponent = observer(function DDLViewerTab({ folderId }) {
  const title = folderId.startsWith(NAV_NODE_DDL_ID) ? 'DDL' : 'Body';

  return (
    <Tab tabId={folderId} title={title}>
      <TabIcon icon="/icons/DDL.svg" />
      <TabTitle>{title}</TabTitle>
    </Tab>
  );
});

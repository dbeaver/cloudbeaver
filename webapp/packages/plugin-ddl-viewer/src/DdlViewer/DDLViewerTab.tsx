/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { useStyles } from '@cloudbeaver/core-blocks';
import { Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';
import type { NavNodeTransformViewComponent } from '@cloudbeaver/plugin-navigation-tree';

import { NAV_NODE_DDL_ID } from '../NAV_NODE_DDL_ID';

export const DDLViewerTab: NavNodeTransformViewComponent = observer(function DDLViewerTab({
  folderId,
  style,
}) {
  const title = folderId.startsWith(NAV_NODE_DDL_ID) ? 'DDL' : 'Body';

  return styled(useStyles(style))(
    <Tab tabId={folderId} title='DDL'>
      <TabIcon icon="/icons/DDL.svg" />
      <TabTitle>{title}</TabTitle>
    </Tab>
  );
});

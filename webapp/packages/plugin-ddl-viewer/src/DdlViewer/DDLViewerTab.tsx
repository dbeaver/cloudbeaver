/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';
import { Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';
import type { NavNodeTransformViewComponent } from '@cloudbeaver/plugin-navigation-tree';

export const DDLViewerTab: NavNodeTransformViewComponent = observer(function DDLViewerTab({
  folderId,
  style,
}) {
  return styled(useStyles(style))(
    <Tab tabId={folderId} title='DDL'>
      <TabIcon icon="/icons/DDL.svg" />
      <TabTitle>DDL</TabTitle>
    </Tab>
  );
});

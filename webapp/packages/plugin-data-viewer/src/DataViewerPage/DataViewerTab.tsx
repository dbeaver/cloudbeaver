/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { NavNodeManagerService } from '@cloudbeaver/core-app';
import { TabIcon, Tab, TabTitle } from '@cloudbeaver/core-ui';
import { useService } from '@cloudbeaver/core-di';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import type { ObjectPageTabComponent } from '@cloudbeaver/plugin-object-viewer';

import type { IDataViewerPageState } from '../IDataViewerPageState';

export const DataViewerTab: ObjectPageTabComponent<IDataViewerPageState> = observer(function DataViewerTab({
  tab, page, onSelect, style,
}) {
  const styles = useStyles(style);
  const navNodeManagerService = useService(NavNodeManagerService);

  if (!navNodeManagerService.isNodeHasData(tab.handlerState.objectId)) {
    return null;
  }

  return styled(styles)(
    <Tab tabId={page.key} style={style} onOpen={onSelect}>
      <TabIcon icon='table-icon' />
      <TabTitle><Translate token='data_viewer_tab_title' /></TabTitle>
    </Tab>
  );
});

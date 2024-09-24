/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Translate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';
import type { ObjectPageTabComponent } from '@cloudbeaver/plugin-object-viewer';

import type { IDataViewerPageState } from '../IDataViewerPageState.js';

export const DataViewerTab: ObjectPageTabComponent<IDataViewerPageState> = observer(function DataViewerTab({ tab, page, onSelect }) {
  const navNodeManagerService = useService(NavNodeManagerService);

  if (!navNodeManagerService.isNodeHasData(tab.handlerState.objectId)) {
    return null;
  }

  return (
    <Tab tabId={page.key} onOpen={onSelect}>
      <TabIcon icon="table-icon" />
      <TabTitle>
        <Translate token="data_viewer_tab_title" />
      </TabTitle>
    </Tab>
  );
});

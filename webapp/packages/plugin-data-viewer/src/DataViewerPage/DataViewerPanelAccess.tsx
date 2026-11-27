/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { TextPlaceholder, Translate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { ObjectPagePanelComponent } from '@cloudbeaver/plugin-object-viewer';

import { DataViewerService } from '../DataViewerService.js';
import type { IDataViewerPageState } from '../IDataViewerPageState.js';
import { DataViewerPanel } from './DataViewerPanel.js';

export const DataViewerPanelAccess: ObjectPagePanelComponent<IDataViewerPageState> = observer(function DataViewerPanelAccess(props) {
  const dataViewerService = useService(DataViewerService);

  if (!dataViewerService.canReadDataEditor) {
    return (
      <TextPlaceholder>
        <Translate token="root_permission_denied" />
      </TextPlaceholder>
    );
  }

  return <DataViewerPanel {...props} />;
});

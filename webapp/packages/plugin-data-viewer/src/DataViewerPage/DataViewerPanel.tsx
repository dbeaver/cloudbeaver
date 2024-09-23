/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { TextPlaceholder, useAutoLoad, useTranslate } from '@cloudbeaver/core-blocks';
import type { ObjectPagePanelComponent } from '@cloudbeaver/plugin-object-viewer';

import type { IDataViewerPageState } from '../IDataViewerPageState.js';
import { TableViewerLoader } from '../TableViewer/TableViewerLoader.js';
import classes from './DataViewerPanel.module.css';
import { useDataViewerPanel } from './useDataViewerPanel.js';

export const DataViewerPanel: ObjectPagePanelComponent<IDataViewerPageState> = observer(function DataViewerPanel({ tab, page }) {
  const translate = useTranslate();
  const panel = useDataViewerPanel(tab);
  const pageState = page.getState(tab);

  const handlePresentationChange = useCallback(
    (presentationId: string) => {
      const pageState = page.getState(tab);

      if (!pageState) {
        page.setState(tab, {
          presentationId,
          resultIndex: 0,
          valuePresentationId: null,
        });
      } else {
        pageState.presentationId = presentationId;
      }
    },
    [page, tab],
  );

  const handleValuePresentationChange = useCallback(
    (valuePresentationId: string | null) => {
      const pageState = page.getState(tab);

      if (!pageState) {
        page.setState(tab, {
          presentationId: '',
          resultIndex: 0,
          valuePresentationId,
        });
      } else {
        pageState.valuePresentationId = valuePresentationId;
      }
    },
    [page, tab],
  );

  useAutoLoad(DataViewerPanel, panel);

  if (!tab.handlerState.tableId) {
    return <TextPlaceholder>{translate('data_viewer_model_not_loaded')}</TextPlaceholder>;
  }

  return (
    <TableViewerLoader
      className={classes['tableViewerLoader']}
      tableId={tab.handlerState.tableId}
      resultIndex={pageState?.resultIndex}
      presentationId={pageState?.presentationId}
      valuePresentationId={pageState?.valuePresentationId}
      onPresentationChange={handlePresentationChange}
      onValuePresentationChange={handleValuePresentationChange}
    />
  );
});

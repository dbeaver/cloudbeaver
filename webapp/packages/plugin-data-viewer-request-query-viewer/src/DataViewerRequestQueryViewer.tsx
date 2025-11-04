/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { IconOrImage, s, useS, useTranslate, type PlaceholderComponent } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { isResultSetDataSource, type ITableHeaderPlaceholderProps } from '@cloudbeaver/plugin-data-viewer';
import { Button, ButtonIcon } from '@dbeaver/ui-kit';

import { DataViewerRequestQueryViewerDialog } from './DataViewerRequestQueryViewerDialog.js';
import classes from './DataViewerRequestQueryViewer.module.css';

export const DataViewerRequestQueryViewer: PlaceholderComponent<ITableHeaderPlaceholderProps> = observer(function DataViewerRequestQueryViewer({
  model,
  resultIndex,
}) {
  const style = useS(classes);
  const translate = useTranslate();
  const commonDialogService = useService(CommonDialogService);

  if (!isResultSetDataSource(model.source)) {
    throw new Error('DataViewerRequestQueryViewer can be used only with ResultSetDataSource');
  }

  const connectionKey = model.source.options?.connectionKey;

  if (!connectionKey) {
    throw new Error('connectionKey is not provided');
  }

  return (
    <Button
      variant="ghost"
      size="small"
      title={`${translate('plugin_data_viewer_request_query_viewer_description')}\n\n${model.requestInfo.originalQuery}`}
      className={s(style, { button: true }, 'tw:mr-1! tw:shrink-0')}
      disabled={model.isLoading() || model.isDisabled(resultIndex)}
      onClick={() => commonDialogService.open(DataViewerRequestQueryViewerDialog, { query: model.requestInfo.originalQuery, connectionKey })}
    >
      <ButtonIcon placement="start">
        <IconOrImage className="tw:h-4 tw:w-4" icon="sql-script-preview" />
      </ButtonIcon>
      {translate('plugin_data_viewer_request_query_viewer_title')}
    </Button>
  );
});

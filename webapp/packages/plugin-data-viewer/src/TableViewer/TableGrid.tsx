/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { PropsWithChildren } from 'react';
import styled, { css } from 'reshadow';

import { Button } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';

import { DataPresentationService } from '../DataPresentationService';
import { TableViewerModel } from './TableViewerModel';

type TableGridProps = PropsWithChildren<{
  model: TableViewerModel;
}>

const styles = css`
  Spreadsheet, no-data, error {
    flex: 1;
  }
  no-data, error {
    white-space: pre-wrap;
    padding: 16px;
  }
`;

export const TableGrid = observer(function TableGrid({
  model,
}: TableGridProps) {
  const translate = useTranslate();
  const dataPresentationService = useService(DataPresentationService);

  if (model.errorMessage.length > 0) {
    return styled(styles)(
      <error as="div">
        {model.errorMessage}
        <br/><br/>
        {model.hasDetails && (
          <Button type='button' mod={['outlined']} onClick={model.onShowDetails}>
            {translate('ui_errors_details')}
          </Button>
        )}
      </error>
    );
  }

  const Spreadsheet = dataPresentationService.default?.component;

  if ((model.isFullyLoaded && model.isEmpty) || !Spreadsheet) {
    return styled(styles)(<no-data as="div">{translate('data_viewer_nodata_message')}</no-data>);
  }

  return styled(styles)(<Spreadsheet tableModel={model} />);
});

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { TextPlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel';
import type { IDataPresentationOptions } from '../DataPresentationService';
import type { IDataTableActions } from './IDataTableActions';

interface Props {
  model: IDatabaseDataModel<any, any>;
  actions: IDataTableActions;
  dataFormat: ResultDataFormat;
  presentation: IDataPresentationOptions | null;
  resultIndex: number;
  simple: boolean;
}

const styles = css`
  Presentation {
    flex: 1;
    overflow: auto;
  }
`;

export const TableToolsPanel = observer<Props>(function TableToolsPanel({ model, actions, dataFormat, presentation, resultIndex, simple }) {
  const translate = useTranslate();

  const result = model.getResult(resultIndex);

  if (!presentation || (presentation.dataFormat !== undefined && dataFormat !== presentation.dataFormat)) {
    if (model.isLoading()) {
      return null;
    }

    // eslint-disable-next-line react/no-unescaped-entities
    return <TextPlaceholder>Current data can't be displayed by selected presentation</TextPlaceholder>;
  }

  const Presentation = presentation.getPresentationComponent();

  if (result?.loadedFully && !result.data) {
    return <TextPlaceholder>{translate('data_viewer_nodata_message')}</TextPlaceholder>;
  }

  return styled(styles)(<Presentation dataFormat={dataFormat} model={model} actions={actions} resultIndex={resultIndex} simple={simple} />);
});

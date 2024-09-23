/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, TextPlaceholder, useS, useTranslate } from '@cloudbeaver/core-blocks';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel.js';
import type { IDataPresentationOptions } from '../DataPresentationService.js';
import type { IDataTableActions } from './IDataTableActions.js';
import styles from './TableToolsPanel.module.css';

interface Props {
  model: IDatabaseDataModel;
  actions: IDataTableActions;
  dataFormat: ResultDataFormat;
  presentation: IDataPresentationOptions | null;
  resultIndex: number;
  simple: boolean;
}

export const TableToolsPanel = observer<Props>(function TableToolsPanel({ model, actions, dataFormat, presentation, resultIndex, simple }) {
  const translate = useTranslate();
  const style = useS(styles);

  const result = model.source.getResult(resultIndex);

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

  return (
    <Presentation
      className={s(style, { presentation: true })}
      dataFormat={dataFormat}
      model={model}
      actions={actions}
      resultIndex={resultIndex}
      simple={simple}
    />
  );
});

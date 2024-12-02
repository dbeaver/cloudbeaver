/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import type { HTMLAttributes } from 'react';

import { s, TextPlaceholder } from '@cloudbeaver/core-blocks';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel.js';
import type { IDataPresentationOptions } from '../DataPresentationService.js';
import styles from './DataPresentation.module.css';
import type { IDataTableActions } from './IDataTableActions.js';
import { TableStatistics } from './TableStatistics.js';

interface Props extends HTMLAttributes<HTMLDivElement> {
  model: IDatabaseDataModel;
  actions: IDataTableActions;
  dataFormat: ResultDataFormat;
  presentation: IDataPresentationOptions;
  resultIndex: number;
  simple: boolean;
  isStatistics: boolean;
}

export const DataPresentation = observer<Props>(function DataPresentation({
  model,
  actions,
  dataFormat,
  presentation,
  resultIndex,
  simple,
  isStatistics,
  ...rest
}) {
  if ((presentation.dataFormat !== undefined && dataFormat !== presentation.dataFormat) || !model.source.hasResult(resultIndex)) {
    if (model.isLoading()) {
      return null;
    }

    // eslint-disable-next-line react/no-unescaped-entities
    return <TextPlaceholder {...rest}>Current data can't be displayed by selected presentation</TextPlaceholder>;
  }

  const Presentation = presentation.getPresentationComponent();

  if (isStatistics) {
    return <TableStatistics {...rest} model={model} resultIndex={resultIndex} />;
  }

  return (
    <Presentation
      dataFormat={dataFormat}
      model={model}
      actions={actions}
      resultIndex={resultIndex}
      simple={simple}
      className={s(styles, { presentation: true })}
      {...rest}
    />
  );
});

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

import { Button, TextPlaceholder } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DataPresentationOptions } from '../DataPresentationService';
import { DataModelWrapper } from './DataModelWrapper';

type TableGridProps = PropsWithChildren<{
  model: DataModelWrapper; // TODO: change to IDatabaseDataModel<any>
  dataFormat: ResultDataFormat;
  presentation: DataPresentationOptions;
  resultIndex: number;
}>;

const styles = css`
  Presentation, error {
    flex: 1;
    overflow: auto;
  }
  error {
    white-space: pre-wrap;
    padding: 16px;
  }
`;

export const TableGrid = observer(function TableGrid({
  model,
  dataFormat,
  presentation,
  resultIndex,
}: TableGridProps) {
  const depModel = model.getOldModel(resultIndex);
  const translate = useTranslate();

  // TODO: probably must be implemented in presentation component
  if (model.message.length > 0) {
    return styled(styles)(
      <error as="div">
        {model.message}
        <br /><br />
        {model.details && (
          <Button type='button' mod={['outlined']} onClick={model.showDetails}>
            {translate('ui_errors_details')}
          </Button>
        )}
      </error>
    );
  }

  if (dataFormat !== presentation.dataFormat) {
    if (model.isLoading()) {
      return null;
    }

    // eslint-disable-next-line react/no-unescaped-entities
    return <TextPlaceholder>Current data can't be displayed by selected presentation</TextPlaceholder>;
  }

  const Presentation = presentation.getPresentationComponent();

  if ((depModel?.isFullyLoaded && depModel?.isEmpty)) {
    return styled(styles)(<TextPlaceholder>{translate('data_viewer_nodata_message')}</TextPlaceholder>);
  }

  return styled(styles)(<Presentation model={model} resultIndex={resultIndex} />);
});

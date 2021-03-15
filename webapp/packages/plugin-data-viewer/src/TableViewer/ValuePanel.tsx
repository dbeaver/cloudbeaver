/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type { PropsWithChildren } from 'react';
import styled, { css } from 'reshadow';

import { TextPlaceholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DataPresentationService, DataPresentationType } from '../DataPresentationService';
import type { DataModelWrapper } from './DataModelWrapper';

type TableGridProps = PropsWithChildren<{
  model: DataModelWrapper; // TODO: change to IDatabaseDataModel<any>
  dataFormat: ResultDataFormat;
  presentationId: string | null;
  resultIndex: number;
}>;

const styles = css`
  Presentation {
    flex: 1;
    overflow: auto;
  }
`;

export const ValuePanel = observer(function ValuePanel({
  model,
  dataFormat,
  presentationId,
  resultIndex,
}: TableGridProps) {
  const translate = useTranslate();
  const dataPresentationService = useService(DataPresentationService);

  if (!presentationId) {
    return null;
  }

  const presentation = dataPresentationService.getSupported(
    DataPresentationType.value,
    dataFormat,
    presentationId
  );
  const result = model.getResult(resultIndex);

  if (!presentation || dataFormat !== presentation.dataFormat) {
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

  return styled(styles)(
    <Presentation model={model} resultIndex={resultIndex} />
  );
});

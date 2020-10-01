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

import { DataPresentationOptions } from '../DataPresentationService';
import { DataModelWrapper } from './DataModelWrapper';

type TableGridProps = PropsWithChildren<{
  model: DataModelWrapper; // TODO: change to IDatabaseDataModel<any>
  presentation: DataPresentationOptions;
}>

const styles = css`
  Presentation, error {
    flex: 1;
  }
  error {
    white-space: pre-wrap;
    padding: 16px;
  }
`;

export const TableGrid = observer(function TableGrid({
  model,
  presentation,
}: TableGridProps) {
  const translate = useTranslate();

  // TODO: probably must be implemented in presentation component
  if (model.deprecatedModel.errorMessage.length > 0) {
    return styled(styles)(
      <error as="div">
        {model.deprecatedModel.errorMessage}
        <br/><br/>
        {model.deprecatedModel.hasDetails && (
          <Button type='button' mod={['outlined']} onClick={model.deprecatedModel.onShowDetails}>
            {translate('ui_errors_details')}
          </Button>
        )}
      </error>
    );
  }

  const Presentation = presentation.getPresentationComponent();

  if ((model.deprecatedModel.isFullyLoaded && model.deprecatedModel.isEmpty)) {
    return styled(styles)(<TextPlaceholder>{translate('data_viewer_nodata_message')}</TextPlaceholder>);
  }

  return styled(styles)(<Presentation model={model} />);
});

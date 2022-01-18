/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled, { css, use } from 'reshadow';

import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { Button } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { getMIME, isImageFormat, isValidUrl } from '@cloudbeaver/core-utils';

import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import { ResultSetViewAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetViewAction';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';

const styles = css`
  img {
    margin: auto;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;

    &[|stretch] {
      margin: unset;
    }
  }

  container {
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  tools {
    display: flex;
    flex: 0;
    justify-content: flex-end;
    padding-bottom: 16px;
  }

  image {
    flex: 1;
    display: flex;
    overflow: auto;
  }
`;

export const ImageValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(function ImageValuePresentation({
  model,
  resultIndex,
}) {
  const translate = useTranslate();
  const [stretch, setStretch] = useState(false);
  const selection = model.source.getAction(resultIndex, ResultSetSelectAction);

  const focusCell = selection.getFocusedElement();

  let src: string | undefined;

  if (selection.elements.length > 0 || focusCell) {
    const view = model.source.getAction(resultIndex, ResultSetViewAction);
    const firstSelectedCell = selection.elements[0] || focusCell;

    const cellValue = view.getCellValue(firstSelectedCell);

    if (isResultSetContentValue(cellValue) && cellValue.binary) {
      src = `data:${getMIME(cellValue.binary)};base64,${cellValue.binary}`;
    } else if (typeof cellValue === 'string' && isValidUrl(cellValue) && isImageFormat(cellValue)) {
      src = cellValue;
    }
  }

  return styled(useStyles(styles))(
    <container>
      <tools>
        <Button disabled={stretch} onClick={() => setStretch(true)}>{translate('data_viewer_presentation_value_image_fit')}</Button>
        <Button disabled={!stretch} onClick={() => setStretch(false)}>{translate('data_viewer_presentation_value_image_original_size')}</Button>
      </tools>
      <image>
        <img src={src} {...use({ stretch })} />
      </image>
    </container>
  );
});

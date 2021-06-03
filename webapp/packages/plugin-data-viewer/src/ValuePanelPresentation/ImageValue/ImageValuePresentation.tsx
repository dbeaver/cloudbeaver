/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import type { TabContainerPanelComponent } from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';
import { getMIME } from '@cloudbeaver/core-utils';

import { ResultSetDataAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataAction';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';

const styles = css`
  img {
    margin: auto;
    max-width: 100%;
    max-height: 100%;
  }
`;

export const ImageValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(function ImageValuePresentation({
  model,
  resultIndex,
}) {
  const selection = model.source.getAction(resultIndex, ResultSetSelectAction);

  const selectedCells = selection.getSelectedElements();
  const focusCell = selection.getFocusedElement();

  let src: string | undefined;

  if (selectedCells.length > 0 || focusCell) {
    const firstSelectedCell = selectedCells[0] || focusCell;

    const content = model.source
      .getAction(resultIndex, ResultSetDataAction)
      .getContent(firstSelectedCell);

    if (content?.binary) {
      src = `data:${getMIME(content.binary)};base64,${content.binary}`;
    }
  }

  return styled(useStyles(styles))(
    <img src={src} />
  );
});

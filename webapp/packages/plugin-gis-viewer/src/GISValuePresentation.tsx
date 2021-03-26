/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { TabContainerPanelComponent, TextPlaceholder } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { IDataValuePanelProps, IDatabaseResultSet, ResultSetSelectAction, IResultSetElementKey } from '@cloudbeaver/plugin-data-viewer';

import { LeafletMap } from './LeafletMap';
import { ResultSetGISAction } from './ResultSetGISAction';
import { useParseGISValues } from './useParseGISValues';
import type { AssociatedValue } from './useParseGISValues';

export const GISValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(function GISValuePresentation({
  model,
  resultIndex,
}) {
  const translate = useTranslate();

  const modelResultData = model.getResult(resultIndex);
  const selection = model.source.getAction(resultIndex, ResultSetSelectAction);
  const GIS = model.source.getAction(resultIndex, ResultSetGISAction);

  const focusedCell = selection.getFocusedElement() as Required<IResultSetElementKey> | null;
  const selectedCells = selection.getSelectedElements();

  if (selectedCells.length === 0 && focusedCell) {
    selectedCells.push(focusedCell);
  }

  const geoJSON = useParseGISValues(
    model, resultIndex, GIS.getGISDataFor(selectedCells)
  );

  const getAssociatedValues = useCallback((cell: Required<IResultSetElementKey>): AssociatedValue[] => {
    if (!modelResultData?.data?.columns || !modelResultData?.data?.rows) {
      return [];
    }

    const { column: columnIndex, row: rowIndex } = cell;

    return modelResultData.data.columns.reduce((result: AssociatedValue[], column, i) => {
      if (i !== columnIndex) {
        result.push({
          key: column.name!,
          value: model.source
            .getEditor(resultIndex)
            .getCell(rowIndex, i),
        });
      }

      return result;
    }, []);
  }, [modelResultData, model, resultIndex]);

  if (!geoJSON.length) {
    return <TextPlaceholder>{translate('gis_presentation_placeholder')}</TextPlaceholder>;
  }

  return (
    <LeafletMap geoJSON={geoJSON} getAssociatedValues={getAssociatedValues} />
  );
});

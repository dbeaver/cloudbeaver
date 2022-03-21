/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';
import wellknown from 'wellknown';

import { TextPlaceholder } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { IDatabaseResultSet, ResultSetSelectAction, IResultSetElementKey, IDatabaseDataModel, ResultSetViewAction, ResultSetDataKeysUtils } from '@cloudbeaver/plugin-data-viewer';

import { IGeoJSONFeature, IAssociatedValue, LeafletMap } from './LeafletMap';
import { ResultSetGISAction } from './ResultSetGISAction';

interface Props {
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
  resultIndex: number;
}

export const GISValuePresentation = observer<Props>(function GISValuePresentation({
  model,
  resultIndex,
}) {
  const translate = useTranslate();

  const selection = model.source.getAction(resultIndex, ResultSetSelectAction);
  const gis = model.source.getAction(resultIndex, ResultSetGISAction);
  const view = model.source.getAction(resultIndex, ResultSetViewAction);

  const focusedCell = selection.getFocusedElement();
  const selectedCells = selection.elements.slice();

  if (selectedCells.length === 0 && focusedCell) {
    selectedCells.push(focusedCell);
  }

  const parsedGISData = useMemo(() => {
    const result: IGeoJSONFeature[] = [];

    for (const cell of selectedCells) {
      const cellValue = gis.getCellValue(cell);

      if (!cellValue) {
        continue;
      }

      try {
        const parsedCellValue = wellknown.parse(cellValue.mapText || cellValue.text);
        if (!parsedCellValue) {
          continue;
        }

        result.push({ type: 'Feature', geometry: parsedCellValue, properties: { associatedCell: cell, srid: cellValue.srid } });
      } catch (exception: any) {
        console.error(`Failed to parse "${cellValue.mapText || cellValue.text}" value.`);
        console.error(exception);
      }
    }

    return result;
  }, [selectedCells, gis]);

  const getAssociatedValues = useCallback((cell: IResultSetElementKey): IAssociatedValue[] => {
    const values: IAssociatedValue[] = [];

    for (const column of view.columnKeys) {
      if (ResultSetDataKeysUtils.isEqual(column, cell.column)) {
        continue;
      }

      const value = view.getCellValue({ ...cell, column });
      const columnInfo = view.getColumn(column);

      if (value && columnInfo?.name) {
        values.push({
          key: columnInfo.name,
          value,
        });
      }
    }

    return values;
  }, [view]);

  if (!parsedGISData.length) {
    return <TextPlaceholder>{translate('gis_presentation_placeholder')}</TextPlaceholder>;
  }

  return (
    <LeafletMap geoJSON={parsedGISData} getAssociatedValues={getAssociatedValues} />
  );
});

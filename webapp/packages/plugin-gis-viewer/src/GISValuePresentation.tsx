/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo, useState } from 'react';
import styled, { css } from 'reshadow';
import wellknown from 'wellknown';

import { TextPlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import {
  IDatabaseDataModel,
  IDatabaseResultSet,
  IResultSetElementKey,
  ResultSetDataKeysUtils,
  ResultSetSelectAction,
  ResultSetViewAction,
} from '@cloudbeaver/plugin-data-viewer';

import { CrsInput } from './CrsInput';
import { CrsKey, IAssociatedValue, IGeoJSONFeature, LeafletMap } from './LeafletMap';
import { ResultSetGISAction } from './ResultSetGISAction';

function getCrsKey(feature?: IGeoJSONFeature): CrsKey {
  switch (feature?.properties.srid) {
    case 3857:
      return 'EPSG3857';
    case 4326:
      return 'EPSG4326';
    case 3395:
      return 'EPSG3395';
    case 900913:
      return 'EPSG900913';
    default:
      return 'EPSG3857';
  }
}

const styles = css`
  root {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  map {
    flex: 1 1 auto;
    border-radius: var(--theme-group-element-radius);
    overflow: hidden;
  }

  toolbar {
    margin-top: 8px;
    flex: 0 0 auto;
  }
`;

interface Props {
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
  resultIndex: number;
}

export const GISValuePresentation = observer<Props>(function GISValuePresentation({ model, resultIndex }) {
  const translate = useTranslate();

  const selection = model.source.getAction(resultIndex, ResultSetSelectAction);
  const gis = model.source.getAction(resultIndex, ResultSetGISAction);
  const view = model.source.getAction(resultIndex, ResultSetViewAction);

  const activeElements = selection.getActiveElements();

  const parsedGISData: IGeoJSONFeature[] = [];

  for (const cell of activeElements) {
    const cellValue = gis.getCellValue(cell);

    if (!cellValue) {
      continue;
    }

    try {
      const parsedCellValue = wellknown.parse(cellValue.mapText || cellValue.text);
      if (!parsedCellValue) {
        continue;
      }

      parsedGISData.push({ type: 'Feature', geometry: parsedCellValue, properties: { associatedCell: cell, srid: cellValue.srid } });
    } catch (exception: any) {
      console.error(`Failed to parse "${cellValue.mapText || cellValue.text}" value.`);
      console.error(exception);
    }
  }

  const getAssociatedValues = useCallback(
    (cell: IResultSetElementKey): IAssociatedValue[] => {
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
    },
    [view],
  );

  const defaultCrsKey = getCrsKey(parsedGISData[0]);
  const [crsKey, setCrsKey] = useState(defaultCrsKey);

  if (!parsedGISData.length) {
    return <TextPlaceholder>{translate('gis_presentation_placeholder')}</TextPlaceholder>;
  }

  return styled(styles)(
    <root>
      <map>
        <LeafletMap key={crsKey} geoJSON={parsedGISData} crsKey={crsKey} getAssociatedValues={getAssociatedValues} />
      </map>
      <toolbar>
        <CrsInput value={crsKey} onChange={setCrsKey} />
      </toolbar>
    </root>,
  );
});

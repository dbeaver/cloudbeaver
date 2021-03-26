/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useMemo } from 'react';
import wkt from 'terraformer-wkt-parser';

import type { IDatabaseDataModel, IDatabaseResultSet, IResultSetElementKey } from '@cloudbeaver/plugin-data-viewer';
import { ResultSetDataAction } from '@cloudbeaver/plugin-data-viewer';

interface GISType {
  $type: string;
  srid: number;
  text: string;
  mapText: string | null;
  properties: Record<string, any> | null;
}

export interface AssociatedValue {
  key: string;
  value: any;
}

interface IFeatureProperties {
  srid: number;
  associatedCell: Required<IResultSetElementKey>;
}

export interface IGeoJSONFeature extends GeoJSON.Feature {
  properties: IFeatureProperties;
}

export function useParseGISValues(
  model: IDatabaseDataModel<any, IDatabaseResultSet>,
  resultIndex: number,
  values: Array<Required<IResultSetElementKey>>
) {
  const modelResultData = model.getResult(resultIndex);

  const geoJSON = useMemo(() => {
    const result: IGeoJSONFeature[] = [];

    if (!modelResultData) {
      return result;
    }

    const data = model.source.getAction(resultIndex, ResultSetDataAction);

    for (let i = 0; i <= values.length; i++) {
      try {
        const cell = values[i];
        const cellValue = data.getCellValue(cell) as GISType;
        const parsedCellValue = wkt.parse(cellValue.mapText || cellValue.text);

        result.push({ type: 'Feature', geometry: parsedCellValue, properties: { associatedCell: cell, srid: cellValue.srid } });
      } catch {
        continue;
      }
    }

    return result;
  }, [model, resultIndex, values, modelResultData]);

  return geoJSON;
}

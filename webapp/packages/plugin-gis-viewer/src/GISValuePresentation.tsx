/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import proj4 from 'proj4';
import { useCallback, useState } from 'react';
import wellknown, { type GeoJSONGeometry } from 'wellknown';

import { TextPlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import {
  type IDatabaseDataModel,
  type IResultSetElementKey,
  ResultSetDataKeysUtils,
  ResultSetDataSource,
  ResultSetSelectAction,
  ResultSetViewAction,
} from '@cloudbeaver/plugin-data-viewer';

import { CrsInput } from './CrsInput.js';
import classes from './GISValuePresentation.module.css';
import { type CrsKey, type IAssociatedValue, type IGeoJSONFeature, LeafletMap } from './LeafletMap.js';
import { ResultSetGISAction } from './ResultSetGISAction.js';

proj4.defs('EPSG:3395', '+title=World Mercator +proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');

function getCrsKey(srid: number): CrsKey {
  switch (srid) {
    case 3857:
      return 'EPSG:3857';
    case 4326:
      return 'EPSG:4326';
    case 3395:
      return 'EPSG:3395';
    case 900913:
      return 'EPSG:900913';
    default:
      return 'EPSG:4326';
  }
}

const DEFAULT_CRS = 'EPSG:3857';
const DEFAULT_TRANSFORM_CRS = 'EPSG:4326';

function getTransformedGeometry(from: CrsKey, to: CrsKey, geometry: GeoJSONGeometry): GeoJSONGeometry {
  if (geometry.type === 'Point') {
    return { ...geometry, coordinates: proj4(from, to, geometry.coordinates) };
  }

  if (geometry.type === 'MultiPoint' || geometry.type === 'LineString') {
    return { ...geometry, coordinates: geometry.coordinates.map(point => proj4(from, to, point)) };
  }

  if (geometry.type === 'MultiLineString' || geometry.type === 'Polygon') {
    return { ...geometry, coordinates: geometry.coordinates.map(line => line.map(point => proj4(from, to, point))) };
  }

  if (geometry.type === 'MultiPolygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map(polygon => polygon.map(line => line.map(point => proj4(from, to, point)))),
    };
  }

  if (geometry.type === 'GeometryCollection') {
    return { ...geometry, geometries: geometry.geometries.map(geometry => getTransformedGeometry(from, to, geometry)) };
  }

  return geometry;
}

interface Props {
  model: IDatabaseDataModel<ResultSetDataSource>;
  resultIndex: number;
}

export const GISValuePresentation = observer<Props>(function GISValuePresentation({ model, resultIndex }) {
  const translate = useTranslate();

  const selection = model.source.getAction(resultIndex, ResultSetSelectAction);
  const gis = model.source.getAction(resultIndex, ResultSetGISAction);
  const view = model.source.getAction(resultIndex, ResultSetViewAction);

  const parsedGISData: IGeoJSONFeature[] = [];
  const activeElements = selection.getActiveElements();
  const firstActiveElement = activeElements[0];
  const firstActiveCell = firstActiveElement ? gis.getCellValue(firstActiveElement) : null;
  const initialCrs: CrsKey = firstActiveCell?.srid ? getCrsKey(firstActiveCell.srid) : DEFAULT_CRS;

  const [crs, setCrs] = useState<CrsKey | null>(null);

  const currentCrs = crs ?? initialCrs;

  for (const cell of activeElements) {
    const cellValue = gis.getCellValue(cell);

    if (!cellValue) {
      continue;
    }

    const text = cellValue.mapText || cellValue.text;

    try {
      const parsedCellValue = wellknown.parse(text);

      if (!parsedCellValue) {
        continue;
      }

      const from = cellValue.srid === 0 ? DEFAULT_TRANSFORM_CRS : getCrsKey(cellValue.srid);

      parsedGISData.push({
        type: 'Feature',
        geometry: currentCrs === 'Simple' ? parsedCellValue : getTransformedGeometry(from, currentCrs, parsedCellValue),
        properties: { associatedCell: cell, srid: cellValue.srid },
      });
    } catch (exception: any) {
      console.error(`Failed to parse "${text}" value.`);
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

  if (!parsedGISData.length) {
    return <TextPlaceholder>{translate('gis_presentation_placeholder')}</TextPlaceholder>;
  }

  return (
    <div className={classes['root']}>
      <div className={classes['map']}>
        <LeafletMap key={currentCrs} geoJSON={parsedGISData} crsKey={currentCrs} getAssociatedValues={getAssociatedValues} />
      </div>
      <div className={classes['toolbar']}>
        <CrsInput value={currentCrs} onChange={setCrs} />
      </div>
    </div>
  );
});

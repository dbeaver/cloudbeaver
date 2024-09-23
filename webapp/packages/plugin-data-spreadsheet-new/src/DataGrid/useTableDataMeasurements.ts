/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { TextTools } from '@cloudbeaver/core-utils';
import {
  type IDatabaseDataModel,
  type IResultSetColumnKey,
  ResultSetDataKeysUtils,
  ResultSetDataSource,
  ResultSetFormatAction,
  ResultSetViewAction,
} from '@cloudbeaver/plugin-data-viewer';

const COLUMN_PADDING = 16 + 2;
const COLUMN_HEADER_ICON_WIDTH = 16;
const COLUMN_HEADER_TEXT_PADDING = 8;
const COLUMN_HEADER_ORDER_PADDING = 8;
const COLUMN_HEADER_ORDER_WIDTH = 16;

const COLUMN_HEADER_MAX_WIDTH = 300;

const FONT = '400 12px Roboto';

interface ITableDataMeasurements {
  getColumnWidth(key: IResultSetColumnKey): number;
  scheduleUpdate(key: IResultSetColumnKey): void;
}

// TODO: clear removed columns from cache
export function useTableDataMeasurements(model: IDatabaseDataModel<ResultSetDataSource>, resultIndex: number): ITableDataMeasurements {
  const format = model.source.getAction(resultIndex, ResultSetFormatAction);
  const view = model.source.getAction(resultIndex, ResultSetViewAction);

  return useObservableRef(
    () => ({
      cache: observable.map(),
      getColumnWidth(key: IResultSetColumnKey): number {
        return this.cache.get(ResultSetDataKeysUtils.serialize(key)) ?? COLUMN_HEADER_MAX_WIDTH;
      },
      scheduleUpdate(key: IResultSetColumnKey) {
        if (this.cache.has(ResultSetDataKeysUtils.serialize(key))) {
          return;
        }

        this.calculateWidth(key);
      },
      calculateWidth(key: IResultSetColumnKey) {
        const serializedKey = ResultSetDataKeysUtils.serialize(key);
        const columnName = this.view.getColumn(key)?.name ?? '';
        const rowStrings = this.format.getLongestCells(key);

        const columnsWidth = TextTools.getWidth({
          font: FONT,
          text: [columnName],
        }).map(
          width =>
            width + COLUMN_PADDING + COLUMN_HEADER_ICON_WIDTH + COLUMN_HEADER_TEXT_PADDING + COLUMN_HEADER_ORDER_PADDING + COLUMN_HEADER_ORDER_WIDTH,
        );

        const cellsWidth = TextTools.getWidth({
          font: FONT,
          text: rowStrings,
        }).map(width => width + COLUMN_PADDING);

        const width = Math.min(COLUMN_HEADER_MAX_WIDTH, Math.max(columnsWidth[0]!, cellsWidth[0] ?? 0));

        this.cache.set(serializedKey, width);
      },
    }),
    { scheduleUpdate: action.bound },
    { format, view },
  );
}

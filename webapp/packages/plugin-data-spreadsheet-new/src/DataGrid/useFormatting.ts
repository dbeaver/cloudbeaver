/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { IGridColumnKey, ResultSetCacheAction } from '@cloudbeaver/plugin-data-viewer';

import { DataGridSettingsService } from '../DataGridSettingsService.js';
import { detectDateTimeKind } from './helpers/detectDateTimeKind.js';
import { DateTimeKind, type IDataGridFormatters, type IFormattingContext } from './FormattingContext.js';
import type { ITableData } from './TableDataContext.js';

const EXTENDED_DATE_KIND_CACHE = Symbol('data-grid-extended-date-kind');

interface IFormattingContextPrivate extends IFormattingContext {
  dataGridSettingsService: DataGridSettingsService;
  cache: ResultSetCacheAction;
  tableData: ITableData;
}

export function useFormatting(tableData: ITableData, cache: ResultSetCacheAction): IFormattingContext {
  const dataGridSettingsService = useService(DataGridSettingsService);

  return useObservableRef<IFormattingContextPrivate>(
    () => ({
      get formatters(): IDataGridFormatters | null {
        const locale = this.dataGridSettingsService.getFormatLocale();

        if (locale === null) {
          return null;
        }

        return {
          locale,
          dateTime: new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
          }),
          dateOnly: new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            timeZone: 'UTC',
          }),
          number: new Intl.NumberFormat(locale),
        };
      },
      getExtendedDateKind(columnKey: IGridColumnKey): DateTimeKind {
        const cached = this.cache.getColumn<DateTimeKind>(columnKey, EXTENDED_DATE_KIND_CACHE);

        if (cached !== undefined) {
          return cached;
        }

        let kind = DateTimeKind.DateTime;
        const rows = this.tableData.rows;

        for (const row of rows) {
          const cellKey = { column: columnKey, row };
          const holder = this.tableData.getCellHolder(cellKey);

          if (!this.tableData.format.isNull(holder)) {
            const displayValue = this.tableData.format.getDisplayString(holder);
            kind = detectDateTimeKind(displayValue);
            break;
          }
        }

        this.cache.setColumn(columnKey, EXTENDED_DATE_KIND_CACHE, kind);

        return kind;
      },
    }),
    {
      formatters: computed,
      cache: observable.ref,
      tableData: observable.ref,
    },
    {
      dataGridSettingsService,
      cache,
      tableData,
    },
  );
}

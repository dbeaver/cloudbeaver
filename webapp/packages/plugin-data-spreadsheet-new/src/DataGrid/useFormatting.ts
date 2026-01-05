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
import type { IGridColumnKey } from '@cloudbeaver/plugin-data-viewer';

import { DataGridSettingsService } from '../DataGridSettingsService.js';
import { detectDateTimeKind } from './helpers/detectDateTimeKind.js';
import { DateTimeKind, type IDataGridFormatters, type IFormattingContext } from './FormattingContext.js';
import type { ITableData } from './TableDataContext.js';

interface IFormattingContextPrivate extends IFormattingContext {
  dataGridSettingsService: DataGridSettingsService;
  tableData: ITableData;
  extendedDateKinds: Map<number, DateTimeKind>;
}

export function useFormatting(tableData: ITableData): IFormattingContext {
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
        if (this.extendedDateKinds.has(columnKey.index)) {
          return this.extendedDateKinds.get(columnKey.index) as DateTimeKind;
        }

        for (const row of this.tableData.rows) {
          const cellKey = { column: columnKey, row };
          const holder = this.tableData.getCellHolder(cellKey);

          if (!this.tableData.format.isNull(holder)) {
            const displayValue = this.tableData.format.getDisplayString(holder);
            const kind = detectDateTimeKind(displayValue);
            this.extendedDateKinds.set(columnKey.index, kind);
            return kind;
          }
        }

        const defaultKind = DateTimeKind.DateTime;
        this.extendedDateKinds.set(columnKey.index, defaultKind);
        return defaultKind;
      },
    }),
    {
      formatters: computed,
      tableData: observable.ref,
      extendedDateKinds: observable.ref,
    },
    {
      dataGridSettingsService,
      tableData,
      extendedDateKinds: new Map(),
    },
  );
}

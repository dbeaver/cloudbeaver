/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import type { GraphQLService } from '@cloudbeaver/core-sdk';
import { download, GlobalConstants } from '@cloudbeaver/core-utils';

import type { IResultSetElementKey } from './Actions/ResultSet/IResultSetDataKey';
import { isResultSetContentValue } from './Actions/ResultSet/ResultSetContentValue';
import { ResultSetDataAction } from './Actions/ResultSet/ResultSetDataAction';
import { ResultSetDataElementUtils } from './Actions/ResultSet/ResultSetDataElementUtils';
import type { IResultSetValue } from './Actions/ResultSet/ResultSetFormatAction';
import { ResultSetViewAction } from './Actions/ResultSet/ResultSetViewAction';
import type { IDatabaseDataManager } from './IDatabaseDataManager';
import type { IDatabaseDataSource } from './IDatabaseDataSource';
import type { IDatabaseResultSet } from './IDatabaseResultSet';

const RESULT_VALUE_PATH = 'sql-result-value';

export class DatabaseDataManager<TSource extends IDatabaseDataSource<any, any>> implements IDatabaseDataManager {
  private readonly cache: Map<string, string>;
  activeElement: IResultSetElementKey | null;

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly source: TSource
  ) {
    this.cache = new Map();
    this.activeElement = null;

    makeObservable<DatabaseDataManager<TSource>, 'cache'>(this, {
      cache: observable,
      activeElement: observable.ref,
    });
  }

  canGetFileURLFor(element: IResultSetElementKey, resultIndex: number) {
    const view = this.source.getAction(resultIndex, ResultSetViewAction);
    const cellValue = view.getCellValue(element);

    return isResultSetContentValue(cellValue);
  }

  async getFileURLFor(element: IResultSetElementKey, resultIndex: number) {
    const result = this.source.getResult(resultIndex);
    const data = this.source.getAction(resultIndex, ResultSetDataAction);
    const column = data.getColumn(element.column);
    const row = data.getRowValue(element.row);

    if (!result || !row || !column) {
      throw new Error('Failed to get arguments data');
    }

    const url = await this.source.runTask(
      async () => {
        try {
          this.activeElement = element;
          const fileName = await this.loadFileName(result, column.position, row);
          return this.generateFileURL(fileName);
        } finally {
          this.activeElement = null;
        }
      }
    );

    return url;
  }

  async resolveFileURLFor(element: IResultSetElementKey, resultIndex: number) {
    const hash = this.getHashFor(element, resultIndex);

    if (this.cache.has(hash)) {
      return this.cache.get(hash)!;
    }

    const url = await this.getFileURLFor(element, resultIndex);
    this.cache.set(hash, url);

    return url;
  }

  async downloadFileFor(element: IResultSetElementKey, resultIndex: number) {
    const url = await this.getFileURLFor(element, resultIndex);
    download(url);
  }

  retrieveFileURLFromCacheFor(element: IResultSetElementKey, resultIndex: number) {
    const hash = this.getHashFor(element, resultIndex);
    return this.cache.get(hash);
  }

  clearCache() {
    this.cache.clear();
  }

  private generateFileURL(fileName: string) {
    return `${GlobalConstants.serviceURI}/${RESULT_VALUE_PATH}/${fileName}`;
  }

  private getHashFor(element: IResultSetElementKey, resultIndex: number) {
    return `${ResultSetDataElementUtils.serialize(element)}_${resultIndex}`;
  }

  private async loadFileName(result: IDatabaseResultSet, columnIndex: number, row: IResultSetValue[]) {
    if (!result.id) {
      throw new Error("Result's id must be provided");
    }

    const response = await this.graphQLService.sdk.getResultsetDataURL({
      resultsId: result.id,
      connectionId: result.connectionId,
      contextId: result.contextId,
      lobColumnIndex: columnIndex,
      row: {
        data: row,
      },
    });

    return response.url;
  }
}
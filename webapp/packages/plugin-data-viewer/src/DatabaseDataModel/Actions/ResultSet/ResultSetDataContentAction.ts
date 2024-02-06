/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { QuotasService } from '@cloudbeaver/core-root';
import { GraphQLService, ResultDataFormat } from '@cloudbeaver/core-sdk';
import { bytesToSize, download, GlobalConstants, isNotNullDefined } from '@cloudbeaver/core-utils';

import { DatabaseDataAction } from '../../DatabaseDataAction';
import type { IDatabaseDataSource } from '../../IDatabaseDataSource';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import type { IResultSetDataContentAction } from './IResultSetDataContentAction';
import type { IResultSetElementKey } from './IResultSetDataKey';
import { isResultSetContentValue } from './isResultSetContentValue';
import { ResultSetDataAction } from './ResultSetDataAction';
import { ResultSetDataKeysUtils } from './ResultSetDataKeysUtils';
import { IResultSetValue, ResultSetFormatAction } from './ResultSetFormatAction';
import { ResultSetViewAction } from './ResultSetViewAction';

const RESULT_VALUE_PATH = 'sql-result-value';

interface ICacheEntry {
  url?: string;
  fullText?: string;
}

@databaseDataAction()
export class ResultSetDataContentAction extends DatabaseDataAction<any, IDatabaseResultSet> implements IResultSetDataContentAction {
  static dataFormat = [ResultDataFormat.Resultset];

  private readonly cache: Map<string, Partial<ICacheEntry>>;
  activeElement: IResultSetElementKey | null;

  constructor(
    source: IDatabaseDataSource<any, IDatabaseResultSet>,
    private readonly view: ResultSetViewAction,
    private readonly data: ResultSetDataAction,
    private readonly format: ResultSetFormatAction,
    private readonly graphQLService: GraphQLService,
    private readonly quotasService: QuotasService,
  ) {
    super(source);

    this.cache = new Map();
    this.activeElement = null;

    makeObservable<this, 'cache'>(this, {
      cache: observable,
      activeElement: observable.ref,
    });
  }

  getLimitInfo(elementKey: IResultSetElementKey) {
    const isTextColumn = elementKey ? this.format.isText(elementKey) : false;
    const isBlob = elementKey ? this.format.isBinary(elementKey) : false;
    const result = {
      limit: undefined as number | undefined,
      limitWithSize: undefined as string | undefined,
    };

    if (isTextColumn) {
      result.limit = this.quotasService.getQuota('sqlTextPreviewMaxLength');
    }

    if (isBlob) {
      result.limit = this.quotasService.getQuota('sqlBinaryPreviewMaxLength');
    }

    if (result.limit) {
      result.limitWithSize = bytesToSize(result.limit);
    }

    return result;
  }

  isContentTruncated(elementKey: IResultSetElementKey) {
    const limit = this.getLimitInfo(elementKey).limit;
    const content = elementKey ? this.format.get(elementKey) : null;

    if (!isNotNullDefined(limit) || !isResultSetContentValue(content)) {
      return false;
    }

    return (content.contentLength ?? 0) > limit;
  }

  isDownloadable(element: IResultSetElementKey) {
    return !!this.result.data?.hasRowIdentifier && isResultSetContentValue(this.format.get(element));
  }

  private async loadFileFullText(result: IDatabaseResultSet, columnIndex: number, row: IResultSetValue[]) {
    if (!result.id) {
      throw new Error("Result's id must be provided");
    }

    const response = await this.graphQLService.sdk.sqlReadStringValue({
      resultsId: result.id,
      connectionId: result.connectionId,
      contextId: result.contextId,
      columnIndex,
      row: {
        data: row,
      },
    });

    return response.text;
  }

  async getFileFullText(element: IResultSetElementKey) {
    const column = this.data.getColumn(element.column);
    const row = this.data.getRowValue(element.row);

    const cachedFullText = this.retrieveFileFullTextFromCache(element);

    if (cachedFullText) {
      return cachedFullText;
    }

    if (!row || !column) {
      throw new Error('Failed to get value metadata information');
    }

    const fullText = await this.source.runTask(async () => {
      try {
        this.activeElement = element;
        return await this.loadFileFullText(this.result, column.position, row);
      } finally {
        this.activeElement = null;
      }
    });

    this.updateCache(element, { fullText });

    return fullText;
  }

  async getFileDataUrl(element: IResultSetElementKey) {
    const column = this.data.getColumn(element.column);
    const row = this.data.getRowValue(element.row);

    if (!row || !column) {
      throw new Error('Failed to get value metadata information');
    }

    const url = await this.source.runTask(async () => {
      try {
        this.activeElement = element;
        const fileName = await this.loadFileName(this.result, column.position, row);
        return this.generateFileDataUrl(fileName);
      } finally {
        this.activeElement = null;
      }
    });

    return url;
  }

  async resolveFileDataUrl(element: IResultSetElementKey) {
    const cachedUrl = this.retrieveFileDataUrlFromCache(element);

    if (cachedUrl) {
      return cachedUrl;
    }

    const url = await this.getFileDataUrl(element);
    this.updateCache(element, { url });

    return url;
  }

  private updateCache(element: IResultSetElementKey, partialCache: Partial<ICacheEntry>) {
    const hash = this.getHash(element);
    const cachedElement = this.cache.get(hash) ?? {};
    this.cache.set(hash, { ...cachedElement, ...partialCache });
  }

  retrieveFileFullTextFromCache(element: IResultSetElementKey) {
    const hash = this.getHash(element);
    return this.cache.get(hash)?.fullText;
  }

  retrieveFileDataUrlFromCache(element: IResultSetElementKey) {
    const hash = this.getHash(element);
    return this.cache.get(hash)?.url;
  }

  async downloadFileData(element: IResultSetElementKey) {
    const url = await this.getFileDataUrl(element);
    download(url);
  }

  clearCache() {
    this.cache.clear();
  }

  private generateFileDataUrl(fileName: string) {
    return `${GlobalConstants.serviceURI}/${RESULT_VALUE_PATH}/${fileName}`;
  }

  private getHash(element: IResultSetElementKey) {
    return ResultSetDataKeysUtils.serializeElementKey(element);
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

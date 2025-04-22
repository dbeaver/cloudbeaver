/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { QuotasService, ServerResourceQuotasResource } from '@cloudbeaver/core-root';
import { GraphQLService, ResultDataFormat } from '@cloudbeaver/core-sdk';
import { bytesToSize, download, downloadFromURL, GlobalConstants } from '@cloudbeaver/core-utils';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import { DatabaseDataAction } from '../../DatabaseDataAction.js';
import type { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet.js';
import { databaseDataAction } from '../DatabaseDataActionDecorator.js';
import type { IResultSetDataContentAction } from './IResultSetDataContentAction.js';
import type { IResultSetElementKey } from './IResultSetDataKey.js';
import { isResultSetContentValue } from './isResultSetContentValue.js';
import { ResultSetCacheAction } from './ResultSetCacheAction.js';
import { ResultSetDataAction } from './ResultSetDataAction.js';
import { type IResultSetValue, ResultSetFormatAction } from './ResultSetFormatAction.js';

const RESULT_VALUE_PATH = 'sql-result-value';
const CONTENT_CACHE_KEY = Symbol('content-cache-key');

interface ICacheEntry {
  blob?: Blob;
  fullText?: string;
  loading?: boolean;
}

@databaseDataAction()
export class ResultSetDataContentAction extends DatabaseDataAction<any, IDatabaseResultSet> implements IResultSetDataContentAction {
  static dataFormat = [ResultDataFormat.Resultset];
  private subscriptionDispose?: () => void;

  constructor(
    source: IDatabaseDataSource<any, IDatabaseResultSet>,
    private readonly data: ResultSetDataAction,
    private readonly format: ResultSetFormatAction,
    private readonly graphQLService: GraphQLService,
    private readonly serverResourceQuotasResource: ServerResourceQuotasResource,
    private readonly quotasService: QuotasService,
    private readonly cache: ResultSetCacheAction,
  ) {
    super(source);

    function loadQuotas() {
      setTimeout(() => serverResourceQuotasResource.load(), 0);
    }

    this.serverResourceQuotasResource.onDataOutdated.addHandler(loadQuotas);

    loadQuotas();

    this.subscriptionDispose = () => {
      this.serverResourceQuotasResource.onDataOutdated.removeHandler(loadQuotas);
    };

    makeObservable<this, 'cache'>(this, {
      cache: observable,
    });
  }

  getLimitInfo(elementKey: IResultSetElementKey) {
    const isTextColumn = this.format.isText(elementKey);
    const isBlob = this.format.isBinary(elementKey);
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

  isLoading(element: IResultSetElementKey) {
    return this.getCache(element)?.loading ?? false;
  }

  isBlobTruncated(elementKey: IResultSetElementKey) {
    const limit = this.getLimitInfo(elementKey).limit;
    const content = this.format.get(elementKey);

    if (!isNotNullDefined(limit) || !isResultSetContentValue(content) || !this.format.isBinary(elementKey)) {
      return false;
    }

    return (content.contentLength ?? 0) > limit;
  }

  isTextTruncated(elementKey: IResultSetElementKey) {
    const limit = this.getLimitInfo(elementKey).limit;
    const content = this.format.get(elementKey);

    if (!isNotNullDefined(limit) || !isResultSetContentValue(content)) {
      return false;
    }

    return (content.contentLength ?? 0) > limit;
  }

  isDownloadable(element: IResultSetElementKey) {
    return !!this.result.data?.hasRowIdentifier && isResultSetContentValue(this.format.get(element));
  }

  retrieveFullTextFromCache(element: IResultSetElementKey) {
    return this.getCache(element)?.fullText;
  }

  retrieveBlobFromCache(element: IResultSetElementKey) {
    return this.getCache(element)?.blob;
  }

  async getFileFullText(element: IResultSetElementKey) {
    const column = this.data.getColumn(element.column);
    const row = this.data.getRowValue(element.row);

    const cachedFullText = this.retrieveFullTextFromCache(element);

    if (cachedFullText) {
      return cachedFullText;
    }

    if (!row || !column) {
      throw new Error('Failed to get value metadata information');
    }

    const fullText = await this.source.runOperation(async () => {
      try {
        this.updateCache(element, { loading: true });
        return await this.loadFileFullText(this.result, column.position, row);
      } finally {
        this.updateCache(element, { loading: false });
      }
    });

    if (fullText === null) {
      throw new Error('Failed to get value metadata information');
    }

    this.updateCache(element, { fullText });

    return fullText;
  }

  async resolveFileDataUrl(element: IResultSetElementKey) {
    const cachedUrl = this.retrieveBlobFromCache(element);

    if (cachedUrl) {
      return cachedUrl;
    }

    const url = await this.getFileDataUrl(element);
    const blob = await downloadFromURL(url);

    this.updateCache(element, { blob });

    return blob;
  }

  async downloadFileData(element: IResultSetElementKey) {
    const url = await this.getFileDataUrl(element);
    download(url);
  }

  clearCache() {
    this.cache.deleteAll(CONTENT_CACHE_KEY);
  }

  override dispose(): void {
    this.subscriptionDispose?.();
    this.clearCache();
  }

  private async getFileDataUrl(element: IResultSetElementKey): Promise<string> {
    const column = this.data.getColumn(element.column);
    const row = this.data.getRowValue(element.row);

    if (!row || !column) {
      throw new Error('Failed to get value metadata information');
    }

    const url = await this.source.runOperation(async () => {
      try {
        this.updateCache(element, { loading: true });
        return await this.loadDataURL(this.result, column.position, row);
      } finally {
        this.updateCache(element, { loading: false });
      }
    });

    if (url === null) {
      throw new Error('Failed to get value metadata information');
    }

    return url;
  }

  private async loadFileFullText(result: IDatabaseResultSet, columnIndex: number, row: IResultSetValue[]) {
    if (!result.id) {
      throw new Error("Result's id must be provided");
    }

    const response = await this.graphQLService.sdk.sqlReadStringValue({
      resultsId: result.id,
      projectId: result.projectId,
      connectionId: result.connectionId,
      contextId: result.contextId,
      columnIndex,
      row: {
        data: row,
      },
    });

    return response.text;
  }

  private updateCache(element: IResultSetElementKey, partialCache: Partial<ICacheEntry>) {
    const cachedElement = this.getCache(element) ?? {};
    this.setCache(element, { ...cachedElement, ...partialCache });
  }

  private getCache(element: IResultSetElementKey) {
    return this.cache.get<ICacheEntry>(element, CONTENT_CACHE_KEY);
  }

  private setCache(element: IResultSetElementKey, value: ICacheEntry) {
    this.cache.set(element, CONTENT_CACHE_KEY, value);
  }

  private async loadDataURL(result: IDatabaseResultSet, columnIndex: number, row: IResultSetValue[]) {
    if (!result.id) {
      throw new Error("Result's id must be provided");
    }

    const { url } = await this.graphQLService.sdk.getResultsetDataURL({
      resultsId: result.id,
      projectId: result.projectId,
      connectionId: result.connectionId,
      contextId: result.contextId,
      lobColumnIndex: columnIndex,
      row: {
        data: row,
      },
    });

    return `${GlobalConstants.serviceURI}/${RESULT_VALUE_PATH}/${url}`;
  }
}

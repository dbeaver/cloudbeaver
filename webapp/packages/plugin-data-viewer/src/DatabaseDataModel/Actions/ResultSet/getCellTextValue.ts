/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isResultSetContentValue } from '@dbeaver/result-set-api';

import type { IGridDataKey } from '../Grid/IGridDataKey.js';
import type { IDatabaseDataFormatAction } from '../IDatabaseDataFormatAction.js';
import type { IDatabaseValueHolder } from '../IDatabaseValueHolder.js';
import { isResultSetBlobValue } from './isResultSetBlobValue.js';
import type { ResultSetDataContentAction } from './ResultSetDataContentAction.js';
import type { IResultSetValue } from './ResultSetFormatAction.js';

export interface IGetCellTextValueOptions {
  decodeBinary?: boolean;
  resolvedBlobValue?: string | null;
}

export function getCellTextValue(
  holder: IDatabaseValueHolder<IGridDataKey, IResultSetValue>,
  formatAction: IDatabaseDataFormatAction<any, any, any>,
  contentAction: ResultSetDataContentAction,
  options?: IGetCellTextValueOptions,
): string {
  const decodeBinary = options?.decodeBinary ?? false;

  if (contentAction.isTextTruncated(holder)) {
    const fullText = contentAction.retrieveFullTextFromCache(holder.key);
    if (fullText !== undefined) {
      return fullText;
    }
  }

  if (isResultSetBlobValue(holder.value)) {
    return decodeBinary ? atob(options?.resolvedBlobValue ?? '') : (options?.resolvedBlobValue ?? '');
  }

  if (formatAction.isBinary(holder)) {
    if (isResultSetContentValue(holder.value)) {
      if (holder.value.binary !== undefined) {
        return decodeBinary ? atob(holder.value.binary) : holder.value.binary;
      }
      if (holder.value.text !== undefined) {
        return holder.value.text;
      }
    }
    return '';
  }

  const cachedFullText = contentAction.retrieveFullTextFromCache(holder.key);
  return cachedFullText ?? formatAction.getText(holder);
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useService } from '@cloudbeaver/core-di';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { isResultSetContentValue } from '@dbeaver/result-set-api';

import type { IResultSetElementKey } from '../../DatabaseDataModel/Actions/ResultSet/IResultSetDataKey.js';
import { isResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBlobValue.js';
import type { IResultSetValue, ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction.js';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel.js';
import { ResultSetDataSource } from '../../ResultSet/ResultSetDataSource.js';
import { TextValuePresentationService } from './TextValuePresentationService.js';

interface Args {
  resultIndex: number;
  model: IDatabaseDataModel<ResultSetDataSource>;
  dataFormat: ResultDataFormat | null;
  currentContentType: string | null;
  elementKey?: IResultSetElementKey;
  formatAction: ResultSetFormatAction;
}

const DEFAULT_CONTENT_TYPE = 'text/plain';

function getContentTypeFromResultSetValue(contentValue: IResultSetValue) {
  if (isResultSetContentValue(contentValue)) {
    return contentValue.contentType;
  }

  if (isResultSetBlobValue(contentValue)) {
    return contentValue.blob.type;
  }

  return null;
}

function preprocessDefaultContentType(contentType: string | null | undefined) {
  if (contentType) {
    switch (contentType) {
      case 'text/json':
        return 'application/json';
      case 'application/octet-stream':
        return 'application/octet-stream;type=base64';
      default:
        return contentType;
    }
  }

  return DEFAULT_CONTENT_TYPE;
}

export function useAutoContentType({ dataFormat, model, formatAction, resultIndex, currentContentType, elementKey }: Args) {
  const textValuePresentationService = useService(TextValuePresentationService);
  const activeTabs = textValuePresentationService.tabs.getDisplayed({
    dataFormat: dataFormat,
    model,
    resultIndex: resultIndex,
  });
  const contentValue = elementKey ? formatAction.get(elementKey) : null;
  const contentValueType = getContentTypeFromResultSetValue(contentValue);
  const defaultContentType = preprocessDefaultContentType(contentValueType);

  if (currentContentType === null) {
    currentContentType = defaultContentType;
  }

  if (activeTabs.length > 0 && !activeTabs.some(tab => tab.key === currentContentType)) {
    currentContentType = activeTabs[0]!.key;
  }

  return currentContentType;
}

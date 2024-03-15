/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { useObservableRef, useSuspense } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { blobToBase64, isNotNullDefined, removeMetadataFromDataURL } from '@cloudbeaver/core-utils';

import type { IResultSetElementKey } from '../../DatabaseDataModel/Actions/ResultSet/IResultSetDataKey';
import { isResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBlobValue';
import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { useResultSetActions } from '../../DatabaseDataModel/Actions/ResultSet/useResultSetActions';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import { formatText } from './formatText';
import { MAX_BLOB_PREVIEW_SIZE } from './MAX_BLOB_PREVIEW_SIZE';
import { TextValuePresentationService } from './TextValuePresentationService';

interface IUseTextValueArgs {
  resultIndex: number;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
  dataFormat: ResultDataFormat | null;
  currentContentType: string | null;
  elementKey?: IResultSetElementKey;
}

interface ITextValueInfo {
  valueGetter: () => string;
  contentType: string;
}

const DEFAULT_CONTENT_TYPE = 'text/plain';

export function useTextValue({ model, dataFormat, resultIndex, currentContentType, elementKey }: IUseTextValueArgs): ITextValueInfo {
  const { formatAction, editAction, contentAction } = useResultSetActions({ model, resultIndex });
  const suspense = useSuspense();
  const contentValue = elementKey ? formatAction.get(elementKey) : null;
  const textValuePresentationService = useService(TextValuePresentationService);
  const activeTabs = textValuePresentationService.tabs.getDisplayed({
    dataFormat: dataFormat,
    model: model,
    resultIndex: resultIndex,
  });
  const limitInfo = elementKey ? contentAction.getLimitInfo(elementKey) : null;

  const observedContentValue = useObservableRef(
    {
      contentValue,
      limitInfo,
    },
    { contentValue: observable.ref, limitInfo: observable.ref },
  );

  let contentType = currentContentType;
  let autoContentType = DEFAULT_CONTENT_TYPE;
  let contentValueType;

  if (isResultSetContentValue(contentValue)) {
    contentValueType = contentValue.contentType;
  }

  if (isResultSetBlobValue(contentValue)) {
    contentValueType = contentValue.blob.type;
  }

  if (contentValueType) {
    switch (contentValueType) {
      case 'text/json':
        autoContentType = 'application/json';
        break;
      case 'application/octet-stream':
        autoContentType = 'application/octet-stream;type=base64';
        break;
      default:
        autoContentType = contentValueType;
        break;
    }
  }

  if (contentType === null) {
    contentType = autoContentType ?? DEFAULT_CONTENT_TYPE;
  }

  if (activeTabs.length > 0 && !activeTabs.some(tab => tab.key === contentType)) {
    contentType = activeTabs[0].key;
  }

  const parsedBlobValueGetter = suspense.observedValue(
    'value-blob',
    () => ({
      blob: isResultSetBlobValue(observedContentValue.contentValue) ? observedContentValue.contentValue.blob : null,
      limit: observedContentValue.limitInfo?.limit,
    }),
    async ({ blob, limit }) => {
      if (!blob) {
        return null;
      }
      const dataURL = await blobToBase64(blob, limit ?? MAX_BLOB_PREVIEW_SIZE);

      if (!dataURL) {
        return null;
      }

      return removeMetadataFromDataURL(dataURL);
    },
  );

  function valueGetter() {
    let value = '';

    if (!isNotNullDefined(elementKey)) {
      return value;
    }

    const contentValue = formatAction.get(elementKey);
    const isBinary = formatAction.isBinary(elementKey);
    const cachedFullText = contentAction.retrieveFullTextFromCache(elementKey);

    if (isBinary && isResultSetContentValue(contentValue)) {
      if (contentValue.binary) {
        value = atob(contentValue.binary);
      } else if (contentValue.text) {
        value = contentValue.text;
      }
    } else if (isResultSetBlobValue(contentValue)) {
      value = atob(parsedBlobValueGetter() ?? '');
    } else {
      value = cachedFullText || formatAction.getText(elementKey);
    }

    if (!editAction.isElementEdited(elementKey) || isBinary) {
      value = formatText(contentType!, value);
    }

    return value;
  }

  return {
    valueGetter,
    contentType,
  };
}

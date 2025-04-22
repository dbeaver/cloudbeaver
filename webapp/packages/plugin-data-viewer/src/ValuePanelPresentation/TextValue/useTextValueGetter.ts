/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { useObservableRef, useSuspense } from '@cloudbeaver/core-blocks';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { blobToBase64, removeMetadataFromDataURL } from '@cloudbeaver/core-utils';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import type { IResultSetElementKey } from '../../DatabaseDataModel/Actions/ResultSet/IResultSetDataKey.js';
import { isResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBlobValue.js';
import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue.js';
import type { ResultSetDataContentAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction.js';
import type { ResultSetEditAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetEditAction.js';
import type { ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction.js';
import { formatText } from './formatText.js';
import { MAX_BLOB_PREVIEW_SIZE } from './MAX_BLOB_PREVIEW_SIZE.js';

interface IUseTextValueArgs {
  dataFormat: ResultDataFormat | null;
  contentType: string;
  elementKey?: IResultSetElementKey;
  contentAction: ResultSetDataContentAction;
  formatAction: ResultSetFormatAction;
  editAction: ResultSetEditAction;
}

type ValueGetter = () => string;

export function useTextValueGetter({ contentType, elementKey, formatAction, contentAction, editAction }: IUseTextValueArgs): ValueGetter {
  const suspense = useSuspense();
  const contentValue = elementKey ? formatAction.get(elementKey) : null;
  const limitInfo = elementKey ? contentAction.getLimitInfo(elementKey) : null;
  const observedContentValue = useObservableRef(
    {
      contentValue,
      limitInfo,
    },
    { contentValue: observable.ref, limitInfo: observable.ref },
  );

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
      value = formatText(contentType, value);
    }

    return value;
  }

  return valueGetter;
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { useObservableRef, useSuspense } from '@cloudbeaver/core-blocks';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { blobToBase64, isNotNullDefined, removeMetadataFromDataURL } from '@cloudbeaver/core-utils';

import type { IResultSetElementKey } from '../../../../DatabaseDataModel/Actions/ResultSet/IResultSetDataKey';
import { isResultSetBlobValue } from '../../../../DatabaseDataModel/Actions/ResultSet/isResultSetBlobValue';
import { isResultSetContentValue } from '../../../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { ResultSetDataContentAction } from '../../../../DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction';
import { ResultSetEditAction } from '../../../../DatabaseDataModel/Actions/ResultSet/ResultSetEditAction';
import { ResultSetFormatAction } from '../../../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction';
import type { IDatabaseDataModel } from '../../../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../../../DatabaseDataModel/IDatabaseResultSet';
import { formatText } from './formatText';
import { MAX_BLOB_PREVIEW_SIZE } from './MAX_BLOB_PREVIEW_SIZE';

interface IUseTextValueArgs {
  resultIndex: number;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
  dataFormat: ResultDataFormat | null;
  contentType: string;
  elementKey?: IResultSetElementKey;
}

type ValueGetter = () => string;

export function useTextValueGetter({ model, resultIndex, contentType, elementKey }: IUseTextValueArgs): ValueGetter {
  const contentAction = model.source.getAction(resultIndex, ResultSetDataContentAction);
  const formatAction = model.source.getAction(resultIndex, ResultSetFormatAction);
  const editAction = model.source.getAction(resultIndex, ResultSetEditAction);

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

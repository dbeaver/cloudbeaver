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
import { isResultSetContentValue } from '@dbeaver/result-set-api';
import { blobToBase64, removeMetadataFromDataURL } from '@cloudbeaver/core-utils';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import { isResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBlobValue.js';
import type { ResultSetDataContentAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction.js';
import { formatText } from './formatText.js';
import { MAX_BLOB_PREVIEW_SIZE } from './MAX_BLOB_PREVIEW_SIZE.js';
import type { IDatabaseDataEditAction } from '../../DatabaseDataModel/Actions/IDatabaseDataEditAction.js';
import type { IDatabaseDataFormatAction } from '../../DatabaseDataModel/Actions/IDatabaseDataFormatAction.js';
import type { IGridDataKey } from '../../DatabaseDataModel/Actions/Grid/IGridDataKey.js';
import type { IResultSetValue } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction.js';
import type { IDatabaseValueHolder } from '../../DatabaseDataModel/Actions/IDatabaseValueHolder.js';

interface IUseTextValueArgs {
  cellHolder: IDatabaseValueHolder<IGridDataKey, IResultSetValue> | undefined;
  dataFormat: ResultDataFormat | null;
  contentType: string;
  contentAction: ResultSetDataContentAction;
  formatAction: IDatabaseDataFormatAction;
  editAction: IDatabaseDataEditAction;
}

type ValueGetter = () => string;

export function useTextValueGetter({ cellHolder, contentType, formatAction, contentAction, editAction }: IUseTextValueArgs): ValueGetter {
  const suspense = useSuspense();
  const limitInfo = cellHolder !== undefined ? contentAction.getLimitInfo(cellHolder) : null;
  const observedContentValue = useObservableRef(
    {
      holder: cellHolder,
      limitInfo,
    },
    { holder: observable.ref, limitInfo: observable.ref },
  );

  const parsedBlobValueGetter = suspense.observedValue(
    'value-blob',
    () => ({
      blob: isResultSetBlobValue(observedContentValue.holder?.value) ? observedContentValue.holder.value.blob : null,
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

    if (!isNotNullDefined(cellHolder)) {
      return value;
    }

    const isBinary = formatAction.isBinary(cellHolder);
    const cachedFullText = contentAction.retrieveFullTextFromCache(cellHolder.key);

    if (isBinary && isResultSetContentValue(cellHolder.value)) {
      if (cellHolder.value.binary) {
        value = atob(cellHolder.value.binary);
      } else if (cellHolder.value.text) {
        value = cellHolder.value.text;
      }
    } else if (isResultSetBlobValue(cellHolder.value)) {
      value = atob(parsedBlobValueGetter() ?? '');
    } else {
      value = cachedFullText || formatAction.getText(cellHolder);
    }

    if (!editAction.isElementEdited(cellHolder.key) || isBinary) {
      value = formatText(contentType, value);
    }

    return value;
  }

  return valueGetter;
}

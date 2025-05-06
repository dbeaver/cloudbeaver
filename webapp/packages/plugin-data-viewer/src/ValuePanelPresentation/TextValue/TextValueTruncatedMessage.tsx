/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button, Container, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { isResultSetContentValue } from '@dbeaver/result-set-api';
import { bytesToSize } from '@cloudbeaver/core-utils';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import type { IResultSetElementKey } from '../../DatabaseDataModel/Actions/ResultSet/IResultSetDataKey.js';
import { isResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBlobValue.js';
import { ResultSetDataContentAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction.js';
import { ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction.js';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel.js';
import { ResultSetDataSource } from '../../ResultSet/ResultSetDataSource.js';
import { QuotaPlaceholder } from '../QuotaPlaceholder.js';
import { MAX_BLOB_PREVIEW_SIZE } from './MAX_BLOB_PREVIEW_SIZE.js';

interface Props {
  resultIndex: number;
  model: IDatabaseDataModel<ResultSetDataSource>;
  elementKey: IResultSetElementKey;
}

export const TextValueTruncatedMessage = observer<Props>(function TextValueTruncatedMessage({ model, resultIndex, elementKey }) {
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const contentAction = model.source.getAction(resultIndex, ResultSetDataContentAction);
  const formatAction = model.source.getAction(resultIndex, ResultSetFormatAction);
  const contentValue = formatAction.get(elementKey);
  let isTruncated = contentAction.isTextTruncated(elementKey);
  const isCacheLoaded = !!contentAction.retrieveFullTextFromCache(elementKey);
  const limitInfo = elementKey ? contentAction.getLimitInfo(elementKey) : null;

  if (isResultSetBlobValue(contentValue)) {
    isTruncated ||= contentValue.blob.size > (limitInfo?.limit ?? MAX_BLOB_PREVIEW_SIZE);
  }

  if (!isTruncated || isCacheLoaded) {
    return null;
  }

  const isTextColumn = formatAction.isText(elementKey);
  const valueSize =
    isResultSetContentValue(contentValue) && isNotNullDefined(contentValue.contentLength) ? bytesToSize(contentValue.contentLength) : undefined;

  async function pasteFullText() {
    try {
      await contentAction.getFileFullText(elementKey);
    } catch (exception) {
      notificationService.logException(exception as any, 'data_viewer_presentation_value_content_paste_error');
    }
  }

  return (
    <QuotaPlaceholder model={model} resultIndex={resultIndex} elementKey={elementKey} keepSize>
      {isTextColumn && (
        <Container keepSize>
          <Button disabled={model.isLoading()} onClick={pasteFullText}>
            {`${translate('ui_show_more')} (${valueSize})`}
          </Button>
        </Container>
      )}
    </QuotaPlaceholder>
  );
});

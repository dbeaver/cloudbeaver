/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { bytesToSize, isNotNullDefined } from '@cloudbeaver/core-utils';

import { isResultSetBinaryFileValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBinaryFileValue';
import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { useResultActions } from '../../DatabaseDataModel/Actions/ResultSet/useResultActions';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import { useContentLimit } from '../useContentLimit';
import { useAutoFormat } from './useAutoFormat';

interface IUseTextValueArgs {
  resultIndex: number;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
  currentContentType: string;
}

interface IUseTextValue {
  textValue: string;
  isTruncated: boolean;
  isTextColumn: boolean;
  limitString: string | undefined;
  pasteFullText(): Promise<void>;
}

export function useTextValue({ model, resultIndex, currentContentType }: IUseTextValueArgs): IUseTextValue {
  const { formatAction, editAction, contentAction, dataAction, selectAction } = useResultActions({ model, resultIndex });
  const activeElements = selectAction.getActiveElements();
  const firstSelectedCell = activeElements?.[0];
  const formatter = useAutoFormat();
  const columnType = firstSelectedCell ? dataAction.getColumn(firstSelectedCell.column)?.dataKind : '';
  const isTextColumn = columnType?.toLocaleLowerCase() === 'string';
  const contentValue = firstSelectedCell ? formatAction.get(firstSelectedCell) : null;
  const cachedFullText = firstSelectedCell ? contentAction.retrieveFileFullTextFromCache(firstSelectedCell) : '';
  const blob = firstSelectedCell ? formatAction.get(firstSelectedCell) : null;
  const notificationService = useService(NotificationService);
  const { limit, shouldShowLimit } = useContentLimit({ model, resultIndex });

  const result: IUseTextValue = {
    textValue: '',
    isTruncated: false,
    isTextColumn,
    limitString: limit && shouldShowLimit ? bytesToSize(limit) : undefined,
    async pasteFullText() {
      if (!firstSelectedCell) {
        return;
      }

      try {
        await contentAction.getFileFullText(firstSelectedCell);
      } catch (exception) {
        notificationService.logException(exception as any, 'data_viewer_presentation_value_content_paste_error');
      }
    },
  };

  if (!isNotNullDefined(firstSelectedCell)) {
    return result;
  }

  if (isResultSetContentValue(contentValue) && limit) {
    result.isTruncated = (contentValue?.contentLength ?? 0) > limit;
  }

  if (isTextColumn && cachedFullText) {
    result.textValue = cachedFullText;
    result.isTruncated = false;
  }

  if (editAction.isElementEdited(firstSelectedCell)) {
    result.textValue = formatAction.getText(firstSelectedCell);
  }

  if (isResultSetBinaryFileValue(blob)) {
    const value = formatter.formatBlob(currentContentType, blob);

    if (value) {
      result.textValue = value;
    }
  }

  if (!result.textValue) {
    result.textValue = formatter.format(currentContentType, formatAction.getText(firstSelectedCell));
  }

  return result;
}

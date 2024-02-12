/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { isNotNullDefined } from '@cloudbeaver/core-utils';

import type { IResultSetElementKey } from '../../DatabaseDataModel/Actions/ResultSet/IResultSetDataKey';
import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { useResultSetActions } from '../../DatabaseDataModel/Actions/ResultSet/useResultSetActions';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import { useAutoFormat } from './useAutoFormat';

interface IUseTextValueArgs {
  resultIndex: number;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
  currentContentType: string;
  elementKey?: IResultSetElementKey;
}

interface IUseTextValue {
  textValue: string;
  isTextColumn: boolean;
  pasteFullText(): Promise<void>;
}

export function useTextValue({ model, resultIndex, currentContentType, elementKey }: IUseTextValueArgs): IUseTextValue {
  const { formatAction, editAction, contentAction } = useResultSetActions({ model, resultIndex });
  const formatter = useAutoFormat();
  const isTextColumn = elementKey ? formatAction.isText(elementKey) : false;
  const contentValue = elementKey ? formatAction.get(elementKey) : null;
  const isBinary = elementKey ? formatAction.isBinary(elementKey) : false;
  const cachedFullText = elementKey ? contentAction.retrieveFileFullTextFromCache(elementKey) : '';
  const notificationService = useService(NotificationService);

  const result: IUseTextValue = {
    textValue: '',
    isTextColumn,
    async pasteFullText() {
      if (!elementKey) {
        return;
      }

      try {
        await contentAction.getFileFullText(elementKey);
      } catch (exception) {
        notificationService.logException(exception as any, 'data_viewer_presentation_value_content_paste_error');
      }
    },
  };

  if (!isNotNullDefined(elementKey)) {
    return result;
  }

  if (isTextColumn && cachedFullText) {
    result.textValue = cachedFullText;
  }

  if (editAction.isElementEdited(elementKey)) {
    result.textValue = formatAction.getText(elementKey);
  }

  if (isBinary && isResultSetContentValue(contentValue)) {
    const value = formatter.formatBlob(currentContentType, contentValue);

    if (value) {
      result.textValue = value;
    }
  }

  if (!result.textValue) {
    result.textValue = formatter.format(currentContentType, formatAction.getText(elementKey));
  }

  return result;
}

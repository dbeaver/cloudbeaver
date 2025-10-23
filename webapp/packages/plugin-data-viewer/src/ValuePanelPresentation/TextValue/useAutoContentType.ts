/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ITabInfo } from '@cloudbeaver/core-ui';
import { isResultSetContentValue } from '@dbeaver/result-set-api';

import { isResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBlobValue.js';
import type { IResultSetValue } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction.js';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel.js';
import type { IDatabaseDataFormatAction } from '../../DatabaseDataModel/Actions/IDatabaseDataFormatAction.js';
import type { IGridDataKey } from '../../DatabaseDataModel/Actions/Grid/IGridDataKey.js';
import { isResultSetDataModel } from '../../ResultSet/isResultSetDataModel.js';
import type { IDatabaseDataSource } from '../../DatabaseDataModel/IDatabaseDataSource.js';
import type { IDataValuePanelOptions, IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService.js';

interface UseAutoContentTypeArgs {
  model: IDatabaseDataModel<IDatabaseDataSource>;
  elementKey?: IGridDataKey;
  formatAction?: IDatabaseDataFormatAction;
  displayed: Array<ITabInfo<IDataValuePanelProps, IDataValuePanelOptions>>;
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

export function useAutoContentType({ displayed, formatAction, model, elementKey }: UseAutoContentTypeArgs): string | null {
  const isAllTextType = displayed.every(tab => tab.options?.isTextPresentation);
  const isAutoType = isAllTextType && formatAction && isResultSetDataModel(model);

  if (!isAutoType) {
    return null;
  }

  const contentValue = elementKey ? formatAction.get(elementKey) : null;
  const contentValueType = getContentTypeFromResultSetValue(contentValue);

  return preprocessDefaultContentType(contentValueType);
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ITabInfo } from '@cloudbeaver/core-ui';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel.js';
import type { IDatabaseDataFormatAction } from '../../DatabaseDataModel/Actions/IDatabaseDataFormatAction.js';
import type { IGridDataKey } from '../../DatabaseDataModel/Actions/Grid/IGridDataKey.js';
import type { IDatabaseDataSource } from '../../DatabaseDataModel/IDatabaseDataSource.js';
import type { IDataValuePanelOptions, IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService.js';
import { useAutoContentType } from './useAutoContentType.js';

interface UseContentTypeArgs {
  model: IDatabaseDataModel<IDatabaseDataSource>;
  currentContentType: string | null;
  elementKey?: IGridDataKey;
  formatAction?: IDatabaseDataFormatAction;
  displayed: Array<ITabInfo<IDataValuePanelProps, IDataValuePanelOptions>>;
}

const DEFAULT_CONTENT_TYPE = 'text/plain';

export function useContentType({ model, formatAction, currentContentType, elementKey, displayed }: UseContentTypeArgs): string {
  const autoContentType = useAutoContentType({ displayed, formatAction, model, elementKey });
  if (displayed.length === 0) {
    return currentContentType || DEFAULT_CONTENT_TYPE;
  }

  currentContentType = currentContentType || autoContentType;
  const hasCurrentTab = currentContentType && displayed.some(tab => tab.key === currentContentType);

  if (!hasCurrentTab) {
    currentContentType = currentContentType || displayed[0]!.key;
  }

  return currentContentType || DEFAULT_CONTENT_TYPE;
}

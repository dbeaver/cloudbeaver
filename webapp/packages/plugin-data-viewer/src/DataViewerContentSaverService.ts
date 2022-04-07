/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { GlobalConstants } from '@cloudbeaver/core-utils';

import type { IResultSetElementKey } from './DatabaseDataModel/Actions/ResultSet/IResultSetDataKey';
import { isResultSetContentValue } from './DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { ResultSetDataAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetDataAction';
import { ResultSetViewAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetViewAction';
import type { IDatabaseDataModel } from './DatabaseDataModel/IDatabaseDataModel';

const RESULT_VALUE_PATH = 'sql-result-value';

@injectable()
export class DataViewerContentSaverService {

  constructor(
    private readonly graphQLService: GraphQLService
  ) { }

  canSaveElementValue(
    model: IDatabaseDataModel,
    resultIndex: number,
    element: IResultSetElementKey
  ) {
    const view = model.source.getAction(resultIndex, ResultSetViewAction);
    const cellValue = view.getCellValue(element);

    return isResultSetContentValue(cellValue);
  }

  async getElementValueURL(
    model: IDatabaseDataModel,
    resultIndex: number,
    element: IResultSetElementKey
  ) {
    const result = model.getResult(resultIndex);
    const data = model.source.getAction(resultIndex, ResultSetDataAction);
    const column = data.getColumn(element.column);
    const row = data.getRowValue(element.row);

    if (!result?.id || !row || !column) {
      return;
    }

    const response = await this.graphQLService.sdk.getResultsetDataURL({
      resultsId: result.id,
      connectionId: result.connectionId,
      contextId: result.contextId,
      lobColumnIndex: column.position,
      row: {
        data: row,
      },
    });

    return `${GlobalConstants.serviceURI}/${RESULT_VALUE_PATH}/${response.url}`;
  }
}
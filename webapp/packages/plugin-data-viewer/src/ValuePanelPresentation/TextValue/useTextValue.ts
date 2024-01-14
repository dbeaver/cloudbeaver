import { isNotNullDefined } from '@cloudbeaver/core-utils';

import { isResultSetBinaryFileValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBinaryFileValue';
import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import { useResultActions } from '../../DatabaseDataModel/Actions/ResultSet/useResultActions';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import { useAutoFormat } from './useAutoFormat';

interface IUseTextValueArgs {
  resultIndex: number;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
  currentContentType: string;
}

interface IUseTextValue {
  textValue: string;
  isFullTextValue: boolean;
  isTruncated: boolean;
  isTextColumn: boolean;
}

export function useTextValue({ model, resultIndex, currentContentType }: IUseTextValueArgs): IUseTextValue {
  const { formatAction, editAction, contentAction, dataAction } = useResultActions({ model, resultIndex });
  const selection = model.source.getAction(resultIndex, ResultSetSelectAction);
  const activeElements = selection.getActiveElements();
  const firstSelectedCell = activeElements?.[0];
  const formatter = useAutoFormat();
  const columnType = firstSelectedCell ? dataAction.getColumn(firstSelectedCell.column)?.dataKind : '';
  const isTextColumn = columnType?.toLocaleLowerCase() === 'string';
  const contentValue = firstSelectedCell ? formatAction.get(firstSelectedCell) : null;
  const cachedFullText = firstSelectedCell ? contentAction.retrieveFileFullTextFromCache(firstSelectedCell) : '';
  const blob = firstSelectedCell ? formatAction.get(firstSelectedCell) : null;
  const result: IUseTextValue = {
    textValue: '',
    isFullTextValue: false,
    isTruncated: false,
    isTextColumn,
  };

  if (!isNotNullDefined(firstSelectedCell)) {
    return result;
  }

  if (isResultSetContentValue(contentValue)) {
    result.isTruncated = contentAction.isContentTruncated(contentValue);
  }

  if (isTextColumn && cachedFullText) {
    result.textValue = cachedFullText;
    result.isFullTextValue = true;
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

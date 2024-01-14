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

// TODO tell Ainur about extra space bug
// TODO refactor the logic
// TODO isFullText flag instead of fullTextValue
export function useTextValue({ model, resultIndex, currentContentType }: IUseTextValueArgs): IUseTextValue {
  const { formatAction, editAction, contentAction, dataAction } = useResultActions({ model, resultIndex });
  const selection = model.source.getAction(resultIndex, ResultSetSelectAction);
  const activeElements = selection.getActiveElements();
  const firstSelectedCell = activeElements?.[0];
  const formatter = useAutoFormat();

  if (!isNotNullDefined(firstSelectedCell)) {
    return {
      textValue: '',
      isFullTextValue: false,
      isTruncated: false,
      isTextColumn: false,
    };
  }

  const contentValue = formatAction.get(firstSelectedCell);
  let isTruncated = false;

  if (isResultSetContentValue(contentValue)) {
    isTruncated = contentAction.isContentTruncated(contentValue);
  }

  const cachedFullText = contentAction.retrieveFileFullTextFromCache(firstSelectedCell);
  const columnType = dataAction.getColumn(firstSelectedCell.column)?.dataKind;
  const isTextColumn = columnType?.toLocaleLowerCase() === 'string';

  if (isTextColumn && cachedFullText) {
    return {
      textValue: cachedFullText,
      isFullTextValue: true,
      isTruncated,
      isTextColumn,
    };
  }

  if (editAction.isElementEdited(firstSelectedCell)) {
    return {
      textValue: formatAction.getText(firstSelectedCell),
      isFullTextValue: false,
      isTruncated,
      isTextColumn,
    };
  }

  const blob = formatAction.get(firstSelectedCell);

  if (isResultSetBinaryFileValue(blob)) {
    const value = formatter.formatBlob(currentContentType, blob);

    if (value) {
      return {
        textValue: value,
        isFullTextValue: false,
        isTruncated,
        isTextColumn,
      };
    }
  }

  return {
    textValue: formatter.format(currentContentType, formatAction.getText(firstSelectedCell)),
    isFullTextValue: false,
    isTruncated,
    isTextColumn,
  };
}

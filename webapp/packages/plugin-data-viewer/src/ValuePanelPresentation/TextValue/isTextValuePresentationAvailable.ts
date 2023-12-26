import { isResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBlobValue';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import { ResultSetViewAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetViewAction';
import type { IDatabaseDataResult } from '../../DatabaseDataModel/IDatabaseDataResult';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';
import { isImageValuePresentationAvailable } from '../ImageValue/isImageValuePresentationAvailable';

export function isBlobPresentationAvailable(context: IDataValuePanelProps<any, IDatabaseDataResult> | undefined): boolean {
  if (!context?.model.source.hasResult(context.resultIndex)) {
    return true;
  }

  const selection = context.model.source.getAction(context.resultIndex, ResultSetSelectAction);

  const focusedElement = selection.getFocusedElement();

  if (selection.elements.length > 0 || focusedElement) {
    const view = context.model.source.getAction(context.resultIndex, ResultSetViewAction);

    const firstSelectedCell = selection.elements[0] || focusedElement;

    const cellValue = view.getCellValue(firstSelectedCell);

    return isResultSetBlobValue(cellValue) && !isImageValuePresentationAvailable(cellValue);
  }

  return true;
}

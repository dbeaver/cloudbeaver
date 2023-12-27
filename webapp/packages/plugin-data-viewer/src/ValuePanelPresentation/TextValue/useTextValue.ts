import { useEffect, useState } from 'react';

import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { ResultSetEditAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetEditAction';
import { ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import { useAutoFormat } from './useAutoFormat';

type Props = {
  resultIndex: number;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
  currentContentType: string;
};

export function useTextValue({ model, resultIndex, currentContentType }: Props) {
  const format = model.source.getAction(resultIndex, ResultSetFormatAction);
  const editor = model.source.getAction(resultIndex, ResultSetEditAction);
  const selection = model.source.getAction(resultIndex, ResultSetSelectAction);
  const focusCell = selection.getFocusedElement();
  const formatter = useAutoFormat();
  const [value, setValue] = useState<string>('');
  const firstSelectedCell = selection.elements?.[0] ?? focusCell;
  const autoFormat = !!firstSelectedCell && !editor.isElementEdited(firstSelectedCell);

  useEffect(() => {
    if (!autoFormat) {
      return;
    }

    const candidate = format.get(firstSelectedCell);

    if (isResultSetContentValue(candidate)) {
      formatter.formatBlob(currentContentType, candidate).then(data => {
        data && setValue(data);
      });
      return;
    }

    setValue(formatter.format(currentContentType, format.getText(firstSelectedCell)));
  }, [autoFormat, currentContentType, firstSelectedCell, format, formatter]);

  return value;
}

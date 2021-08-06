/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { ResultSetDataAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataAction';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import { DataValuePanelService } from '../../TableViewer/ValuePanel/DataValuePanelService';
import { BooleanValuePresentation } from './BooleanValuePresentation';
import { isBooleanValuePresentationAvailable } from './isBooleanValuePresentationAvailable';

@injectable()
export class BooleanValuePresentationBootstrap extends Bootstrap {
  constructor(private readonly dataValuePanelService: DataValuePanelService) {
    super();
  }

  register(): void {
    this.dataValuePanelService.add({
      key: 'boolean-presentation',
      options: { dataFormat: [ResultDataFormat.Resultset] },
      name: 'boolean',
      order: 1,
      panel: () => BooleanValuePresentation,
      isHidden: (_, context) => {
        if (!context || !context.model.source.hasResult(context.resultIndex)) {
          return true;
        }

        const selection = context.model.source.getAction(context.resultIndex, ResultSetSelectAction);

        const selectedCells = selection.getSelectedElements();
        const focusedElement = selection.getFocusedElement();

        if (selectedCells.length > 0 || focusedElement) {
          const data = context.model.source.getAction(context.resultIndex, ResultSetDataAction);
          const editor = context.model.source.getEditor(context.resultIndex);

          const firstSelectedCell = selectedCells[0] || focusedElement;
          const cellValue = editor.getCell(firstSelectedCell.row, firstSelectedCell.column);
          const column = data.getColumn(firstSelectedCell.column);

          return column === undefined || !isBooleanValuePresentationAvailable(cellValue, column);
        }

        return true;
      },
    });
  }

  load(): void { }
}

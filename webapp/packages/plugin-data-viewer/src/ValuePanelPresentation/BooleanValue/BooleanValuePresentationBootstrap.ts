/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import { ResultSetViewAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetViewAction';
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

        const focusedElement = selection.getFocusedElement();

        if (selection.elements.length > 0 || focusedElement) {
          const view = context.model.source.getAction(context.resultIndex, ResultSetViewAction);

          const firstSelectedCell = selection.elements[0] || focusedElement;
          const cellValue = view.getCellValue(firstSelectedCell);

          if (cellValue === undefined) {
            return true;
          }

          const column = view.getColumn(firstSelectedCell.column);

          return column === undefined || !isBooleanValuePresentationAvailable(cellValue, column);
        }

        return true;
      },
    });
  }

  load(): void { }
}

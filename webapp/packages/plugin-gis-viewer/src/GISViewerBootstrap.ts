/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { DataValuePanelService, ResultSetSelectAction } from '@cloudbeaver/plugin-data-viewer';

import { GISValuePresentation } from './GISValuePresentation';
import { ResultSetGISAction } from './ResultSetGISAction';

@injectable()
export class GISViewerBootstrap extends Bootstrap {
  constructor(private readonly dataValuePanelService: DataValuePanelService) {
    super();
  }

  register(): void | Promise<void> {
    this.dataValuePanelService.add({
      key: 'gis-presentation',
      options: { dataFormat: [ResultDataFormat.Resultset] },
      name: 'gis_presentation_title',
      order: 10,
      panel: () => GISValuePresentation,
      isHidden: (_, context) => {
        if (!context || !context.model.source.hasResult(context.resultIndex)) {
          return true;
        }

        const selection = context.model.source.getAction(context.resultIndex, ResultSetSelectAction);
        const gis = context.model.source.getAction(context.resultIndex, ResultSetGISAction);

        const focusedElement = selection.getFocusedElement();

        if (focusedElement) {
          return !gis.isGISFormat(focusedElement);
        }

        const selectedCells = selection.getSelectedElements();

        if (selectedCells.length > 0) {
          const firstSelectedCell = selectedCells[0];

          return !gis.isGISFormat(firstSelectedCell);
        }

        return true;
      },
    });
  }

  load(): void { }
}

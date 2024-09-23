/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction.js';
import { ResultSetViewAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetViewAction.js';
import { isResultSetDataSource } from '../../ResultSet/ResultSetDataSource.js';
import { DataValuePanelService } from '../../TableViewer/ValuePanel/DataValuePanelService.js';
import { isImageValuePresentationAvailable } from './isImageValuePresentationAvailable.js';

const ImageValuePresentation = importLazyComponent(() => import('./ImageValuePresentation.js').then(module => module.ImageValuePresentation));

@injectable()
export class ImageValuePresentationBootstrap extends Bootstrap {
  constructor(private readonly dataValuePanelService: DataValuePanelService) {
    super();
  }

  override register(): void | Promise<void> {
    this.dataValuePanelService.add({
      key: 'image-presentation',
      options: {
        dataFormat: [ResultDataFormat.Resultset],
      },
      name: 'data_viewer_presentation_value_image_title',
      order: 1,
      panel: () => ImageValuePresentation,
      isHidden: (_, context) => {
        const source = context?.model.source as any;
        if (!context?.model.source.hasResult(context.resultIndex) || !isResultSetDataSource(source)) {
          return true;
        }

        const selection = source.getAction(context.resultIndex, ResultSetSelectAction);

        const activeElements = selection.getActiveElements();

        if (activeElements.length > 0) {
          const view = source.getAction(context.resultIndex, ResultSetViewAction);

          const firstSelectedCell = activeElements[0]!;

          const cellValue = view.getCellValue(firstSelectedCell);

          return !isImageValuePresentationAvailable(cellValue);
        }

        return true;
      },
    });
  }
}

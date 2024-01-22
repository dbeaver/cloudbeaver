/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import { ResultSetViewAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetViewAction';
import { DataValuePanelService } from '../../TableViewer/ValuePanel/DataValuePanelService';
import { ImageValuePresentation } from './ImageValuePresentation';
import { isImageValuePresentationAvailable } from './isImageValuePresentationAvailable';

@injectable()
export class ImageValuePresentationBootstrap extends Bootstrap {
  constructor(private readonly dataValuePanelService: DataValuePanelService) {
    super();
  }

  register(): void | Promise<void> {
    this.dataValuePanelService.add({
      key: 'image-presentation',
      options: { dataFormat: [ResultDataFormat.Resultset] },
      name: 'data_viewer_presentation_value_image_title',
      order: 1,
      panel: () => ImageValuePresentation,
      isHidden: (_, context) => {
        if (!context?.model.source.hasResult(context.resultIndex)) {
          return true;
        }

        const selection = context.model.source.getAction(context.resultIndex, ResultSetSelectAction);

        const activeElements = selection.getActiveElements();

        if (activeElements.length > 0) {
          const view = context.model.source.getAction(context.resultIndex, ResultSetViewAction);

          const firstSelectedCell = activeElements[0];

          const cellValue = view.getCellValue(firstSelectedCell);

          return !isImageValuePresentationAvailable(cellValue);
        }

        return true;
      },
    });
  }

  load(): void {}
}

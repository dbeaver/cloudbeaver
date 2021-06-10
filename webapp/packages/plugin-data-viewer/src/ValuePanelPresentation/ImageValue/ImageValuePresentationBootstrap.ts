/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { getMIME } from '@cloudbeaver/core-utils';

import type { IResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/IResultSetContentValue';
import { ResultSetDataAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataAction';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import { DataValuePanelService } from '../../TableViewer/ValuePanel/DataValuePanelService';
import { ImageValuePresentation } from './ImageValuePresentation';

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
        if (!context || !context.model.source.hasResult(context.resultIndex)) {
          return true;
        }

        const selection = context.model.source.getAction(context.resultIndex, ResultSetSelectAction);
        const data = context.model.source.getAction(context.resultIndex, ResultSetDataAction);

        const selectedCells = selection.getSelectedElements();
        const focusedElement = selection.getFocusedElement();

        if (selectedCells.length > 0 || focusedElement) {
          const firstSelectedCell = selectedCells[0] || focusedElement;
          return !this.isImage(data.getContent(firstSelectedCell));
        }

        return true;
      },
    });
  }

  load(): void { }

  private isImage(value: IResultSetContentValue | null) {
    if (value !== null && 'binary' in value) {
      return getMIME(value.binary || '') !== null;
    }

    return false;
  }
}

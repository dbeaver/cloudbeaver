/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { lazy } from 'react';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { DataValuePanelService, ResultSetSelectAction } from '@cloudbeaver/plugin-data-viewer';

import { ResultSetGISAction } from './ResultSetGISAction';

const GISViewer = lazy(async () => {
  const { GISViewer } = await import('./GISViewer');

  return { default: GISViewer };
});

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
      panel: () => GISViewer,
      isHidden: (_, context) => {
        if (!context || !context.model.source.hasResult(context.resultIndex)) {
          return true;
        }

        const selection = context.model.source.getAction(context.resultIndex, ResultSetSelectAction);
        const gis = context.model.source.getAction(context.resultIndex, ResultSetGISAction);

        const focusedElement = selection.getFocusedElement();

        if (selection.elements.length === 0) {
          if (!focusedElement) {
            return true;
          }
          return !gis.isGISFormat(focusedElement);
        } else {
          return !gis.isGISFormat(selection.elements[0]);
        }
      },
    });
  }

  load(): void {}
}

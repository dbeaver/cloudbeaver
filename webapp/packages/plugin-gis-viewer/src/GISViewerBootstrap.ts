/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { lazy } from 'react';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { DataValuePanelService, isResultSetDataSource, ResultSetSelectAction } from '@cloudbeaver/plugin-data-viewer';

import { ResultSetGISAction } from './ResultSetGISAction.js';

const GISViewer = lazy(async () => {
  const { GISViewer } = await import('./GISViewer.js');

  return { default: GISViewer };
});

@injectable()
export class GISViewerBootstrap extends Bootstrap {
  constructor(private readonly dataValuePanelService: DataValuePanelService) {
    super();
  }

  override register(): void | Promise<void> {
    this.dataValuePanelService.add({
      key: 'gis-presentation',
      options: {
        dataFormat: [ResultDataFormat.Resultset],
      },
      name: 'gis_presentation_title',
      order: 10,
      panel: () => GISViewer,
      isHidden: (_, context) => {
        const source = context?.model.source as any;
        if (!isResultSetDataSource(source) || !context || !source.hasResult(context.resultIndex)) {
          return true;
        }

        const selection = source.getAction(context.resultIndex, ResultSetSelectAction);
        const gis = source.getAction(context.resultIndex, ResultSetGISAction);

        const activeElements = selection.getActiveElements();

        if (activeElements.length === 0) {
          return true;
        } else {
          return !gis.isGISFormat(activeElements[0]!);
        }
      },
    });
  }
}

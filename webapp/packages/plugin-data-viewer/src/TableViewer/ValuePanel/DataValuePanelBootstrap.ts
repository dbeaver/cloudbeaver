/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { DatabaseDataResultAction } from '../../DatabaseDataModel/Actions/DatabaseDataResultAction.js';
import { DataPresentationService, DataPresentationType } from '../../DataPresentationService.js';
import { DataValuePanelService } from './DataValuePanelService.js';

export const ValuePanel = React.lazy(async () => {
  const { ValuePanel } = await import('./ValuePanel.js');
  return { default: ValuePanel };
});

@injectable()
export class DataValuePanelBootstrap extends Bootstrap {
  constructor(
    private readonly dataPresentationService: DataPresentationService,
    private readonly dataValuePanelService: DataValuePanelService,
  ) {
    super();
  }

  override register(): void | Promise<void> {
    this.dataPresentationService.add({
      id: 'value-text-presentation',
      type: DataPresentationType.toolsPanel,
      title: 'data_viewer_presentation_value_title',
      icon: 'value-panel',
      hidden: (dataFormat, model, resultIndex) => {
        if (!model.source.hasResult(resultIndex)) {
          return true;
        }

        const data = model.source.getActionImplementation(resultIndex, DatabaseDataResultAction);
        return data?.empty || this.dataValuePanelService.getDisplayed({ model, resultIndex, dataFormat }).length === 0;
      },
      getPresentationComponent: () => ValuePanel,
    });
  }
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { DataPresentationService, DataPresentationType } from '../../DataPresentationService';
import { DataValuePanelService } from './DataValuePanelService';
import { ValuePanel } from './ValuePanel';

@injectable()
export class DataValuePanelBootstrap extends Bootstrap {
  constructor(
    private readonly dataPresentationService: DataPresentationService,
    private readonly dataValuePanelService: DataValuePanelService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.dataPresentationService.add({
      id: 'value-text-presentation',
      type: DataPresentationType.toolsPanel,
      title: 'data_viewer_presentation_value_title',
      icon: 'value-panel',
      hidden: (
        dataFormat,
        model,
        resultIndex
      ) => this.dataValuePanelService.getDisplayed({ model, resultIndex, dataFormat }).length === 0,
      getPresentationComponent: () => ValuePanel,
    });
  }

  load(): void { }
}

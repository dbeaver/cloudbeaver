/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DataValuePanelService } from '../../TableViewer/ValuePanel/DataValuePanelService';
import { TextValuePresentation } from './TextValuePresentation';

@injectable()
export class TextValuePresentationBootstrap extends Bootstrap {
  constructor(private readonly dataValuePanelService: DataValuePanelService) {
    super();
  }

  register(): void | Promise<void> {
    this.dataValuePanelService.add({
      key: 'text-presentation',
      options: { dataFormat: [ResultDataFormat.Resultset] },
      name: 'data_viewer_presentation_value_text_title',
      order: Number.MAX_SAFE_INTEGER,
      panel: () => TextValuePresentation,
    });
  }

  load(): void { }
}

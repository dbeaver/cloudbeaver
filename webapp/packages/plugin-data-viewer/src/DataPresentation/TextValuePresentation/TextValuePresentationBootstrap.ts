/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DataPresentationService, DataPresentationType } from '../../DataPresentationService';
import { TextValuePresentation } from './TextValuePresentation';

@injectable()
export class TextValuePresentationBootstrap extends Bootstrap {
  constructor(private readonly dataPresentationService: DataPresentationService) {
    super();
  }

  register(): void | Promise<void> {
    this.dataPresentationService.add({
      id: 'value-text-presentation',
      dataFormat: ResultDataFormat.Resultset,
      type: DataPresentationType.value,
      title: 'data_viewer_presentation_value_title',
      icon: '/icons/text_value_presentation.png',
      getPresentationComponent: () => TextValuePresentation,
    });
  }

  load(): void {}
}

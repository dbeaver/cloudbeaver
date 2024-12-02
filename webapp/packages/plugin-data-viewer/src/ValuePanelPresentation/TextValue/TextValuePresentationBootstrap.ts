/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { isResultSetDataSource } from '../../ResultSet/ResultSetDataSource.js';
import { DataValuePanelService } from '../../TableViewer/ValuePanel/DataValuePanelService.js';
import { isBlobPresentationAvailable } from './isTextValuePresentationAvailable.js';
import { TextValuePresentationService } from './TextValuePresentationService.js';

const TextValuePresentation = importLazyComponent(() => import('./TextValuePresentation.js').then(module => module.TextValuePresentation));

@injectable()
export class TextValuePresentationBootstrap extends Bootstrap {
  constructor(
    private readonly textValuePresentationService: TextValuePresentationService,
    private readonly dataValuePanelService: DataValuePanelService,
  ) {
    super();
  }

  override register(): void {
    this.dataValuePanelService.add({
      key: 'text-presentation',
      options: {
        dataFormat: [ResultDataFormat.Resultset],
      },
      name: 'data_viewer_presentation_value_text_title',
      order: Number.MAX_SAFE_INTEGER,
      panel: () => TextValuePresentation,
      isHidden(_, props) {
        return !props || !props.model.source.hasResult(props.resultIndex) || !isResultSetDataSource(props.model.source);
      },
    });

    this.textValuePresentationService.add({
      key: 'text/plain',
      name: 'data_viewer_presentation_value_text_plain_title',
      order: Number.MAX_SAFE_INTEGER,
      panel: () => React.Fragment,
    });
    this.textValuePresentationService.add({
      key: 'text/html',
      name: 'data_viewer_presentation_value_text_html_title',
      order: Number.MAX_SAFE_INTEGER,
      panel: () => React.Fragment,
      // isHidden: (_, context) => isBlobPresentationAvailable(context),
    });
    this.textValuePresentationService.add({
      key: 'text/xml',
      name: 'data_viewer_presentation_value_text_xml_title',
      order: Number.MAX_SAFE_INTEGER,
      panel: () => React.Fragment,
      // isHidden: (_, context) => isBlobPresentationAvailable(context),
    });
    this.textValuePresentationService.add({
      key: 'application/json',
      name: 'data_viewer_presentation_value_text_json_title',
      order: Number.MAX_SAFE_INTEGER,
      panel: () => React.Fragment,
      // isHidden: (_, context) => isBlobPresentationAvailable(context),
    });

    this.textValuePresentationService.add({
      key: 'application/octet-stream;type=hex',
      name: 'data_viewer_presentation_value_text_hex_title',
      order: Number.MAX_SAFE_INTEGER,
      panel: () => React.Fragment,
      isHidden: (_, context) => !isBlobPresentationAvailable(context),
    });
    this.textValuePresentationService.add({
      key: 'application/octet-stream;type=base64',
      name: 'data_viewer_presentation_value_text_base64_title',
      order: Number.MAX_SAFE_INTEGER,
      panel: () => React.Fragment,
      isHidden: (_, context) => !isBlobPresentationAvailable(context),
    });
  }
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { isResultSetDataSource } from '../../ResultSet/ResultSetDataSource.js';
import { DataValuePanelService, type IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService.js';
import { isBlobPresentationAvailable } from './isTextValuePresentationAvailable.js';

const TextValuePresentation = importLazyComponent(() => import('./TextValuePresentation.js').then(module => module.TextValuePresentation));

const PRESENTATIONS = [
  {
    key: 'text/plain',
    name: 'data_viewer_presentation_value_text_title',
  },
  {
    key: 'text/html',
    name: 'data_viewer_presentation_value_text_html_title',
  },
  {
    key: 'text/xml',
    name: 'data_viewer_presentation_value_text_xml_title',
  },
  {
    key: 'application/json',
    name: 'data_viewer_presentation_value_text_json_title',
  },
  {
    key: 'application/octet-stream;type=hex',
    name: 'data_viewer_presentation_value_text_hex_title',
    isHidden: (context: IDataValuePanelProps | undefined) => !isBlobPresentationAvailable(context),
  },
  {
    key: 'application/octet-stream;type=base64',
    name: 'data_viewer_presentation_value_text_base64_title',
    isHidden: (context: IDataValuePanelProps | undefined) => !isBlobPresentationAvailable(context),
  },
];

@injectable(() => [DataValuePanelService])
export class TextValuePresentationBootstrap extends Bootstrap {
  constructor(private readonly dataValuePanelService: DataValuePanelService) {
    super();
  }

  override register(): void {
    for (const presentation of PRESENTATIONS) {
      this.dataValuePanelService.add({
        key: presentation.key,
        options: {
          dataFormat: [ResultDataFormat.Resultset],
          isTextPresentation: true,
        },
        name: presentation.name,
        order: Number.MAX_SAFE_INTEGER,
        panel: () => TextValuePresentation,
        isHidden: (_, props) => {
          if (!props || !props.model.source.hasResult(props.resultIndex) || !isResultSetDataSource(props.model.source)) {
            return true;
          }

          if (!presentation.isHidden) {
            return false;
          }

          return presentation.isHidden({
            dataFormat: props.dataFormat,
            model: props.model,
            resultIndex: props.resultIndex,
          });
        },
      });
    }
  }
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
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

export class TextValuePresentationBootstrapImpl extends Bootstrap {
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

export type TextValuePresentationBootstrap = TextValuePresentationBootstrapImpl;

export class TextValuePresentationBootstrapDI extends Context.Service<TextValuePresentationBootstrapDI, TextValuePresentationBootstrapImpl>()(
  '@cloudbeaver/plugin-data-viewer/ValuePanelPresentation/TextValue/TextValuePresentationBootstrap#TextValuePresentationBootstrap',
) {
  static readonly implementation = TextValuePresentationBootstrapImpl;

  static readonly dependencies = () => [DataValuePanelService] as const;
  static readonly make: Effect.Effect<TextValuePresentationBootstrapImpl, never, Context.Service.Identifier<typeof DataValuePanelService>> =
    Effect.gen(function* makeTextValuePresentationBootstrap() {
      const dataValuePanelService = yield* DataValuePanelService;

      return new TextValuePresentationBootstrapImpl(dataValuePanelService);
    });
  static readonly layer: Layer.Layer<TextValuePresentationBootstrapDI, never, Context.Service.Identifier<typeof DataValuePanelService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const TextValuePresentationBootstrap = TextValuePresentationBootstrapDI;

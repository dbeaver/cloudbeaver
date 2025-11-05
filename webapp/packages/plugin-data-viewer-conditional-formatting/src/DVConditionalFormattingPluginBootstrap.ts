/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DataPresentationService, DataPresentationType, GridDataResultAction, IDatabaseDataResultAction } from '@cloudbeaver/plugin-data-viewer';

const ConditionalFormattingPresentation = importLazyComponent(() =>
  import('./presentation/ConditionalFormattingPresentation.js').then(module => module.ConditionalFormattingPresentation),
);

@injectable(() => [DataPresentationService])
export class DVConditionalFormattingPluginBootstrap extends Bootstrap {
  constructor(private readonly dataPresentationService: DataPresentationService) {
    super();
  }

  override register(): void {
    this.registerPresentation();
  }

  private registerPresentation(): void {
    this.dataPresentationService.add({
      id: 'conditional-formatting-presentation',
      type: DataPresentationType.toolsPanel,
      title: 'plugin_data_viewer_conditional_formatting_presentation_title',
      icon: '/icons/conditional_formatting_sm.svg',
      hidden: (dataFormat, model, resultIndex) => {
        if (!model.source.hasResult(resultIndex) || true) {
          return true;
        }

        // @ts-expect-error feature disabled for now
        const data = model.source.tryGetAction(resultIndex, IDatabaseDataResultAction, GridDataResultAction);
        return data?.empty ?? true;
      },
      getPresentationComponent: () => ConditionalFormattingPresentation,
    });
  }
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { DatabaseEditAction, TableFooterMenuService } from '@cloudbeaver/plugin-data-viewer';

import { ScriptPreviewService } from './ScriptPreview/ScriptPreviewService';

@injectable()
export class GeneratorMenuBootstrap extends Bootstrap {
  constructor(private readonly scriptPreviewService: ScriptPreviewService, private readonly tableFooterMenuService: TableFooterMenuService) {
    super();
  }

  register(): void {
    this.tableFooterMenuService.registerMenuItem({
      id: 'script',
      order: 3,
      title: 'data_viewer_script_preview',
      tooltip: 'data_viewer_script_preview',
      icon: 'sql-script-preview',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      isHidden(context) {
        return (
          context.data.model.isReadonly(context.data.resultIndex) ||
          context.data.model.source.getResult(context.data.resultIndex)?.dataFormat !== ResultDataFormat.Resultset
        );
      },
      isDisabled(context) {
        if (
          context.data.model.isLoading() ||
          context.data.model.isDisabled(context.data.resultIndex) ||
          !context.data.model.source.hasResult(context.data.resultIndex)
        ) {
          return true;
        }
        const editor = context.data.model.source.getActionImplementation(context.data.resultIndex, DatabaseEditAction);
        return !editor?.isEdited();
      },
      onClick: async context => {
        await this.scriptPreviewService.open(context.data.model, context.data.resultIndex);
      },
    });
  }

  load(): void | Promise<void> {}
}

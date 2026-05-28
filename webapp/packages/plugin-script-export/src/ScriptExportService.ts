/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { TabsContainer } from '@cloudbeaver/core-ui';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ExportScriptDialog } from './ExportScriptDialog/ExportScriptDialogLazy.js';

export interface IScriptExportTabProps {
  script: string;
  fileName: string;
  editorId: string;
  projectId?: string;
  connectionId?: string;
}

@injectable(() => [CommonDialogService])
export class ScriptExportService {
  readonly tabsContainer: TabsContainer<IScriptExportTabProps>;

  constructor(private readonly commonDialogService: CommonDialogService) {
    this.tabsContainer = new TabsContainer('script_export_tabs');
  }

  openExportDialog(props: IScriptExportTabProps) {
    return this.commonDialogService.open(ExportScriptDialog, props);
  }
}

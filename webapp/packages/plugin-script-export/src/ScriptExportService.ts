/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { TabsContainer } from '@cloudbeaver/core-ui';
import { ExportScriptDialog } from './ExportScriptDialog/ExportScriptDialogLazy.js';

export interface IScriptExportTabProps {
  script: string;
  fileName: string;
  editorId: string;
  projectId?: string;
  connectionId?: string;
}

export class ScriptExportServiceImpl {
  readonly tabsContainer: TabsContainer<IScriptExportTabProps>;

  constructor(private readonly commonDialogService: CommonDialogService) {
    this.tabsContainer = new TabsContainer('script_export_tabs');
  }

  openExportDialog(props: IScriptExportTabProps) {
    return this.commonDialogService.open(ExportScriptDialog, props);
  }
}

export type ScriptExportService = ScriptExportServiceImpl;

export class ScriptExportServiceDI extends Context.Service<ScriptExportServiceDI, ScriptExportServiceImpl>()(
  '@cloudbeaver/plugin-script-export/ScriptExportService#ScriptExportService',
) {
  static readonly implementation = ScriptExportServiceImpl;

  static readonly dependencies = () => [CommonDialogService] as const;
  static readonly make: Effect.Effect<ScriptExportServiceImpl, never, Context.Service.Identifier<typeof CommonDialogService>> = Effect.gen(
    function* makeScriptExportService() {
      const commonDialogService = yield* CommonDialogService;

      return new ScriptExportServiceImpl(commonDialogService);
    },
  );
  static readonly layer: Layer.Layer<ScriptExportServiceDI, never, Context.Service.Identifier<typeof CommonDialogService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ScriptExportService = ScriptExportServiceDI;

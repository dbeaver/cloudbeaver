/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IScriptExportTabProps {
  script: string;
  fileName: string;
  editorId: string;
  projectId?: string;
  connectionId?: string;
  /** Each tab must call this to register its export controller with the dialog */
  registerScriptExportController?: (controller: IScriptExportTabController) => void;
}

export interface IScriptExportTabController {
  export: () => string | Promise<string>;
  canExport?: () => boolean;
  isExporting?: () => boolean;
}

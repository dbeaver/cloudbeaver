/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { DDLViewerFooterService } from './DdlViewer/DDLViewerFooterService.js';
import { DdlViewerBootstrap } from './DdlViewerBootstrap.js';
import { ExtendedDDLResource } from './ExtendedDDLViewer/ExtendedDDLResource.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-ddl-viewer',

  services: () => [DDLViewerFooterService, ExtendedDDLResource],
  bootstraps: () => [DdlViewerBootstrap, LocaleService],
});

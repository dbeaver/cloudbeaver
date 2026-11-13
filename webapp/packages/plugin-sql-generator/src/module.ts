/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { GeneratorMenuBootstrap } from './GeneratorMenuBootstrap.js';
import { LocaleService } from './LocaleService.js';
import { ScriptPreviewService } from './ScriptPreview/ScriptPreviewService.js';
import { SqlGenerationService } from './SqlGenerators/SqlGenerationService.js';
import { SqlGeneratorsBootstrap } from './SqlGenerators/SqlGeneratorsBootstrap.js';
import { SqlGeneratorsResource } from './SqlGenerators/SqlGeneratorsResource.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-sql-generator',

  services: () => [SqlGeneratorsResource, SqlGenerationService, ScriptPreviewService],
  bootstraps: () => [GeneratorMenuBootstrap, SqlGeneratorsBootstrap, LocaleService],
});

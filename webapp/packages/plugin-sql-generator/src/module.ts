/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { SqlGeneratorsBootstrap } from './SqlGenerators/SqlGeneratorsBootstrap.js';
import { SqlGeneratorsResource } from './SqlGenerators/SqlGeneratorsResource.js';
import { ScriptPreviewService } from './ScriptPreview/ScriptPreviewService.js';
import { LocaleService } from './LocaleService.js';
import { GeneratorMenuBootstrap } from './GeneratorMenuBootstrap.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-sql-generator',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(SqlGeneratorsResource))
      .addSingleton(Bootstrap, GeneratorMenuBootstrap)
      .addSingleton(Bootstrap, SqlGeneratorsBootstrap)
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(SqlGeneratorsResource)
      .addSingleton(ScriptPreviewService);
  },
});

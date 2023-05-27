/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { GeneratorMenuBootstrap } from './GeneratorMenuBootstrap';
import { LocaleService } from './LocaleService';
import { ScriptPreviewService } from './ScriptPreview/ScriptPreviewService';
import { SqlGeneratorsBootstrap } from './SqlGenerators/SqlGeneratorsBootstrap';
import { SqlGeneratorsResource } from './SqlGenerators/SqlGeneratorsResource';

export const sqlGeneratorPlugin: PluginManifest = {
  info: {
    name: 'Sql Editor Generator plugin',
  },

  providers: [LocaleService, SqlGeneratorsBootstrap, SqlGeneratorsResource, ScriptPreviewService, GeneratorMenuBootstrap],
};

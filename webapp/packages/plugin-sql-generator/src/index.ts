/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import './module.js';
import { sqlGeneratorPlugin } from './manifest.js';

export * from './SqlGenerators/SqlGeneratorsResource.js';
export * from './SqlGenerators/SqlGeneratorsBootstrap.js';
export * from './actions/ACTION_SQL_GENERATE.js';

export { sqlGeneratorPlugin };
export default sqlGeneratorPlugin;

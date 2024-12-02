/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';

import { versionUpdatePlugin } from './manifest.js';

const VersionUpdate = importLazyComponent(() => import('./VersionUpdate.js').then(m => m.VersionUpdate));

export { VersionUpdate };

export default versionUpdatePlugin;

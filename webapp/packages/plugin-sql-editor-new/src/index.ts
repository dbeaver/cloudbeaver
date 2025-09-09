/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import './module.js';
import { sqlEditorNewPlugin } from './manifest.js';

export default sqlEditorNewPlugin;

export * from './SQLEditor/SQLCodeEditor/SQLCodeEditorLoader.js';
export * from './SQLEditor/useSqlDialectAutocompletion.js';
export * from './SQLEditor/useSqlDialectExtension.js';

#!/usr/bin/env node
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { runTests } from '@dbeaver/tests-runner';
import { fileURLToPath } from 'node:url';

runTests('core-cli', fileURLToPath(new URL('../configs/vitest.config.ts', import.meta.url)));

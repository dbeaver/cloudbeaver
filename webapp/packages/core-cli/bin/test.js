#!/usr/bin/env node
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { fileURLToPath } from 'node:url';
import { startVitest, parseCLI } from 'vitest/node';

process.title = 'core-test';

if (process.env.VITEST == null) {
  process.env.VITEST = 'test';
}

const { filter, options } = parseCLI(['vitest', ...process.argv.slice(2)]);
const configFile = fileURLToPath(new URL('../configs/vitest.config.ts', import.meta.url));

const vitest = await startVitest(process.env.VITEST, filter, {
  config: configFile,
  ...options,
});

await vitest.close();

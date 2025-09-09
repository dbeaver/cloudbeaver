#!/usr/bin/env node
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

// import nodeFs from 'node:fs';
// import nodePath from 'node:path';
import { startVitest, parseCLI, type VitestRunMode } from 'vitest/node';
// // @ts-expect-error
// import pnpApi from 'pnpapi';
// import { fileURLToPath } from 'node:url';

process.title = 'test';

if (process.env['VITEST'] == null) {
  process.env['VITEST'] = 'test';
}

// const currentWorkspaceDirectory = nodePath.join(pnpApi.getPackageInformation(pnpApi.topLevel).packageLocation, 'vitest.config.ts');
// const currentPackageDirectory = nodePath.join(pnpApi.getPackageInformation(pnpApi.findPackageLocator('.')).packageLocation, 'vitest.config.ts');

// let configFilePath: string | undefined = undefined;

// if (nodeFs.existsSync(currentWorkspaceDirectory)) {
//   configFilePath = currentWorkspaceDirectory;
// } else if (nodeFs.existsSync(currentPackageDirectory)) {
//   configFilePath = currentPackageDirectory;
// } else {
//   configFilePath = fileURLToPath(new URL('./vitest.config.js', import.meta.url));
// }
// console.log(configFilePath);

const { filter, options } = parseCLI(['vitest', ...process.argv.slice(2)]);

const vitest = await startVitest((process.env['VITEST'] as VitestRunMode) || 'test', filter, {
  root: process.cwd(),
  // config: configFilePath,
  ...options,
});

await vitest.close();

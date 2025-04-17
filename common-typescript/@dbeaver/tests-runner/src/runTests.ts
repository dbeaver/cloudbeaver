/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { startVitest, parseCLI, type VitestRunMode } from 'vitest/node';

export async function runTests(title: string, configUrl: string) {
  process.title = title;

  if (process.env['VITEST'] == null) {
    process.env['VITEST'] = 'test';
  }

  const { filter, options } = parseCLI(['vitest', ...process.argv.slice(2)]);

  const vitest = await startVitest(process.env['VITEST'] as VitestRunMode, filter, {
    config: configUrl,
    ...options,
  });

  await vitest.close();
}

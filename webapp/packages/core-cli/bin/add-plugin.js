#!/usr/bin/env node
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

process.title = 'core-add-plugin';

import { resolve, join } from 'node:path';
import { runner, Logger } from 'hygen';
import { execaCommand } from 'execa';
import enquirer from 'enquirer';

const templates = join(import.meta.dirname, '../_templates');
const currentDir = resolve();

const { success } = await runner(['plugin', 'new'], {
  templates,
  cwd: join(currentDir, 'packages'),
  logger: new Logger(console.log.bind(console)),
  debug: !!process.env.DEBUG,
  exec: (action, body) => {
    const opts = body && body.length > 0 ? { input: body } : {};
    return execaCommand(action, { ...opts, shell: true });
  },
  createPrompter: () => enquirer,
});

process.exit(success ? 0 : 1);

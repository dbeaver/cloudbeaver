#!/usr/bin/env node

'use strict';
process.title = 'core-add-plugin';

const { resolve, join } = require('path');
const { runner, Logger } = require('hygen');

const templates = join(__dirname, '../_templates');
const currentDir = resolve();

runner(['plugin', 'new'], {
  templates,
  cwd: join(currentDir, 'packages'),
  logger: new Logger(console.log.bind(console)),
  debug: !!process.env.DEBUG,
  exec: (action, body) => {
    const opts = body && body.length > 0 ? { input: body } : {};
    return require('execa').command(action, { ...opts, shell: true });
  },
  createPrompter: () => require('enquirer'),
}).then(({ success }) => process.exit(success ? 0 : 1));

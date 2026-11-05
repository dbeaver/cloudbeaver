/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { RuleTester } from 'eslint';
import parser from '@typescript-eslint/parser';

import rule from './noSyncComponentImport.js';

RuleTester.describe = describe;
RuleTester.it = it;

const directory = mkdtempSync(path.join(tmpdir(), 'cloudbeaver-import-rule-'));
after(() => rmSync(directory, { recursive: true, force: true }));
mkdirSync(path.join(directory, 'folder.js'));

for (const file of ['Component.tsx', 'Shared.ts', 'Shared.tsx', 'Component.view.tsx', 'folder.js/Component.tsx']) {
  writeFileSync(path.join(directory, file), 'export const value = 1;');
}

const filename = path.join(directory, 'index.ts');
const ruleTester = new RuleTester({ languageOptions: { parser } });
const error = { message: "Don't import/export .tsx files from .ts files directly, use React.lazy()." };

ruleTester.run('no-sync-component-import', rule, {
  valid: [
    { filename, code: "import type { Props } from './Component.js';" },
    { filename, code: "export type { Props } from './Component.js';" },
    { filename, code: "export type * from './Component.js';" },
    { filename, code: "import { value } from './Shared.js';" },
    { filename, code: "export * from './Shared';" },
    { filename, code: "import('./Component.js');" },
    { filename, code: "import { value } from './Missing.js';" },
    { filename, code: 'const value = 1; export { value };' },
    { filename: path.join(directory, 'View.tsx'), code: "import { value } from './Component.js';" },
    { filename: path.join(directory, 'types.d.ts'), code: "export { value } from './Component.js';" },
  ],
  invalid: [
    "import { value } from './Component.js';",
    "export * from './Component.js';",
    "export { value } from './Component.js';",
    "import './Component.js';",
    // With verbatimModuleSyntax these still emit a runtime import/export.
    "import { type Props } from './Component.js';",
    "export { type Props } from './Component.js';",
    "import { value } from './Component.view.js';",
    "import { value } from './folder.js/Component.js';",
    "import { value } from './Component.jsx';",
    "import { value } from './Component.tsx';",
    "import { value } from './Component.js?component';",
  ].map(code => ({ filename, code, errors: [error] })),
});

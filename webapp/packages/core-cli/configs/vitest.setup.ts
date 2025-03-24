/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { expect } from 'vitest';
import * as matchers from 'jest-extended';

// different machine has its own timezones and some tests can fail because of it
process.env.TZ = 'UTC';

expect.extend(matchers);

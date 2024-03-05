/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import crypto from 'crypto';
import 'reflect-metadata';

Object.defineProperty(global.self, 'crypto', {
  value: {
    getRandomValues: arr => crypto.randomBytes(arr.length),
  },
});

class BroadcastChannel {}

Object.defineProperty(global.self, 'BroadcastChannel', {
  value: BroadcastChannel,
});

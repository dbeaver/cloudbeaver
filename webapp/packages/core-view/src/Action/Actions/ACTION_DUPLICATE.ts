/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '../createAction.js';
import { KEY_BINDING_DUPLICATE } from '../KeyBinding/Bindings/KEY_BINDING_DUPLICATE.js';

export const ACTION_DUPLICATE = createAction('duplicate', {
  label: 'ui_duplicate',
  shortcuts: KEY_BINDING_DUPLICATE.transformedKeys,
});

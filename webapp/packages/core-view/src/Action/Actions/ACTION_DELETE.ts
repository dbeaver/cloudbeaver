/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '../createAction.js';
import { KEY_BINDING_DELETE } from '../KeyBinding/Bindings/KEY_BINDING_DELETE.js';

export const ACTION_DELETE = createAction('delete', {
  label: 'ui_delete',
  shortcuts: KEY_BINDING_DELETE.transformedKeys,
});

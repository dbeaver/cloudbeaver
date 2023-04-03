/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import React from 'react';

export const NavigationNodeControlLoader = React.lazy(async () => {
  const { NavigationNodeControl } = await import('./NavigationNodeControl');
  return { default: NavigationNodeControl };
});

export const NavigationNodeEditorLoader = React.lazy(async () => {
  const { NavigationNodeEditor } = await import('./NavigationNodeEditor');
  return { default: NavigationNodeEditor };
});
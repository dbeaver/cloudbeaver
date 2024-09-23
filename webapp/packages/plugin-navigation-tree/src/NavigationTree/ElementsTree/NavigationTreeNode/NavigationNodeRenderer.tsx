/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { NavigationNodeComponent } from '../NavigationNodeComponent.js';
import { NavigationNode } from './NavigationNode.js';
import { NavigationNodeDragged } from './NavigationNodeDragged.js';

export const NavigationNodeRenderer: NavigationNodeComponent = observer(function NavigationNodeRenderer({ dragging, ...rest }) {
  if (dragging) {
    return <NavigationNodeDragged {...rest} />;
  }

  return <NavigationNode {...rest} />;
});

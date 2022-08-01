/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { NavigationNodeComponent } from '../NavigationNodeComponent';
import { NavigationNode } from './NavigationNode';
import { NavigationNodeDragged } from './NavigationNodeDragged';

export const NavigationNodeRenderer: NavigationNodeComponent = observer(function NavigationNodeRenderer({
  dragging,
  ...rest
}) {

  if (dragging) {
    return <NavigationNodeDragged {...rest} />;
  }

  return <NavigationNode {...rest} />;
});
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type INodeRenderer, Node, type NodeComponent } from '@cloudbeaver/plugin-navigation-tree';

import { GroupNodeControl } from './GroupNodeControl.js';

export const groupNodeRenderer: INodeRenderer = () => GroupNodeRenderer;

const GroupNodeRenderer: NodeComponent = function GroupNodeRenderer(props) {
  return <Node {...props} controlRenderer={GroupNodeControl} />;
};

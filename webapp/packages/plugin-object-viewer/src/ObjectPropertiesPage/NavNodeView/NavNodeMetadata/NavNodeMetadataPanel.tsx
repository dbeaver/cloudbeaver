/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */


import type { NavNodeTransformViewComponent } from '@cloudbeaver/plugin-navigation-tree';

import { ObjectProperties } from './ObjectProperties';

export const NavNodeMetadataPanel: NavNodeTransformViewComponent = function NavNodeMetadataPanel({
  nodeId,
}) {
  return <ObjectProperties objectId={nodeId} />;
};

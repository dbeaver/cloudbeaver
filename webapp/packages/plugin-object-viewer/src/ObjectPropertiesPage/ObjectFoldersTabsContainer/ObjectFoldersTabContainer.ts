/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { TabContainerEntity } from '@cloudbeaver/core-app';

import { NodePropertiesMixin } from './NodePropertiesMixin';

export class ObjectFoldersTabContainer extends TabContainerEntity {

  constructor(nodeId: string) {
    super([], nodeId);
    const nodePropertiesMixin = new NodePropertiesMixin(nodeId);
    this.addMixin(NodePropertiesMixin, nodePropertiesMixin);
  }

}

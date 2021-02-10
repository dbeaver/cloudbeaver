/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { useService } from '@cloudbeaver/core-di';

import { NodePropertiesMixin } from '../ObjectFoldersTabsContainer/NodePropertiesMixin';
import { ObjectProperties } from './ObjectProperties';

export const ObjectInfoTab = observer(function ObjectInfoTab() {
  const nodePropertiesMixin = useService(NodePropertiesMixin);
  return (
    <ObjectProperties objectId={nodePropertiesMixin.nodeId} />
  );
});

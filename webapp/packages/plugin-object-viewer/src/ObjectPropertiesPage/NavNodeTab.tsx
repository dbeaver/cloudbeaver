/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { getComputed, Loader, s, useS, useStateDelay } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { DBObjectResource } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList } from '@cloudbeaver/core-resource';
import { Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';
import { useChildren, useNode } from '@cloudbeaver/plugin-navigation-tree';

import style from './NavNodeTab.module.css';

interface INavNodeTabProps {
  nodeId: string;
}

export const NavNodeTab = observer<INavNodeTabProps>(function NavNodeTab({ nodeId }) {
  const nodeInfo = useNode(nodeId);
  const children = useChildren(nodeId);
  const dbObjectResource = useService(DBObjectResource);
  const childrenList = resourceKeyList(children.children || []);
  const styles = useS(style);

  const loading = useStateDelay(
    getComputed(
      () =>
        (nodeInfo.isLoaded() && nodeInfo.isLoading()) ||
        (children.isLoaded() && children.isLoading()) ||
        (dbObjectResource.isLoaded(childrenList) && dbObjectResource.isLoading(childrenList)),
    ),
    300,
  );

  return (
    <Tab tabId={nodeId} title={nodeInfo.node?.name}>
      {nodeInfo.node?.icon && <TabIcon icon={nodeInfo.node.icon} />}
      <TabTitle>{nodeInfo.node?.name}</TabTitle>
      <div className={s(styles, { tabLoader: true })}>
        <Loader loading={loading} small />
      </div>
    </Tab>
  );
});

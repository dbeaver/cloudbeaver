/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { DBObjectResource, NavNodeInfoResource, NavNodeTransformViewComponent, NavTreeResource } from '@cloudbeaver/core-app';
import { Loader, useMapResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { resourceKeyList } from '@cloudbeaver/core-sdk';

import { ObjectChildrenPropertyTable } from '../../ObjectPropertyTable/ObjectChildrenPropertyTable';
import { VirtualFolderUtils } from './VirtualFolderUtils';

const style = css`
  tab-wrapper {
    position: relative;
    width: 100%;
    flex: 1 0 auto;
  }
`;

export const VirtualFolderPanel: NavNodeTransformViewComponent = function VirtualFolderPanel({
  folderId,
  nodeId,
}) {
  const nodeType = VirtualFolderUtils.getNodeType(folderId);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const tree = useMapResource(NavTreeResource, nodeId);
  const key = resourceKeyList([nodeId, ...tree.data || []]);
  const dbObject = useMapResource(DBObjectResource, key, {
    async onLoad(resource: DBObjectResource) {
      await resource.loadChildren(nodeId, key);
    },
  });

  const nodeIds = navNodeInfoResource
    .get(resourceKeyList(tree.data || []))
    .filter(node => node?.nodeType === nodeType)
    .map(node => node!.id);

  return styled(style)(
    <Loader state={[tree, dbObject]}>{() => styled(style)(
      <>
        <tab-wrapper>
          <ObjectChildrenPropertyTable nodeIds={nodeIds} />
        </tab-wrapper>
      </>
    )}
    </Loader>
  );
};

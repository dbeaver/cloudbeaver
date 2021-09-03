/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { NavNodeInfoResource, NavNodeTransformViewComponent, useChildren } from '@cloudbeaver/core-app';
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
  const children = useChildren(nodeId);

  const nodeIds = navNodeInfoResource
    .get(resourceKeyList(children.children || []))
    .filter(node => node?.nodeType === nodeType)
    .map(node => node!.id);

  return styled(style)(
    <tab-wrapper>
      <ObjectChildrenPropertyTable nodeIds={nodeIds} />
    </tab-wrapper>
  );
};

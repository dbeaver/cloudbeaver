/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { untracked } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import styled, { css } from 'reshadow';

import { Loader, TextPlaceholder, useMapResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeInfoResource, NavTreeResource, DBObjectResource, type DBObject, DBObjectParentKey } from '@cloudbeaver/core-navigation-tree';
import { type NavNodeTransformViewComponent, NavNodeViewService } from '@cloudbeaver/plugin-navigation-tree';

import { TableLoader } from '../../ObjectPropertyTable/Table/TableLoader';
import { VirtualFolderUtils } from './VirtualFolderUtils';

const style = css`
  tab-wrapper {
    position: relative;
    width: 100%;
    flex: 1 0 auto;
    display: flex;
    flex-direction: column;
  }
`;

export const VirtualFolderPanel: NavNodeTransformViewComponent = observer(function VirtualFolderPanel({
  folderId,
  nodeId,
  parents,
}) {
  const translate = useTranslate();
  const nodeType = VirtualFolderUtils.getNodeType(folderId);
  const navNodeViewService = useService(NavNodeViewService);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const tree = useMapResource(VirtualFolderPanel, NavTreeResource, nodeId, {
    onLoad: async resource => !(await resource.preloadNodeParents(parents, nodeId)),
  });

  const limited = navNodeViewService.limit(tree.data || []);

  const { nodes, duplicates } = navNodeViewService.filterDuplicates(limited.nodes);

  const dbObject = useMapResource(VirtualFolderPanel, DBObjectResource, DBObjectParentKey(nodeId), {
    preload: [tree],
  });

  useEffect(() => {
    untracked(() => {
      navNodeViewService.logDuplicates(nodeId, duplicates);
    });
  });

  const objects = dbObject.data
    .filter(object => (
      object
      && nodes.includes(object.id)
      && navNodeInfoResource.get(object.id)?.nodeType === nodeType
    )) as DBObject[];

  return styled(style)(
    <Loader state={[tree, dbObject]}>{() => styled(style)(
      <>
        {objects.length === 0 ? (
          <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>
        ) : (
          <tab-wrapper>
            <TableLoader objects={objects} truncated={limited.truncated > 0} />
          </tab-wrapper>
        )}
      </>
    )}
    </Loader>
  );
});

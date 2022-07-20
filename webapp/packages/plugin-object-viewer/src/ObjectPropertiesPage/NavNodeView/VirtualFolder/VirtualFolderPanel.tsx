/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Loader, TextPlaceholder, useMapResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { NavNodeInfoResource, NavTreeResource, DBObjectResource, type DBObject } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList } from '@cloudbeaver/core-sdk';
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

  const { nodes, truncated } = navNodeViewService.limit(tree.data || []);
  const key = resourceKeyList(nodes);
  const dbObject = useMapResource(VirtualFolderPanel, DBObjectResource, key, {
    async onLoad(resource: DBObjectResource) {
      const preloaded = await tree.resource.preloadNodeParents(parents, nodeId);

      if (!preloaded) {
        return true;
      }

      await resource.loadChildren(nodeId, key);
      return true;
    },
    preload: [tree],
  });

  const objects = dbObject.data
    .filter(object => object && navNodeInfoResource.get(object.id)?.nodeType === nodeType) as DBObject[];

  return styled(style)(
    <Loader state={[tree, dbObject]}>{() => styled(style)(
      <>
        {objects.length === 0 ? (
          <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>
        ) : (
          <tab-wrapper>
            <TableLoader objects={objects} truncated={truncated > 0} />
          </tab-wrapper>
        )}
      </>
    )}
    </Loader>
  );
});

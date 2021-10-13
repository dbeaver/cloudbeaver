/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { DBObject, DBObjectResource, NavNodeInfoResource, NavNodeTransformViewComponent, NavTreeResource } from '@cloudbeaver/core-app';
import { Loader, TextPlaceholder, useMapResource } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { resourceKeyList } from '@cloudbeaver/core-sdk';

import { preloadNodeParents } from '../../../preloadNodeParents';
import { ObjectChildrenPropertyTable } from '../../ObjectPropertyTable/ObjectChildrenPropertyTable';
import { VirtualFolderUtils } from './VirtualFolderUtils';

const style = css`
  tab-wrapper {
    position: relative;
    width: 100%;
    flex: 1 0 auto;
  }
`;

export const VirtualFolderPanel: NavNodeTransformViewComponent = observer(function VirtualFolderPanel({
  folderId,
  nodeId,
  parents,
}) {
  const translate = useTranslate();
  const nodeType = VirtualFolderUtils.getNodeType(folderId);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const connectionInfoResource = useService(ConnectionInfoResource);
  const tree = useMapResource(VirtualFolderPanel, NavTreeResource, nodeId, {
    onLoad: async resource => !(await preloadNodeParents(
      connectionInfoResource,
      resource,
      navNodeInfoResource,
      parents,
      nodeId)),
  });

  const key = resourceKeyList(tree.data || []);
  const dbObject = useMapResource(VirtualFolderPanel, DBObjectResource, key, {
    async onLoad(resource: DBObjectResource) {
      const preloaded = await preloadNodeParents(connectionInfoResource,
        tree.resource,
        navNodeInfoResource,
        parents,
        nodeId
      );

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
            <ObjectChildrenPropertyTable objects={objects} />
          </tab-wrapper>
        )}
      </>
    )}
    </Loader>
  );
});

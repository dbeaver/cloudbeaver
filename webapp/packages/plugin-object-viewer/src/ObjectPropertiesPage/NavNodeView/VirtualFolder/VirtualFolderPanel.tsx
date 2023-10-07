/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import styled, { css } from 'reshadow';

import { TextPlaceholder, useOffsetPagination, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type DBObject, DBObjectParentKey, DBObjectResource, NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { isDefined } from '@cloudbeaver/core-utils';
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

export const VirtualFolderPanel: NavNodeTransformViewComponent = observer(function VirtualFolderPanel({ folderId, nodeId }) {
  const translate = useTranslate();
  const nodeType = VirtualFolderUtils.getNodeType(folderId);
  const navNodeViewService = useService(NavNodeViewService);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const tree = useResource(VirtualFolderPanel, NavTreeResource, nodeId);

  const pagination = useOffsetPagination(DBObjectResource, {
    key: DBObjectParentKey(nodeId),
    pageSize: tree.resource.childrenLimit,
  });

  const dbObjectLoader = useResource(VirtualFolderPanel, DBObjectResource, pagination.key);

  const { nodes, duplicates } = navNodeViewService.filterDuplicates(dbObjectLoader.data.filter(isDefined).map(node => node?.id) || []);

  const objects = dbObjectLoader.data.filter(
    object => object && nodes.includes(object.id) && navNodeInfoResource.get(object.id)?.nodeType === nodeType,
  ) as DBObject[];

  useEffect(() => {
    navNodeViewService.logDuplicates(nodeId, duplicates);
  });

  return styled(style)(
    <>
      {objects.length === 0 ? (
        <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>
      ) : (
        <tab-wrapper>
          <TableLoader objects={objects} hasNextPage={pagination?.hasNextPage ?? false} loadMore={pagination.loadMore} />
        </tab-wrapper>
      )}
    </>,
  );
});

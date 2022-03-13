/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import styled, { css } from 'reshadow';

import { useUserData } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { usePermission, EPermission } from '@cloudbeaver/core-root';
import { CaptureView } from '@cloudbeaver/core-view';

import { NavNodeInfoResource, ROOT_NODE_PATH } from '../shared/NodesManager/NavNodeInfoResource';
import { NavNodeViewService } from '../shared/NodesManager/NavNodeView/NavNodeViewService';
import { navigationTreeConnectionGroupFilter } from './ConnectionGroup/navigationTreeConnectionGroupFilter';
import { navigationTreeConnectionGroupRenderer } from './ConnectionGroup/navigationTreeConnectionGroupRenderer';
import { ElementsTree } from './ElementsTree/ElementsTree';
import { createElementsTreeSettings, validateElementsTreeSettings } from './ElementsTree/ElementsTreeTools/NavigationTreeSettings/createElementsTreeSettings';
import type { IElementsTreeSettings } from './ElementsTree/useElementsTree';
import { getNavigationTreeUserSettingsId } from './getNavigationTreeUserSettingsId';
import { navigationTreeDuplicateFilter } from './navigationTreeDuplicateIdFilter';
import { NavigationTreeService } from './NavigationTreeService';
import { useNavigationTree } from './useNavigationTree';

const navigationTreeStyles = css`
  CaptureView {
    outline: none;
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: auto;
  }

  ElementsTree {
    min-width: 100%;
    width: max-content;
  }

  center {
    display: flex;
    height: 100%;
    width: 100%;

    & message {
      margin: auto;
      text-align: center;
    }
  }

  message {
    box-sizing: border-box;
    max-width: 240px;
    padding: 24px;
  }
`;

const elementsTreeStyles = css`
    tools {
      composes: theme-border-color-background from global;
    }
    tools > *:last-child:not(:first-child) {
      border-bottom: solid 1px;
      border-color: inherit;
    }
  `;

export const NavigationTree = observer(function NavigationTree() {
  const navTreeService = useService(NavigationTreeService);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const connectionInfoResource = useService(ConnectionInfoResource);
  const navNodeViewService = useService(NavNodeViewService);

  const root = ROOT_NODE_PATH;
  const isEnabled = usePermission(EPermission.public);
  const { handleOpen, handleSelect } = useNavigationTree();

  const connectionGroupFilter = useMemo(() => navigationTreeConnectionGroupFilter(
    connectionInfoResource,
    navNodeInfoResource
  ), [connectionInfoResource, navNodeInfoResource]);

  const settings = useUserData<IElementsTreeSettings>(
    getNavigationTreeUserSettingsId(root),
    createElementsTreeSettings,
    () => {},
    validateElementsTreeSettings
  );

  const duplicateFilter = useMemo(() => navigationTreeDuplicateFilter(navNodeViewService), [navNodeViewService]);

  if (!isEnabled) {
    return null;
  }

  return styled(navigationTreeStyles)(
    <CaptureView view={navTreeService}>
      <ElementsTree
        root={root}
        localState={navTreeService.treeState}
        filters={[duplicateFilter, connectionGroupFilter]}
        renderers={[navigationTreeConnectionGroupRenderer]}
        emptyPlaceholder={() => styled(navigationTreeStyles)(
          <center>
            <message>
              No connections.<br />
              Use the top menu to setup connection to your database.
            </message>
          </center>
        )}
        customSelect={handleSelect}
        settings={settings}
        style={elementsTreeStyles}
        getChildren={navTreeService.getChildren}
        loadChildren={navTreeService.loadNestedNodes}
        onOpen={handleOpen}
      />
    </CaptureView>
  );
});

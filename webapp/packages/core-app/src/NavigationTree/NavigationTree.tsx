/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import styled, { css } from 'reshadow';

import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { usePermission, EPermission } from '@cloudbeaver/core-root';
import { CaptureView } from '@cloudbeaver/core-view';

import { NavNodeInfoResource, ROOT_NODE_PATH } from '../shared/NodesManager/NavNodeInfoResource';
import { ElementsTree } from './ElementsTree';
import { navigationTreeConnectionGroupFilter } from './navigationTreeConnectionGroupFilter';
import { navigationTreeConnectionGroupRenderer } from './navigationTreeConnectionGroupRenderer';
import { NavigationTreeService } from './NavigationTreeService';
import { useNavigationTree } from './useNavigationTree';

const navigationTreeStyles = css`
  CaptureView {
    outline: none;
  }

  ElementsTree {
    padding-top: 16px;
    min-width: 100%;
    min-height: 100%;
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

export const NavigationTree = observer(function NavigationTree() {
  const navTreeService = useService(NavigationTreeService);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const connectionInfoResource = useService(ConnectionInfoResource);

  const isEnabled = usePermission(EPermission.public);
  const { handleOpen, handleSelect } = useNavigationTree();

  const connectionGroupFilter = useMemo(() => navigationTreeConnectionGroupFilter(
    connectionInfoResource,
    navNodeInfoResource
  ), [connectionInfoResource, navNodeInfoResource]);

  if (!isEnabled) {
    return null;
  }

  return styled(navigationTreeStyles)(
    <CaptureView view={navTreeService}>
      <ElementsTree
        root={ROOT_NODE_PATH}
        localState={navTreeService.treeState}
        filters={[connectionGroupFilter]}
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
        keepData
        onOpen={handleOpen}
      />
    </CaptureView>
  );
});

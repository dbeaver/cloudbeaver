/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { Loader, useFocus } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { usePermission, EPermission } from '@cloudbeaver/core-root';
import { useActiveView } from '@cloudbeaver/core-view';

import { ROOT_NODE_PATH } from '../shared/NodesManager/NavNodeInfoResource';
import { useChildren } from '../shared/useChildren';
import { NavigationTreeNode } from './NavigationTreeNode/NavigationTreeNode';
import { NavigationTreeService } from './NavigationTreeService';

const navigationTreeStyles = css`
  tree {
    padding-top: 16px;
    min-width: 240px;
    width: 100%;
    outline: none;
  }

  center {
    display: flex;
    height: 100%;
    width: 100%;

    & tree {
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
  const [onFocus, onBlur] = useActiveView(navTreeService.getView);
  const [ref] = useFocus<HTMLDivElement>({ onFocus, onBlur });
  const nodeChildren = useChildren();
  const isEnabled = usePermission(EPermission.public);

  if (!isEnabled) {
    return null;
  }

  if (!nodeChildren.children || nodeChildren.children.length === 0) {
    if (nodeChildren.isLoading) {
      return styled(navigationTreeStyles)(
        <center as="div">
          <tree as="div"><Loader/></tree>
        </center>
      );
    }

    return styled(navigationTreeStyles)(
      <center as="div">
        <tree as="div">
          <message as="div">
            No connections.<br/>
            Use the top menu to setup connection to your database.
          </message>
        </tree>
      </center>
    );
  }

  return styled(navigationTreeStyles)(
    <tree as="div" tabIndex={0} ref={ref}>
      {nodeChildren.children.map(id => (
        <NavigationTreeNode key={id} id={id} parentId={ROOT_NODE_PATH}/>
      ))}
    </tree>
  );
});

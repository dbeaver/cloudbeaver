/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { useChildren } from '../shared/useChildren';
import { NavigationTreeNode } from './NavigationTreeNode/NavigationTreeNode';

const navigationTreeStyles = css`
  tree {
    padding-top: 16px;
    min-width: 240px;
    width: 100%;
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
  const nodeChildren = useChildren();

  if (!nodeChildren || nodeChildren.children.length === 0) {
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
    <tree as="div">
      {nodeChildren.children.map(id => (
        <NavigationTreeNode id={id} key={id} />
      ))}
    </tree>
  );
});

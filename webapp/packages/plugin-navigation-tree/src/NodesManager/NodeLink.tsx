/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { Link } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { parseNodeParentId } from '@cloudbeaver/core-navigation-tree';

import { NavigationTreeService } from '../NavigationTree/NavigationTreeService';

const style = css`
  Link {
    cursor: pointer;
  }
`;

export interface NodeLinkProps {
  name: string;
  nodeId?: string;
}

// TODO: we probably can get name from NavNodeInfoResource but element can be not loaded
export const NodeLink: React.FC<React.PropsWithChildren<NodeLinkProps>> = function NodeLink({ children, name, nodeId }) {
  const navigationTreeService = useService(NavigationTreeService);

  const handleClick = useCallback(() => {
    if (nodeId) {
      navigationTreeService.navToNode(nodeId, parseNodeParentId(nodeId));
    }
  }, [nodeId, navigationTreeService]);

  if (nodeId) {
    return styled(style)(<Link onClick={handleClick}>{children}</Link>);
  }

  return <>{children}</>;
};

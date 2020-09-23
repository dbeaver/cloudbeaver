/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import {
  MouseEvent, KeyboardEvent, useCallback, PropsWithChildren,
} from 'react';
import styled, { use } from 'reshadow';

import { Icon, StaticImage, Loader } from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';

import { NavNode } from '../../../shared/NodesManager/EntityTypes';
import { TreeNodeMenu } from '../TreeNodeMenu/TreeNodeMenu';
import { navigationNodeStyles } from './navigationNodeStyles';
import { useNavigationNode } from './useNavigationNode';

type NodeProps = PropsWithChildren<{
  node: NavNode;
  isLoading: boolean;
  isLoaded: boolean;
  isOutdated: boolean;
}>

const KEY = {
  ENTER: 'Enter',
};

export const NavigationNode = observer(function NavigationNode({
  node,
  isLoading,
  isLoaded,
  isOutdated,

  children,
}: NodeProps) {
  const controller = useNavigationNode(node, isLoading, isLoaded, isOutdated);
  const styles = useStyles(navigationNodeStyles);

  const handleExpand = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      controller.handleExpand();
    },
    [controller.handleExpand]
  );

  const handleSelect = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      controller.handleSelect(e.ctrlKey);
    },
    [controller.handleSelect]
  );

  const handleEnter = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      switch (event.key) {
        case KEY.ENTER:
          controller.handleSelect(event.ctrlKey);
          break;
      }
      return true;
    },
    [controller.handleSelect]
  );

  return styled(styles)(
    <>
      <node as="div" {...use({ isExpanded: controller.isExpanded })}>
        <control
          tabIndex={0}
          aria-selected={controller.isSelected}
          onClick={handleSelect}
          onKeyDown={handleEnter}
          onDoubleClick={controller.handleDoubleClick}
          as="div"
        >
          <arrow as="div" hidden={!controller.isExpandable} onClick={handleExpand}>
            {controller.isLoading && <Loader small />}
            {!controller.isLoading && <Icon name="arrow" viewBox="0 0 16 16" />}
          </arrow>
          <icon as="div"><StaticImage icon={node.icon} /></icon>
          <name as="div">{node.name}</name>
          <portal as="div">
            <TreeNodeMenu node={node} isSelected={controller.isSelected} />
          </portal>
        </control>
      </node>
      <nested as="div">{children}</nested>
    </>
  );
});

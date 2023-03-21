/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useDeferredValue, useEffect } from 'react';
import styled, { use, css } from 'reshadow';

import { getComputed, TreeNode, useStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeManagerService, DATA_CONTEXT_NAV_NODE, DATA_CONTEXT_NAV_NODES } from '@cloudbeaver/core-navigation-tree';
import { useDNDData } from '@cloudbeaver/core-ui';
import { useDataContext } from '@cloudbeaver/core-view';

import { useNavTreeDropBox } from '../../useNavTreeDropBox';
import type { NavigationNodeComponent } from '../NavigationNodeComponent';
import { DATA_ATTRIBUTE_NODE_EDITING } from './NavigationNode/DATA_ATTRIBUTE_NODE_EDITING';
import { NavigationNodeNested } from './NavigationNode/NavigationNodeNested';
import { NavigationNodeControlRenderer } from './NavigationNodeControlRenderer';
import { useNavigationNode } from './useNavigationNode';

const styles = css`
  TreeNode[|hovered] ::before {
    opacity: 0.16;
  }
`;

export const NavigationNode: NavigationNodeComponent = observer(function NavigationNode({
  node,
  component,
  path,
  control: externalControl,
  expanded: externalExpanded,
  className,
  style,
}) {
  const navNodeManagerService = useService(NavNodeManagerService);
  const navNode = useNavigationNode(node, path);
  const context = useDataContext();

  const dndData = useDNDData(context, {
    canDrag: () => {
      const el = navNode.ref.current;
      const editing = el?.getAttribute(DATA_ATTRIBUTE_NODE_EDITING) === 'true';

      return !editing;
    },
    onDragStart: async () => {
      if (!navNode.selected) {
        navNode.select(false);
      }

      navNode.setDnDState(dndData, true);

      // strange way to preload alias while dragging
      await navNodeManagerService.getNodeDatabaseAlias(node.id);
    },
    onDragEnd: () => {
      navNode.setDnDState(dndData, false);
    },
  });

  const dndBox = useNavTreeDropBox(node, {
    expanded: navNode.expanded,
    expand: navNode.expand,
  });

  context.set(DATA_CONTEXT_NAV_NODE, node);
  context.set(DATA_CONTEXT_NAV_NODES, navNode.getSelected);

  if (navNode.leaf || !navNode.loaded) {
    externalExpanded = false;
  }

  function setRef(refObj: HTMLDivElement | null) {
    //@ts-expect-error ignore
    navNode.ref.current = refObj;
    dndData.setTargetRef(refObj);
  }

  const hasNodes = getComputed(() => !!dndBox.state.context && dndBox.state.canDrop && dndBox.state.isOverCurrent);
  const expanded = useDeferredValue(navNode.expanded || externalExpanded);

  useEffect(() => () => {
    navNode.setDnDState(dndData, false);
  }, []);

  return styled(useStyles(style, styles))(
    <TreeNode
      ref={dndBox.setRef}
      group={navNode.group}
      loading={navNode.loading}
      disabled={navNode.disabled}
      selected={navNode.selected}
      indeterminateSelected={navNode.indeterminateSelected}
      expanded={navNode.expanded}
      showInFilter={navNode.showInFilter}
      externalExpanded={externalExpanded}
      leaf={navNode.leaf}
      className={className}
      onExpand={navNode.expand}
      onClick={navNode.click}
      onOpen={navNode.open}
      onSelect={navNode.select}
      {...use({ hovered: hasNodes })}
    >
      {/* <DNDPreview data={dndData} src="/icons/empty.svg" /> */}
      <NavigationNodeControlRenderer
        ref={setRef}
        navNode={navNode}
        dragging={dndData.state.isDragging}
        control={externalControl}
        style={style}
        node={node}
      />
      {expanded && (
        <NavigationNodeNested
          nodeId={node.id}
          path={path}
          component={component}
        />
      )}
    </TreeNode>
  );
});
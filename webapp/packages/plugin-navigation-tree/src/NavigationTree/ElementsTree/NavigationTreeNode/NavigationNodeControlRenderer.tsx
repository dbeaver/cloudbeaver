/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useCallback, useContext, useDeferredValue, useEffect, useRef, useState } from 'react';
import styled, { css, use } from 'reshadow';

import { getComputed, TreeNodeContext, useMergeRefs, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type NavNode, NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { ElementsTreeContext } from '../ElementsTreeContext';
import type { NavTreeControlComponent } from '../NavigationNodeComponent';
import { NavigationNodeControlLoader } from './NavigationNode/NavigationNodeLoaders';
import type { INavigationNode } from './useNavigationNode';

interface Props {
  node: NavNode;
  navNode: INavigationNode;
  dragging?: boolean;
  control?: NavTreeControlComponent | undefined;
  style?: ComponentStyle;
}

const styles = css`
  Control {
    transition: opacity 0.3s ease;
    opacity: 1;

    &[|outdated] {
      opacity: 0.5;
    }
  }
`;

export const NavigationNodeControlRenderer = observer<Props, HTMLDivElement>(
  forwardRef(function NavigationNodeControlRenderer({ node, navNode, dragging, control: externalControl, style }, ref) {
    const elementRef = useRef<HTMLDivElement | null>(null);
    const [size, setSize] = useState(24);
    const contextRef = useObjectRef({
      context: useContext(ElementsTreeContext),
    });
    const treeNodeContext = useContext(TreeNodeContext);
    const navNodeInfoResource = useService(NavNodeInfoResource);
    const observer = useRef<IntersectionObserver | null>(null);

    const setElementRef = useCallback((ref: HTMLDivElement | null) => {
      if (elementRef.current) {
        observer.current?.unobserve(elementRef.current);
      }

      elementRef.current = ref;

      if (elementRef.current) {
        observer.current?.observe(elementRef.current);
      }
    }, []);
    const mergedRef = useMergeRefs(setElementRef, ref);

    if (!contextRef.context) {
      throw new Error('ElementsTreeContext not found');
    }

    const root = contextRef.context?.getTreeRoot();

    useEffect(() => {
      observer.current = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (entry.target === elementRef.current) {
              if (entry.isIntersecting) {
                setSize(-1);
              } else {
                setSize(Math.ceil(elementRef.current.offsetHeight));
              }
            }
          }
        },
        {
          root,
          threshold: 0,
        },
      );

      if (elementRef.current) {
        observer.current.observe(elementRef.current);
      }

      return () => observer.current?.disconnect();
    }, [root]);

    const displayed = useDeferredValue(size !== -1);

    if (displayed) {
      return <div ref={mergedRef} style={{ height: `${size}px` }} />;
    }

    const Control = navNode.control || externalControl || NavigationNodeControlLoader;
    const outdated = getComputed(() => navNodeInfoResource.isOutdated(node.id) && !treeNodeContext.loading);
    const nodeInfo = contextRef.context?.tree.getTransformedNodeInfo(node);

    function onClickHandler(event: React.MouseEvent<HTMLDivElement>) {
      treeNodeContext.select(event.ctrlKey || event.metaKey);
    }

    return styled(styles)(
      <Control ref={mergedRef} {...use({ outdated })} nodeInfo={nodeInfo} dndElement={dragging} style={style} node={node} onClick={onClickHandler} />,
    );
  }),
);

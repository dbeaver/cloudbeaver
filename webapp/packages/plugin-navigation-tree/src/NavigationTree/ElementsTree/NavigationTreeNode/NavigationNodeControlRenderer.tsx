/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useCallback, useContext, useDeferredValue, useEffect, useRef, useState } from 'react';

import { getComputed, s, TreeNodeContext, useMergeRefs, useObjectRef, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type NavNode, NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';

import { ElementsTreeContext } from '../ElementsTreeContext.js';
import type { NavTreeControlComponent } from '../NavigationNodeComponent.js';
import { NavigationNodeControlLoader } from './NavigationNode/NavigationNodeLoaders.js';
import style from './NavigationNodeControlRenderer.module.css';
import type { INavigationNode } from './useNavigationNode.js';

interface Props {
  node: NavNode;
  navNode: INavigationNode;
  dragging?: boolean;
  control?: NavTreeControlComponent | undefined;
}

export const NavigationNodeControlRenderer = observer<Props, HTMLDivElement>(
  forwardRef(function NavigationNodeControlRenderer({ node, navNode, dragging, control: externalControl }, ref) {
    const styles = useS(style);
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

    return (
      <Control
        ref={mergedRef}
        className={s(styles, { control: true, outdated })}
        nodeInfo={nodeInfo}
        dndElement={dragging}
        node={node}
        onClick={onClickHandler}
      />
    );
  }),
);

NavigationNodeControlRenderer.displayName = 'NavigationNodeControlRenderer';

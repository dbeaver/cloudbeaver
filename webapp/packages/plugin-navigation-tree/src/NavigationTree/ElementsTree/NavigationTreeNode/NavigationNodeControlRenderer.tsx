/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { forwardRef, useContext, useDeferredValue, useEffect, useRef, useState } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import type { NavNode } from '@cloudbeaver/core-navigation-tree';
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

export const NavigationNodeControlRenderer = observer<Props, HTMLDivElement>(forwardRef(function NavigationNodeControlRenderer({
  node,
  navNode,
  dragging,
  control: externalControl,
  style,
}, ref) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(24);
  const contextRef = useObjectRef({
    context: useContext(ElementsTreeContext),
  });
  const Control = navNode.control || externalControl || NavigationNodeControlLoader;
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (elementRef.current) {
      observer.current = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.target === elementRef.current) {
            if (entry.isIntersecting) {
              setSize(-1);
            } else {
              setSize(elementRef.current.offsetHeight);
            }
          }
        }
      }, {
        root: contextRef.context?.getTreeRoot(),
        threshold: 0,
      });
      observer.current.observe(elementRef.current);
    }
    return () => observer.current?.disconnect();
  });

  function setRef(element: HTMLDivElement | null) {
    elementRef.current = element;

    if (ref) {
      if (typeof ref === 'function') {
        ref(element);
      } else {
        ref.current = element;
      }
    }
  }

  const displayed = useDeferredValue(size !== -1);

  if (displayed) {
    return (
      <div ref={setRef} style={{ height:`${size}px` }} />
    );
  }

  return (
    <Control
      ref={setRef}
      dndElement={dragging}
      style={style}
      node={node}
    />
  );
}));
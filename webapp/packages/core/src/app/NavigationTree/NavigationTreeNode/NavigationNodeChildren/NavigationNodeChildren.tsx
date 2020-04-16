/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IReactComponent, observer } from 'mobx-react';
import React, { memo, PropsWithChildren } from 'react';

import { useChildren } from '../../../shared/useChildren';

type NavigationNodeChildrenProps = PropsWithChildren<{
  parentId: string;
  component: IReactComponent<{id: string}>;
}>

export const NavigationNodeChildren = memo(
  observer(function NavigationNodeChildren({
    parentId,
    component,
  }: NavigationNodeChildrenProps) {
    const nodeChildren = useChildren(parentId);

    if (!nodeChildren?.isLoaded) {
      return null;
    }

    const NavigationNodeChild = component;
    return (
      <>
        {nodeChildren.children.map(id => (
          <NavigationNodeChild id={id} key={id} />
        ))}
      </>
    );
  }),
  (prev, next) => prev.parentId === next.parentId
);

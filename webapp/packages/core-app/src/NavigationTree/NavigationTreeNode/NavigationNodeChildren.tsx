/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import React, { PropsWithChildren } from 'react';

import { useChildren } from '../../shared/useChildren';

type NavigationNodeChildrenProps = PropsWithChildren<{
  parentId: string;
  component: React.ElementType<{
    id: string;
    parentId: string;
  }>;
}>

export const NavigationNodeChildren = observer(function NavigationNodeChildren({
  parentId,
  component,
}: NavigationNodeChildrenProps) {
  const { children } = useChildren(parentId);

  if (!children) {
    return null;
  }

  const NavigationNodeChild = component;
  return (
    <>
      {children.map(id => (
        <NavigationNodeChild id={id} parentId={parentId} key={id} />
      ))}
    </>
  );
});

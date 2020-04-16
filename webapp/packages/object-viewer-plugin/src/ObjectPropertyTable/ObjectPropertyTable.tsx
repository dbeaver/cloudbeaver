/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { useChildren } from '@dbeaver/core/app';
import { Loader } from '@dbeaver/core/blocks';

import { useObjectFolder } from '../useObjectFolder';
import { ObjectChildrenPropertyTable } from './ObjectChildrenPropertyTable';

const styles = css`
  center {
    margin: auto;
  }
`;

type ObjectPropertyTableProps = {
  parentId: string;
  objectId: string;
}

export const ObjectPropertyTable = observer(function ObjectPropertyTable(props: ObjectPropertyTableProps) {
  const children = useChildren(props.objectId);
  const { isLoading } = useObjectFolder(props.parentId, props.objectId);

  if (!children?.isLoaded || isLoading) {
    return <Loader />;
  }

  if (children.isLoaded && children.children.length === 0) {
    return styled(styles)(
      <center as="div">There are no items to show</center>
    );
  }

  return <ObjectChildrenPropertyTable nodeIds={children?.children}/>;
});

export const objectPropertyTablePanel = (parentId: string, objectId: string) => (
  <ObjectPropertyTable parentId={parentId} objectId={objectId}/>
);

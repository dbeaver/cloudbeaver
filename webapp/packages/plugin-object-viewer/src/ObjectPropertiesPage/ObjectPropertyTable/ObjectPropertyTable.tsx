/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { useChildren } from '@cloudbeaver/core-app';
import { Loader } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

import { useObjectFolder } from '../../useObjectFolder';
import { ObjectChildrenPropertyTable } from './ObjectChildrenPropertyTable';

const styles = css`
  center {
    margin: auto;
  }
`;

type ObjectPropertyTableProps = {
  objectId: string;
  parentId: string;
}

export const ObjectPropertyTable = observer(function ObjectPropertyTable({
  objectId,
  parentId,
}: ObjectPropertyTableProps) {
  const translate = useTranslate();
  const children = useChildren(objectId);
  const { isLoading } = useObjectFolder(objectId);

  if ((!children.children && children.isLoading) || isLoading) {
    return <Loader />;
  }

  if (!children?.children || !children.children.length) {
    return styled(styles)(
      <center as="div">{translate('plugin_object_viewer_table_no_items')}</center>
    );
  }

  return <ObjectChildrenPropertyTable nodeIds={children.children}/>;
});

export const objectPropertyTablePanel = (parentId: string, objectId: string) => (
  <ObjectPropertyTable parentId={parentId} objectId={objectId}/>
);

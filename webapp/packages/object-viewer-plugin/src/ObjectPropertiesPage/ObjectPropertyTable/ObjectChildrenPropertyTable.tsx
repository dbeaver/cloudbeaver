/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback, useState } from 'react';
import styled, { css } from 'reshadow';

import { useDatabaseObjectInfo } from '@dbeaver/core/app';
import { useStyles } from '@dbeaver/core/theming';

import { Header } from './Header';
import { Item } from './Item';

const styles = css`
  table {
    composes: theme-typography--body2 from global;
  }
`;

type ObjectChildrenPropertyTableProps = {
  nodeIds?: string[];
}

export const ObjectChildrenPropertyTable = observer(function ObjectPropertyTable(
  props: ObjectChildrenPropertyTableProps
) {

  const [selected, setSelected] = useState<string[]>([]);
  const handleSelect = useCallback((objectId: string, isMultiple: boolean) => {
    if (isMultiple) {
      if (selected.includes(objectId)) {
        setSelected(selected.filter(v => v !== objectId));
      } else {
        setSelected([...selected, objectId]);
      }
    } else if (!selected.includes(objectId)) {
      setSelected([objectId]);
    } else {
      setSelected([]);
    }
  }, [selected]);

  if (!props.nodeIds) {
    return null;
  }

  const firstChild = props.nodeIds[0] || '';
  const properties = useDatabaseObjectInfo(firstChild)?.properties;

  return styled(useStyles(styles))(
    <table>
      <thead>
        <Header properties={properties || []} />
      </thead>
      <tbody>
        {props.nodeIds.map(id => (
          <Item
            key={id}
            objectId={id}
            columns={properties?.length || 0}
            isSelected={selected.includes(id)}
            onClick={handleSelect}
          />
        ))}
      </tbody>
    </table>
  );
});

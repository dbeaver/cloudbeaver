/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ItemList, ListItem, ListItemDescription, ListItemIcon, ListItemName, StaticImage } from '@cloudbeaver/core-blocks';
import type { DataTransferProcessorInfo } from '@cloudbeaver/core-sdk';

import classes from './ImportProcessorList.m.css';

interface Props {
  processors: DataTransferProcessorInfo[];
  onSelect: (id: string) => void;
  className?: string;
}

export const ImportProcessorList = observer<Props>(function ImportProcessorList({ processors, onSelect, className }) {
  return (
    <ItemList className={className}>
      {processors.map(processor => (
        <ListItem key={processor.id} onClick={() => onSelect(processor.id)}>
          <ListItemIcon>
            <StaticImage className={classes.staticImage} icon={processor.icon} />
          </ListItemIcon>
          <ListItemName>{processor.name}</ListItemName>
          <ListItemDescription title={processor.description}>{processor.description}</ListItemDescription>
        </ListItem>
      ))}
    </ItemList>
  );
});

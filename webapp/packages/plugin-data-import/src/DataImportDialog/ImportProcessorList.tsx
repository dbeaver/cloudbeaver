/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ItemList, ListItem, ListItemDescription, ListItemIcon, ListItemName, StaticImage, useResource } from '@cloudbeaver/core-blocks';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import type { DataTransferProcessorInfo } from '@cloudbeaver/core-sdk';

import { DataImportProcessorsResource } from '../DataImportProcessorsResource.js';
import classes from './ImportProcessorList.module.css';

interface Props {
  onSelect: (processor: DataTransferProcessorInfo) => void;
  className?: string;
}

export const ImportProcessorList = observer<Props>(function ImportProcessorList({ onSelect, className }) {
  const dataImportProcessorsResource = useResource(ImportProcessorList, DataImportProcessorsResource, CachedMapAllKey, { forceSuspense: true });

  return (
    <ItemList className={className}>
      {dataImportProcessorsResource.resource.values.map(processor => (
        <ListItem key={processor.id} onClick={() => onSelect(processor)}>
          <ListItemIcon>
            <StaticImage className={classes['staticImage']} icon={processor.icon} />
          </ListItemIcon>
          <ListItemName>{processor.name}</ListItemName>
          <ListItemDescription title={processor.description}>{processor.description}</ListItemDescription>
        </ListItem>
      ))}
    </ItemList>
  );
});

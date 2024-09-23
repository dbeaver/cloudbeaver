/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { ListItem, ListItemDescription, ListItemIcon, ListItemName, StaticImage } from '@cloudbeaver/core-blocks';
import type { DataTransferProcessorInfo } from '@cloudbeaver/core-sdk';

import style from './ProcessorItem.module.css';

interface Props {
  processor: DataTransferProcessorInfo;
  onSelect: (processorId: string) => void;
}

export const ProcessorItem = observer<Props>(function ProcessorItem({ processor, onSelect }) {
  const select = useCallback(() => onSelect(processor.id), [processor]);

  return (
    <ListItem onClick={select}>
      <ListItemIcon>
        <StaticImage className={style['staticImage']} icon={processor.icon} />
      </ListItemIcon>
      <ListItemName>{processor.name}</ListItemName>
      <ListItemDescription title={processor.description}>{processor.description}</ListItemDescription>
    </ListItem>
  );
});

/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import {
  ListItem, ListItemIcon, StaticImage, ListItemName, ListItemDescription
} from '@cloudbeaver/core-blocks';
import { DataTransferProcessorInfo } from '@cloudbeaver/core-sdk';

type ProcessorItemProps = {
  processor: DataTransferProcessorInfo;
  onSelect(processorId: string): void;
}

const styles = css`
    StaticImage {
      box-sizing: border-box;
      width: 24px;
      max-height: 24px;
    }
  `;

export const ProcessorItem = observer(function ProcessorItem({
  processor,
  onSelect,
}: ProcessorItemProps) {
  const select = useCallback(() => onSelect(processor.id), [processor]);

  return styled(styles)(
    <ListItem onClick={select}>
      <ListItemIcon><StaticImage icon={processor.icon}/></ListItemIcon>
      <ListItemName>{processor.name}</ListItemName>
      <ListItemDescription title={processor.description}>{processor.description}</ListItemDescription>
    </ListItem>
  );
});

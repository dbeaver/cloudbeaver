/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';

import { ListItem } from '@cloudbeaver/core-blocks';
import { DataTransferProcessorInfo } from '@cloudbeaver/core-sdk';

type ProcessorItemProps = {
  processor: DataTransferProcessorInfo;
  onSelect(processorId: string): void;
}

export const ProcessorItem = observer(function ProcessorItem({
  processor,
  onSelect,
}: ProcessorItemProps) {
  const select = useCallback(() => onSelect(processor.id), [processor]);
  return <ListItem icon={processor.icon} name={processor.name} description={processor.description} onClick={select}/>;
});

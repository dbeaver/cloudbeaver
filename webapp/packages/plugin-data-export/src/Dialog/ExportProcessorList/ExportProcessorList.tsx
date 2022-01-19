/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { ItemList } from '@cloudbeaver/core-blocks';
import type { DataTransferProcessorInfo } from '@cloudbeaver/core-sdk';

import { ProcessorItem } from './ProcessorItem';

interface Props {
  processors: DataTransferProcessorInfo[];
  onSelect: (processorId: string) => void;
  className?: string;
}

export const ExportProcessorList = observer<Props>(function ExportProcessorList({
  processors,
  onSelect,
  className,
}) {
  return (
    <ItemList className={className}>
      {processors.map(processor => <ProcessorItem key={processor.id} processor={processor} onSelect={onSelect} />)}
    </ItemList>
  );
});

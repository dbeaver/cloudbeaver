/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';

import { TextareaNew } from '@cloudbeaver/core-blocks';

import { ExecutionPlanTreeContext } from './ExecutionPlanTreeContext';

interface Props {
  className?: string;
}

export const QueryPanel: React.FC<Props> = function QueryPanel({ className }) {
  const treeContext = useContext(ExecutionPlanTreeContext);

  if (!treeContext) {
    throw new Error('Tree context must be provided');
  }

  return (
    <TextareaNew
      className={className}
      name='value'
      rows={3}
      value={treeContext.query}
      readOnly
      embedded
    />
  );
};

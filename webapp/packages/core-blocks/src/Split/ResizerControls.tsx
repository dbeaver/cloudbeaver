/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Resizer } from 'go-split';

import { SplitControls } from './SplitControls';

interface ResizerControlsProps {
  className?: string;
}

export function ResizerControls({ className }: ResizerControlsProps) {
  return (
    <Resizer className={className}>
      <SplitControls />
    </Resizer>
  );
}

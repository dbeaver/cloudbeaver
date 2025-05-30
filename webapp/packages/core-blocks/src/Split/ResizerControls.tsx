/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Resizer } from 'go-split';
import { observer } from 'mobx-react-lite';

import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './ResizerControls.module.css';
import { SplitControls } from './SplitControls.js';
import { useSplit } from './useSplit.js';

interface ResizerControlsProps {
  className?: string;
}

export const ResizerControls = observer<ResizerControlsProps>(function ResizerControls({ className }: ResizerControlsProps) {
  const styles = useS(style);
  const split = useSplit();

  const vertical = split.state.split === 'vertical';
  const horizontal = split.state.split === 'horizontal';

  return (
    <Resizer className={s(styles, { resizerControls: true, vertical, horizontal }, className)}>
      <SplitControls />
    </Resizer>
  );
});

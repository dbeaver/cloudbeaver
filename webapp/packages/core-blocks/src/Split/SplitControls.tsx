/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../s.js';
import { useObjectRef } from '../useObjectRef.js';
import { useS } from '../useS.js';
import { SplitControlButton } from './SplitControlButton.js';
import SplitControlsStyles from './SplitControls.module.css';
import { useSplit } from './useSplit.js';

export const SplitControls: React.FC = function SplitControls() {
  const split = useSplit();
  const styles = useS(SplitControlsStyles);
  const isResizeMode = split.state.mode === 'resize';

  const inverse = split.state.isMainSecond();

  let inverseMode = split.state.mode;

  if (split.state.size > split.state.getContainerSize()) {
    inverseMode = 'maximize';
  }

  if (inverse && inverseMode !== 'resize') {
    if (inverseMode === 'maximize') {
      inverseMode = 'minimize';
    } else {
      inverseMode = 'maximize';
    }
  }

  const handlers = useObjectRef(
    () => ({
      handleCollapse() {
        if (this.mode === 'maximize') {
          this.setMode('resize');
        } else {
          this.setMode('minimize');
        }
      },
      handleExpand() {
        if (this.mode === 'minimize') {
          this.setMode('resize');
        } else {
          this.setMode('maximize');
        }
      },
    }),
    { mode: split.state.mode, setMode: split.state.setMode },
    ['handleCollapse', 'handleExpand'],
  );

  return (
    <div
      data-s-split={split.state.split}
      data-s-mode={inverseMode}
      className={s(styles, { container: true, inverse })}
      onMouseDown={split.state.onMouseDown}
      onTouchStart={split.state.onTouchStart}
      onTouchEnd={split.state.onTouchEnd}
      onClick={split.state.onClick}
      onDoubleClick={split.state.onDoubleClick}
    >
      {split.state.mode !== 'minimize' && (
        <SplitControlButton
          className={s(styles, { resizeButton: isResizeMode })}
          mode={inverseMode}
          split={split.state.split}
          inverse={!inverse}
          onClick={handlers.handleCollapse}
        />
      )}
      {split.state.mode !== 'maximize' && (
        <SplitControlButton
          className={s(styles, { resizeButton: isResizeMode })}
          mode={inverseMode}
          split={split.state.split}
          inverse={inverse}
          onClick={handlers.handleExpand}
        />
      )}
    </div>
  );
};

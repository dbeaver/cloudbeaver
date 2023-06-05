/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../s';
import { useObjectRef } from '../useObjectRef';
import styles from './SplitControls.m.css';
import { useSplit } from './useSplit';

export const SplitControls: React.FC = function SplitControls() {
  const split = useSplit();

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
      handleCollapse(event: React.SyntheticEvent<HTMLButtonElement>) {
        if (this.mode === 'maximize') {
          this.setMode('resize');
        } else {
          this.setMode('minimize');
        }
      },
      handleExpand(event: React.SyntheticEvent<HTMLButtonElement>) {
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
        <button className={s(styles, { button: true, primary: !inverse })} type="button" onClick={handlers.handleCollapse}>
          <div className={s(styles, { ripple: true })} />
        </button>
      )}
      {split.state.mode !== 'maximize' && (
        <button className={s(styles, { button: true, primary: inverse })} type="button" onClick={handlers.handleExpand}>
          <div className={s(styles, { ripple: true })} />
        </button>
      )}
    </div>
  );
};

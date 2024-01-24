/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../s';
import { useObjectRef } from '../useObjectRef';
import { useS } from '../useS';
import SplitControlsStyles from './SplitControls.m.css';
import { useSplit } from './useSplit';

// TODO поправить либу.

// TODO хранить/получить в стейте minSize/maxSize
// ??? ничего не менять

// рыба
// 1. disableAutoMargin props в компонент сплит.
// 2. если нету disableAutoMargin, то к компоненте split определяем
// коллизию окна браузера и панели (вправо, влево, вниз, вверх)
// если есть коллизия, то ставим minize/maxsize Splitter (component)

// рыба внутри либы
// 1. учитывать minSize/maxSize при состояниях minimize/maximize
// и учитывать эти значения при определении состояние mode
// 2. сделать геттер на реф дива который рендерит Split (его контейнер) - splitRef (protected)

// setSize, getMainStyleSize
// либа должна коллапсить не до 0 а до state.minSize
// либа должна коллапсить не до 100% если maxSize > 0, то до state.maxSize
// либа должна коллапсить не до 100% если maxSize < 0, то до calc(100% - maxSize in px)

// финальная рыба
// 1. дофиксить сплит контролс так как он не учитывает minSize/maxSize
export const SplitControls: React.FC = function SplitControls() {
  const split = useSplit();
  const styles = useS(SplitControlsStyles);

  const inverse = split.state.isMainSecond();

  let inverseMode = split.state.mode;
  const isResizeMode = split.state.mode === 'resize';

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
        <button
          className={s(styles, { button: true, primary: !inverse, resizeButton: isResizeMode })}
          type="button"
          onClick={handlers.handleCollapse}
        >
          <div className={s(styles, { ripple: true })} />
        </button>
      )}
      {split.state.mode !== 'maximize' && (
        <button className={s(styles, { button: true, primary: inverse, resizeButton: isResizeMode })} type="button" onClick={handlers.handleExpand}>
          <div className={s(styles, { ripple: true })} />
        </button>
      )}
    </div>
  );
};

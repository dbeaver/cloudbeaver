/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Icon } from '../Icon';
import { s } from '../s';
import { useS } from '../useS';
import style from './SlideOverlay.m.css';

interface Props {
  className?: string;
  onClick?: () => void;
  open?: boolean;
}

export const SlideOverlay = observer<Props>(function SlideOverlay({ className, open, onClick }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { slideOverlay: true, open }, className)} onClick={onClick}>
      <div className={s(styles, { iconBtn: true })}>
        <Icon className={s(styles, { icon: true })} name="angle" viewBox="0 0 15 8" />
      </div>
    </div>
  );
});

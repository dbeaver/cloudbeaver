/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Icon } from '../Icon.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './SlideOverlay.module.css';

interface Props {
  className?: string;
  onClick?: () => void;
  open?: boolean;
}

export const SlideOverlay = observer<Props>(function SlideOverlay({ className, onClick }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { slideOverlay: true }, className)} onClick={onClick}>
      <div className={s(styles, { iconBtn: true })}>
        <Icon className={s(styles, { icon: true })} name="cross" viewBox="0 0 24 24" />
      </div>
    </div>
  );
});

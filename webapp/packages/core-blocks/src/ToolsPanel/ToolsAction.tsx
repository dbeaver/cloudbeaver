/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type ButtonHTMLAttributes, useState } from 'react';

import { IconOrImage } from '../IconOrImage.js';
import { Loader } from '../Loader/Loader.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import { useStateDelay } from '../useStateDelay.js';
import style from './ToolsAction.module.css';

interface Props extends Omit<ButtonHTMLAttributes<any>, 'onClick'> {
  icon?: string;
  viewBox?: string;
  svg?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => Promise<any> | any;
}

export const ToolsAction: React.FC<Props> = function ToolsAction({ icon, viewBox, disabled, svg, loading, children, className, onClick, ...rest }) {
  const styles = useS(style);
  const [loadingState, setLoadingState] = useState(false);

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    try {
      setLoadingState(true);
      await onClick?.(event);
    } finally {
      setLoadingState(false);
    }
  }

  loading = useStateDelay(loading || loadingState, 300);
  disabled = disabled || loadingState;

  return (
    <button type="button" disabled={disabled} onClick={handleClick} {...rest} className={s(styles, { button: true }, className)}>
      {loading && <Loader small />}
      {!loading && icon && <IconOrImage className={s(styles, { iconOrImage: true })} icon={icon} viewBox={viewBox} svg={svg} />}
      {children && <div className={s(styles, { buttonLabel: true })}>{children}</div>}
    </button>
  );
};

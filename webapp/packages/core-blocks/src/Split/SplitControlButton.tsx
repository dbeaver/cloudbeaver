/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { s } from '../s.js';
import styles from './SplitControlButton.module.css';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isPrimary: boolean;
  onClick: (event: React.SyntheticEvent<HTMLButtonElement>) => void;
  mode: 'maximize' | 'minimize' | 'resize';
  split: 'horizontal' | 'vertical';
}

export function SplitControlButton({ isPrimary, onClick, className, ...props }: Props): React.ReactElement {
  return (
    <button
      {...props}
      className={s(styles, { button: true, primary: isPrimary, [props.mode]: true, [props.split]: true }, className)}
      type="button"
      onClick={onClick}
    >
      <div className={s(styles, { ripple: true })} />
    </button>
  );
}

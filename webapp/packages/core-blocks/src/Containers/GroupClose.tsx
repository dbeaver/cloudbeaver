/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ActionIconButton } from '../ActionIconButton.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import styles from './GroupClose.module.css';

interface IProps {
  disabled?: boolean;
  onClick?: () => void;
}

export const GroupClose: React.FC<IProps & React.HTMLAttributes<HTMLDivElement>> = function GroupClose({ disabled, onClick, className, ...rest }) {
  const style = useS(styles);
  return (
    <div {...rest} className={s(style, { groupClose: true }, className)}>
      <ActionIconButton name="cross" viewBox="0 0 16 16" disabled={disabled} onClick={onClick} />
    </div>
  );
};

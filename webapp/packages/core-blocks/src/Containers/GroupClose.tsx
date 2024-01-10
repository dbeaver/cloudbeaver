/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Icon } from '../Icon';
import { s } from '../s';
import { useS } from '../useS';
import styles from './GroupClose.m.css';

interface IProps {
  onClick?: () => void;
}

export const GroupClose: React.FC<IProps & React.HTMLAttributes<HTMLDivElement>> = function GroupClose({ onClick, className, ...rest }) {
  const style = useS(styles);
  return (
    <div {...rest} className={s(style, { groupClose: true }, className)}>
      <Icon name="cross" viewBox="0 0 16 16" onClick={onClick} />
    </div>
  );
};

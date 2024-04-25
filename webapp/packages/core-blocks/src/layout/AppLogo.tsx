/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { IconOrImage } from '../IconOrImage';
import { s } from '../s';
import { useS } from '../useS';
import styles from './AppLogo.m.css';

interface Props {
  title: string;
  onClick?: () => void;
}

export const AppLogo: React.FC<Props> = function AppLogo({ title, onClick }) {
  const style = useS(styles);
  return (
    <div tabIndex={0} className={s(style, { container: true })} onClick={onClick}>
      <IconOrImage title={title} className={s(style, { logo: true })} icon="/icons/logo_sm.svg" />
    </div>
  );
};

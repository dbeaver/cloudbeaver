/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { IconOrImage } from '../IconOrImage.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import styles from './AppLogo.module.css';

interface Props {
  title: string;
  onClick?: () => void;
  iconSrc?: string;
}

export const AppLogo: React.FC<Props> = function AppLogo({ title, onClick, iconSrc = '/icons/logo_sm.svg' }) {
  const style = useS(styles);
  return (
    <div tabIndex={0} className={s(style, { container: true, active: onClick !== undefined })} onClick={onClick}>
      <IconOrImage title={title} className={s(style, { logo: true })} icon={iconSrc} />
    </div>
  );
};

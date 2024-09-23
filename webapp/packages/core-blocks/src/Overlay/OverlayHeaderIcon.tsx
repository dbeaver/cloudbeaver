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
import style from './OverlayHeaderIcon.module.css';

interface Props {
  icon?: string;
  viewBox?: string;
  className?: string;
}

export const OverlayHeaderIcon: React.FC<React.PropsWithChildren<Props>> = function OverlayHeaderIcon({ icon, viewBox, className, children }) {
  const styles = useS(style);

  if (!icon && !children) {
    return null;
  }

  return (
    <div className={s(styles, { iconContainer: true }, className)}>
      {icon && <IconOrImage className={s(styles, { iconOrImage: true })} icon={icon} viewBox={viewBox} />}
      {children}
    </div>
  );
};

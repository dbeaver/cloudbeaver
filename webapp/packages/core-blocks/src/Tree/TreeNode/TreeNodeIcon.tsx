/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { s } from '../../s';
import { StaticImage } from '../../StaticImage';
import { useS } from '../../useS';
import styles from './TreeNodeIcon.m.css';

interface Props {
  icon?: string;
  big?: boolean;
  style?: ComponentStyle;
  className?: string;
}

export const TreeNodeIcon: React.FC<React.PropsWithChildren<Props>> = function TreeNodeIcon({ icon, big, style, className, children }) {
  const computedStyles = useS(styles, style);

  return (
    <div className={s(computedStyles, { treeNodeIcon: true, big }, className)}>
      {icon && <StaticImage className={s(computedStyles, { staticImage: true })} icon={icon} />}
      {children}
    </div>
  );
};

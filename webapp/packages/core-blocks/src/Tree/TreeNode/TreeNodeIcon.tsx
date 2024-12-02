/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s } from '../../s.js';
import { StaticImage } from '../../StaticImage.js';
import { useS } from '../../useS.js';
import style from './TreeNodeIcon.module.css';

interface Props {
  icon?: string;
  className?: string;
}

export const TreeNodeIcon: React.FC<React.PropsWithChildren<Props>> = observer(function TreeNodeIcon({ icon, className, children }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { treeNodeIcon: true }, className)}>
      {icon && <StaticImage className={s(styles, { staticImage: true })} icon={icon} />}
      {children}
    </div>
  );
});

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import type { HTMLAttributes } from 'react';

import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './ToolsPanel.module.css';

type TType = 'primary' | 'secondary';
interface Props extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  type?: TType;
  center?: boolean;
  rounded?: boolean;
  minHeight?: boolean;
  bottomBorder?: boolean;
}

export const ToolsPanel: React.FC<React.PropsWithChildren<Props>> = observer(function ToolsPanel({
  className,
  children,
  center,
  rounded,
  minHeight,
  type = 'primary',
  bottomBorder = false,
  ...rest
}) {
  const styles = useS(style);

  return (
    <div {...rest} className={s(styles, { toolsPanel: true, [type]: true, bottomBorder, minHeight, center, rounded }, className)}>
      {children}
    </div>
  );
});

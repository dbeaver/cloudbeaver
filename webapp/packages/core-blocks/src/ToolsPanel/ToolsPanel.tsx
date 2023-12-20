/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s } from '../s';
import { useS } from '../useS';
import style from './ToolsPanel.m.css';

type TType = 'primary' | 'secondary';
interface Props {
  className?: string;
  type?: TType;
  hasBottomBorder?: boolean;
}

export const ToolsPanel: React.FC<React.PropsWithChildren<Props>> = observer(function ToolsPanel({
  className,
  children,
  type = 'primary',
  hasBottomBorder = false,
}) {
  const styles = useS(style);

  return <div className={s(styles, { toolsPanel: true, [type]: true, bottomBorder: hasBottomBorder }, className)}>{children}</div>;
});

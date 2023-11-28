/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../s';
import { useS } from '../useS';
import style from './ToolsPanel.m.css';

type TType = 'surface' | 'secondary';
interface Props {
  className?: string;
  type?: TType;
}

const types: Record<TType, string> = {
  surface: 'toolsPanel',
  secondary: 'toolsPanelSecondary',
};

export const ToolsPanel: React.FC<React.PropsWithChildren<Props>> = function ToolsPanel({ className, children, type = 'surface' }) {
  const styles = useS(style);

  return <div className={s(styles, { [types[type]]: true }, className)}>{children}</div>;
};

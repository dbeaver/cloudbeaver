/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { IconButton, type IconButtonProps } from '@dbeaver/ui-kit';

import { s } from '../s.js';
import { useS } from '../useS.js';
import classes from './ToolbarAction.module.css';

export interface IToolbarActionProps extends Omit<IconButtonProps, 'aria-label'> {
  active?: boolean;
  'aria-label'?: string;
}

export const ToolbarAction = observer(function ToolbarAction({
  active,
  className,
  title,
  'aria-label': ariaLabel,
  size = 'small',
  ...props
}: IToolbarActionProps) {
  const styles = useS(classes);

  return (
    <IconButton
      {...props}
      size={size}
      title={title}
      aria-label={ariaLabel ?? title ?? ''}
      className={s(styles, { toolbarAction: true, active }, className)}
    />
  );
});

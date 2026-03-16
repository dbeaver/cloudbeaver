/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import style from './ActionIconButton.module.css';
import { IconButton, type IconButtonProps } from './IconButton.js';
import { s } from './s.js';
import { useS } from './useS.js';

export interface ActionIconButtonProps extends IconButtonProps {
  primary?: boolean;
}

export const ActionIconButton: React.FC<ActionIconButtonProps> = observer(function ActionIconButton({ primary, ...rest }) {
  const styles = useS(style);

  return <IconButton {...rest} className={s(styles, { actionIconButton: true, size: true, primary }, rest.className)} />;
});

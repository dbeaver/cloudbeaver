/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import style from './ActionIconButton.m.css';
import { IconButton, type IconButtonProps } from './IconButton';
import { s } from './s';
import { useS } from './useS';

export const ActionIconButton: React.FC<IconButtonProps> = observer(function ActionIconButton(props) {
  const styles = useS(style);

  return <IconButton {...props} className={s(styles, { actionIconButton: true }, props.className)} />;
});

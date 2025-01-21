/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Switch, type SwitchProps } from '@mantine/core';

import styles from './MantineSwitch.module.css';

export function MantineSwitch(props: SwitchProps) {
  return (
    <Switch
      classNames={{ root: styles.switchWrapper, track: styles.track, thumb: styles.thumb, labelWrapper: styles.labelWrapper, label: styles.title }}
      {...props}
    />
  );
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Popover } from '@mantine/core';
import type { PropsWithChildren } from 'react';

import styles from './MantinePopover.module.css';

export function MantinePopover({ children }: PropsWithChildren) {
  return (
    <Popover classNames={{ dropdown: styles['popover'] }} width={200} position="bottom">
      <Popover.Target>{children}</Popover.Target>
      <Popover.Dropdown>This is uncontrolled popover, it is opened when button is clicked</Popover.Dropdown>
    </Popover>
  );
}

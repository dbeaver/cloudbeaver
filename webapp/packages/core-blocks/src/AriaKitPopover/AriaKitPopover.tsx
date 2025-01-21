/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import * as Ariakit from '@ariakit/react';
import styles from 'AriaKitPopover.module.css';
import { lazy, useState, useTransition } from 'react';

const Popover = lazy(() => import('./Popover.js'));

export function AriaKitPopover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [_, startTransition] = useTransition();

  return (
    <Ariakit.PopoverProvider
      open={open}
      setOpen={open => {
        if (open) {
          return startTransition(() => setOpen(open));
        }
        setOpen(open);
      }}
    >
      <Ariakit.PopoverDisclosure>{children}</Ariakit.PopoverDisclosure>
      {open && (
        <Popover className={styles['popover']}>
          <Ariakit.PopoverArrow className={styles['arrow']} />
          <Ariakit.PopoverHeading className={styles['heading']}>Team meeting</Ariakit.PopoverHeading>
          <Ariakit.PopoverDescription>We are going to discuss what we have achieved on the project.</Ariakit.PopoverDescription>
          <div>
            <p>12 Jan 2022 18:00 to 19:00</p>
            <p>Alert 10 minutes before start</p>
          </div>
          <Ariakit.Button className={styles['button']}>Accept</Ariakit.Button>
        </Popover>
      )}
    </Ariakit.PopoverProvider>
  );
}

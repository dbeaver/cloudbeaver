/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { Loader } from '@cloudbeaver/core-blocks';
import { clsx } from '@dbeaver/ui-kit';

export interface IAdministrationPageHeaderProps extends ComponentPropsWithRef<'header'> {
  actionsSlot?: ReactNode;
}

export const AdministrationPageHeader = observer<IAdministrationPageHeaderProps>(function AdministrationPageHeader({
  actionsSlot,
  className,
  children,
  ...props
}) {
  return (
    <header
      {...props}
      className={clsx(
        'tw:row-start-1 tw:col-start-1 tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-x-6 tw:gap-y-4 tw:mb-4',
        className,
      )}
    >
      {children}
      {actionsSlot && (
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:min-w-0">
          <Loader suspense inline>
            {actionsSlot}
          </Loader>
        </div>
      )}
    </header>
  );
});

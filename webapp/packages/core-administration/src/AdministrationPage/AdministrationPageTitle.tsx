/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ComponentPropsWithRef } from 'react';
import { observer } from 'mobx-react-lite';

import { Link } from '@cloudbeaver/core-blocks';
import { clsx } from '@dbeaver/ui-kit';

export interface IAdministrationPageTitleProps extends ComponentPropsWithRef<'h1'> {
  docLink?: string;
}

export const AdministrationPageTitle = observer(function AdministrationPageTitle({
  className,
  docLink,
  children,
  ...props
}: IAdministrationPageTitleProps) {
  return (
    <h1 {...props} className={clsx('tw:m-0! tw:text-2xl! tw:leading-[1.4] tw:font-semibold', className)}>
      {docLink ? (
        <Link href={docLink} target="_blank" rel="noreferrer" inline wrapper indicator>
          {children}
        </Link>
      ) : (
        children
      )}
    </h1>
  );
});

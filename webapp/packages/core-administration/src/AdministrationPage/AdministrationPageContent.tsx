/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type { ComponentPropsWithRef } from 'react';

import { clsx } from '@dbeaver/ui-kit';

export const AdministrationPageContent = observer<ComponentPropsWithRef<'div'>>(function AdministrationPageContent({ className, ...props }) {
  return (
    <div
      {...props}
      className={clsx('tw:row-start-3 tw:col-start-1 tw:flex tw:flex-col tw:min-w-0 tw:min-h-0 tw:gap-5 tw:pt-5 tw:overflow-auto', className)}
    />
  );
});

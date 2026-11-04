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

export const AdministrationPageNavigation = observer<ComponentPropsWithRef<'div'>>(function AdministrationPageNavigation({ className, ...props }) {
  return <div {...props} className={clsx('tw:row-start-2 tw:col-start-1 tw:min-w-0', className)} />;
});

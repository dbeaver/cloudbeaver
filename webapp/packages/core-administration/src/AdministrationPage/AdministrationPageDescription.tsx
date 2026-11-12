/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ComponentPropsWithRef } from 'react';
import { observer } from 'mobx-react-lite';

import { clsx } from '@dbeaver/ui-kit';

export const AdministrationPageDescription = observer<ComponentPropsWithRef<'p'>>(function AdministrationPageDescription({ className, ...props }) {
  return <p {...props} className={clsx('tw:m-0 tw:text-(--theme-text-hint-on-light) tw:leading-relaxed', className)} />;
});

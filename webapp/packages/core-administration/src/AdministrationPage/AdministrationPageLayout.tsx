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

export type AdministrationPageLayoutProps = ComponentPropsWithRef<'section'>;

type Props = AdministrationPageLayoutProps;

export const AdministrationPageLayout = observer<Props>(function AdministrationPageLayout({ className, ...props }) {
  return (
    <section
      {...props}
      className={clsx(
        'tw:grid tw:grid-cols-1 tw:grid-rows-[auto_auto_minmax(0,1fr)] tw:flex-1 tw:min-w-0 tw:min-h-0 tw:py-6 tw:px-8 tw:bg-(--theme-sub-secondary) tw:text-(--theme-on-surface) tw:max-[720px]:px-4 tw:max-[720px]:py-5',
        className,
      )}
    />
  );
});

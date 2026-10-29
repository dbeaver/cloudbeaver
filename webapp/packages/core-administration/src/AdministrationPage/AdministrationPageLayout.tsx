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

export type IAdministrationPageLayoutProps = ComponentPropsWithRef<'section'>;

export interface IAdministrationPageHeaderProps extends ComponentPropsWithRef<'header'> {
  actionsSlot?: ReactNode;
}

type Props = IAdministrationPageLayoutProps;

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

export const AdministrationPageNavigation = observer<ComponentPropsWithRef<'div'>>(function AdministrationPageNavigation({ className, ...props }) {
  return <div {...props} className={clsx('tw:row-start-2 tw:col-start-1 tw:min-w-0', className)} />;
});

export const AdministrationPageContent = observer<ComponentPropsWithRef<'div'>>(function AdministrationPageContent({ className, ...props }) {
  return (
    <div
      {...props}
      className={clsx('tw:row-start-3 tw:col-start-1 tw:flex tw:flex-col tw:min-w-0 tw:min-h-0 tw:gap-5 tw:pt-5 tw:overflow-auto', className)}
    />
  );
});

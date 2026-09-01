/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { clsx } from '@dbeaver/ui-kit';

export interface IConnectionSectionWrapperProps {
  className?: string;
}

export const ConnectionSectionWrapper = observer<React.PropsWithChildren<IConnectionSectionWrapperProps>>(function ConnectionSectionWrapper({
  children,
  className,
}) {
  return <div className={clsx('tw:flex tw:w-full tw:max-w-xl tw:flex-col tw:gap-6 tw:p-6', className)}>{children}</div>;
});

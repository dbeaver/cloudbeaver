/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { clsx } from '@dbeaver/ui-kit';

interface Props {
  className?: string;
  children?: React.ReactNode;
  inline?: boolean;
}

export const Code = observer<Props>(function Code({ children, className, inline }) {
  return (
    <div
      className={clsx(
        'tw:flex tw:p-4 tw:items-start tw:overflow-x-auto tw:rounded-(--theme-group-element-radius) theme-background-secondary theme-text-on-secondary', className,
      )}
    >
      <div className='tw:align-middle'>
        <code className={clsx(inline && 'tw:whitespace-nowrap')}>{children}</code>
      </div>
    </div>
  );
});

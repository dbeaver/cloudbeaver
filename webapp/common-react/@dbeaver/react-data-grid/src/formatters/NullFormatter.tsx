/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { clsx } from '@dbeaver/ui-kit';

interface Props {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export function NullFormatter({ className, onClick }: Props) {
  return (
    <span className={clsx('tw:uppercase', 'tw:opacity-75', className)} onClick={onClick}>
      [NULL]
    </span>
  );
}

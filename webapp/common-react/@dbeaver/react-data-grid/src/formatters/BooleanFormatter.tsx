/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NullFormatter } from './NullFormatter.js';
import { CheckboxIndicator, clsx, Focusable } from '@dbeaver/ui-kit';

interface Props {
  value: boolean | null;
  className?: string;
  focusable?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
}

export function BooleanFormatter({ value, className, onClick, onKeyDown, focusable }: Props): React.ReactElement {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.code === 'Enter' || event.code === 'Space') {
      event.preventDefault();
      onKeyDown?.(event);
    }
  };
  return (
    <Focusable
      focusable={focusable}
      className={clsx('tw:flex tw:items-center tw:outline-none tw:hover:cursor-pointer', className)}
      onKeyDown={handleKeyDown}
      onClick={onClick}
    >
      {value === null ? <NullFormatter /> : <CheckboxIndicator size="small" checked={value} />}
    </Focusable>
  );
}

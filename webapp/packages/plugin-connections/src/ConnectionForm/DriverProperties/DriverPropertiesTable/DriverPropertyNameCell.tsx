/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useLayoutEffect, useRef } from 'react';

import { clsx, Input } from '@dbeaver/ui-kit';

import type { IDriverProperty } from './IDriverProperty.js';

interface Props {
  property: IDriverProperty;
  error: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  tabIndex: number;
  onChange: (id: string, key: string) => void;
  onFocusHandled: () => void;
}

export const DriverPropertyNameCell = observer<Props>(function DriverPropertyNameCell({
  property,
  error,
  readOnly,
  autoFocus,
  tabIndex,
  onChange,
  onFocusHandled,
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (inputRef.current && autoFocus) {
      inputRef.current.focus();
      onFocusHandled();
    }
  }, [autoFocus, onFocusHandled]);

  if (!property.custom || readOnly) {
    const name = property.displayName ?? property.key;
    return (
      <span title={property.description ?? name} className="tw:min-w-0 tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap tw:font-medium">
        {name}
      </span>
    );
  }

  return (
    <Input
      ref={inputRef}
      className={clsx(
        'tw:w-full tw:[--dbv-kit-input-background:transparent]',
        error ? 'tw:[--dbv-kit-input-border-color:var(--theme-error)]' : 'tw:[--dbv-kit-input-border-color:transparent]',
      )}
      title={property.description}
      value={property.key}
      type="text"
      name={property.id}
      placeholder={property.keyPlaceholder}
      aria-invalid={error}
      autoComplete="none"
      size="small"
      tabIndex={tabIndex}
      onChange={event => onChange(property.id, event.target.value)}
    />
  );
});

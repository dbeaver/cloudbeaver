/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { type ReactNode } from 'react';

import { IconOrImage } from '../IconOrImage.js';
import { DisclosureProvider, Disclosure, DisclosureContent, clsx } from '@dbeaver/ui-kit';
import './Expandable.css';

interface Props {
  label: string | ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Expandable = observer(function Expandable({ label, defaultExpanded, disabled, children, className }: Props) {
  return (
    <div>
      <DisclosureProvider defaultOpen={defaultExpanded}>
        <Disclosure disabled={disabled}>
          <IconOrImage className="disclosure-icon" icon="arrow" />
          {typeof label === 'string' ? <h2 className="theme-typography--body2 disclosure-label">{label}</h2> : label}
        </Disclosure>
        <DisclosureContent>
          <div>
            <div className={clsx('disclosure-content-inner', className)}> {children}</div>
          </div>
        </DisclosureContent>
      </DisclosureProvider>
    </div>
  );
});

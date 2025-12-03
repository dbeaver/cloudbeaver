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
import { DisclosureProvider, Disclosure, DisclosureContent } from '@dbeaver/ui-kit';
import './Expandable.css';

interface Props {
  label: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  disabled?: boolean;
}

export const Expandable = observer(function Expandable({ label, defaultExpanded, disabled, children }: Props) {
  return (
    <div>
      <DisclosureProvider defaultOpen={defaultExpanded}>
        <Disclosure disabled={disabled}>
          <IconOrImage className="disclosure-icon" icon="arrow" />
          <h2 className="theme-typography--body2 disclosure-label">{label}</h2>
        </Disclosure>
        <DisclosureContent>
          <div>
            <div className="disclosure-content-inner"> {children}</div>
          </div>
        </DisclosureContent>
      </DisclosureProvider>
    </div>
  );
});

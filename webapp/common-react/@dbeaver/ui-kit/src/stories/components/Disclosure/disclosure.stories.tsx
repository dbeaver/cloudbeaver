/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Disclosure, DisclosureContent, DisclosureProvider } from '@dbeaver/ui-kit';

export const Default = () => (
  <DisclosureProvider>
    <Disclosure>Toggle</Disclosure>
    <DisclosureContent>Expanded content</DisclosureContent>
  </DisclosureProvider>
);

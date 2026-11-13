/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PropsWithChildren, ReactElement } from 'react';

import type { IServiceProvider } from './IServiceProvider.js';

import { ServicesContext } from './ServicesContext.js';

export function ServiceProvider({ provider, children }: PropsWithChildren<{ provider: IServiceProvider | null }>): ReactElement {
  return <ServicesContext value={provider}>{children}</ServicesContext>;
}

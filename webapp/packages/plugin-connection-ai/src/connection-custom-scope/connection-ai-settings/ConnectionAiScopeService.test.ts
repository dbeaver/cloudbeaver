/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { expect, it } from 'vitest';

import { PlaceholderContainer } from '@cloudbeaver/core-blocks';

import { ConnectionAiScopeService } from './ConnectionAiScopeService.js';
import type { ConnectionFormAiService, ConnectionFormAiContainerProps } from '../../connection-ai-settings/ConnectionFormAiService.js';

it('contributes connection scope before other AI settings extensions', () => {
  const optionsContainer = new PlaceholderContainer<ConnectionFormAiContainerProps>();
  const extension = () => null;
  optionsContainer.add(extension, 100);

  new ConnectionAiScopeService({ optionsContainer } as unknown as ConnectionFormAiService).register();

  expect(optionsContainer.get()).toHaveLength(2);
  expect(optionsContainer.get()[0]?.order).toBe(0);
  expect(optionsContainer.get()[1]?.component).toBe(extension);
});

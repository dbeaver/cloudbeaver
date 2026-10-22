/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';

import type { AIChatConversationInfo } from './AIChatConversationsResource.js';

export interface IAIChatConversationMenuProps {
  conversation: AIChatConversationInfo;
  disabled?: boolean;
}

@injectable()
export class AIChatConversationMenuService {
  readonly sections = new PlaceholderContainer<IAIChatConversationMenuProps>();
}

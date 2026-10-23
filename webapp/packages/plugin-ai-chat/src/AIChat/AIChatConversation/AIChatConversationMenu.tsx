/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Menu, MenuProvider, MenuButton } from '@dbeaver/ui-kit';
import { ActionIconButton, usePlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { AIChatConversationsService, type IAIChatConversationMenuProps } from './AIChatConversationsService.js';

export const AIChatConversationMenu = observer<IAIChatConversationMenuProps>(function AIChatConversationMenu(props) {
  const translate = useTranslate();
  const aiChatConversationsService = useService(AIChatConversationsService);
  const sections = usePlaceholder({ container: aiChatConversationsService.menuSections, props });

  if (sections.length === 0) {
    return null;
  }

  const label = translate('plugin_ai_chat_configuration');

  return (
    <MenuProvider placement="bottom-end">
      <MenuButton render={<ActionIconButton disabled={props.disabled} title={label} aria-label={label} name="/icons/scope.svg" img />} />
      <Menu modal fitViewport>
        {sections.map(({ id, component: Section }) => (
          <Section key={id} {...props} />
        ))}
      </Menu>
    </MenuProvider>
  );
});

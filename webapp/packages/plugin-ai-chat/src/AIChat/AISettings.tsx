/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Menu, MenuProvider, MenuButton, MenuGroup, MenuGroupLabel, MenuItemCheckbox } from '@dbeaver/ui-kit';
import { ActionIconButton, Checkbox, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { AIChatService } from './AIChatService.js';

export const AISettings = observer(function AISettings() {
  const translate = useTranslate();
  const aiChatService = useService(AIChatService);

  return (
    <MenuProvider placement="bottom-end">
      <MenuButton render={<ActionIconButton title={translate('plugin_ai_chat_settings')} name="/icons/settings_cog_sm.svg" img />} />
      <Menu modal>
        <MenuGroup className="tw:flex tw:flex-col tw:gap-1">
          <MenuGroupLabel>{translate('plugin_ai_chat_label')}</MenuGroupLabel>

          <MenuItemCheckbox
            name="metrics"
            checked={aiChatService.metrics}
            render={props => (
              <div {...props}>
                <Checkbox
                  size="small"
                  checked={aiChatService.metrics}
                  label={translate('plugin_ai_chat_settings_metrics_enable')}
                  onClick={props.onClick}
                />
              </div>
            )}
            onClick={() => aiChatService.toggleMetrics()}
          />
        </MenuGroup>
      </Menu>
    </MenuProvider>
  );
});

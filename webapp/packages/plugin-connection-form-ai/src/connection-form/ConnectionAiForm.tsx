/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Checkbox, ColoredContainer, Container, Group, Placeholder, useAutoLoad, useTranslate } from '@cloudbeaver/core-blocks';
import { getConnectionFormOptionsPart, type IConnectionFormProps } from '@cloudbeaver/plugin-connections';
import { getConnectionAiPart } from './getConnectionAiPart.js';
import { observer } from 'mobx-react-lite';
import { useService } from '@cloudbeaver/core-di';
import { useTab, type TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import { ConnectionFormAiService } from '../ConnectionFormAiService.js';

export const ConnectionAiForm: TabContainerPanelComponent<IConnectionFormProps> = observer(function ConnectionAiForm({ tabId, formState }) {
  const translate = useTranslate();
  const { selected } = useTab(tabId);
  const aiPart = getConnectionAiPart(formState);
  const optionsFormPart = getConnectionFormOptionsPart(formState);
  const connectionFormAiService = useService(ConnectionFormAiService);

  useAutoLoad(ConnectionAiForm, [optionsFormPart, aiPart], selected);

  return (
    <ColoredContainer wrap overflow parent gap>
      <Container medium gap>
        <Group>
          <Container>
            <Checkbox
              title={translate('plugin_connection_form_ai_form_transfer_description')}
              state={aiPart.state}
              name="metaTransferConfirmed"
              label={translate('plugin_connection_form_ai_form_transfer_enabled')}
            />
          </Container>
          {selected && <Placeholder container={connectionFormAiService.optionsContainer} formState={formState} />}
        </Group>
      </Container>
    </ColoredContainer>
  );
});

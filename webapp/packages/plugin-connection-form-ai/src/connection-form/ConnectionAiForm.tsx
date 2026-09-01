/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Checkbox, Placeholder, useAutoLoad, useTranslate } from '@cloudbeaver/core-blocks';
import { ConnectionSectionWrapper, getConnectionFormOptionsPart, type IConnectionFormProps } from '@cloudbeaver/plugin-connections';
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
    <div className="tw:flex tw:flex-1 tw:overflow-auto">
      <ConnectionSectionWrapper>
        <Checkbox
          title={translate('plugin_connection_form_ai_form_transfer_description')}
          state={aiPart.state}
          name="metaTransferConfirmed"
          label={translate('plugin_connection_form_ai_form_transfer_enabled')}
        />
        {selected && <Placeholder container={connectionFormAiService.optionsContainer} formState={formState} />}
      </ConnectionSectionWrapper>
    </div>
  );
});

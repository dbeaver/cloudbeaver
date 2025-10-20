/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { Tab, TabList, TabPanel, TabsState, TabTitle, type ITabData } from '@cloudbeaver/core-ui';
import { SingleColorRuleForm } from './SingleColorRuleForm.js';
import type { IFormatRuleState } from '../../formatting/IFormatRuleState.js';
import { ColorScaleRuleForm } from './ColorScaleRuleForm.js';
import { ActionIconButton, Fill, useTranslate } from '@cloudbeaver/core-blocks';
import type { IColumnInfo } from '../../formatting/IColumnInfo.js';

interface Props {
  columns: IColumnInfo[];
  state: IFormatRuleState;
  onBack?: () => void;
  onDelete?: () => void;
}

export const ConditionalFormattingRuleForm = observer<Props>(function ConditionalFormattingRuleForm({ columns, state, onBack, onDelete }) {
  const t = useTranslate();
  const handleTabChange = ({ tabId }: ITabData) => {
    state.type = tabId === 'scale' ? 'scale' : 'single';
  };

  return (
    <div className="tw:flex tw:flex-col tw:overflow-hidden">
      <TabsState selectedId={state.type} autoSelect onChange={handleTabChange}>
        <TabList underline>
          <Tab tabId="single">
            <TabTitle>{t('plugin_data_viewer_conditional_formatting_single_color')}</TabTitle>
          </Tab>
          <Tab tabId="scale">
            <TabTitle>{t('plugin_data_viewer_conditional_formatting_color_scale')}</TabTitle>
          </Tab>
          <Fill />
          {onBack && <ActionIconButton name="cross" title={t('ui_close')} onClick={onBack} />}
        </TabList>
        <TabPanel tabId="single">
          <SingleColorRuleForm columns={columns} state={state} onDelete={onDelete} />
        </TabPanel>
        <TabPanel tabId="scale">
          <ColorScaleRuleForm columns={columns} state={state} onDelete={onDelete} />
        </TabPanel>
      </TabsState>
    </div>
  );
});

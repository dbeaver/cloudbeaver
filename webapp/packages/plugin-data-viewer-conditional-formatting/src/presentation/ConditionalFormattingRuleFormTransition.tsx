/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type { IFormatRuleState } from '../formatting/IFormatRuleState.js';
import { FormattingRule } from './FormattingRule.js';
import type { IColumnInfo } from '../formatting/IColumnInfo.js';
import { useRuleTransition } from './useRuleTransition.js';
import { ActionIconButton, useTranslate } from '@cloudbeaver/core-blocks';
import { ConditionalFormattingRuleForm } from './rule-form/ConditionalFormattingRuleForm.js';

interface Props {
  rules: IFormatRuleState[];
  columns: IColumnInfo[];
  selectedRule: IFormatRuleState;
  onRuleAdd: () => void;
  onRuleSelect: (rule: IFormatRuleState | null) => void;
  onRuleDelete: (rule: IFormatRuleState) => void;
}

export const ConditionalFormattingRuleFormTransition = observer(function ConditionalFormattingRuleFormTransition({
  rules,
  columns,
  selectedRule,
  onRuleAdd,
  onRuleSelect,
  onRuleDelete,
}: Props) {
  const t = useTranslate();
  const ruleTransition = useRuleTransition(rules, selectedRule);

  function handleBack() {
    onRuleSelect(null);
  }

  return (
    <div className="tw:relative tw:flex-1 tw:flex tw:flex-col tw:overflow-hidden">
      <div className="tw:flex tw:overflow-auto">
        <div className="tw:flex tw:overflow-auto">
          {rules.map(state => (
            <FormattingRule
              key={state.id}
              columns={columns}
              state={state}
              selected={selectedRule.id === state.id}
              preview
              onSelect={() => onRuleSelect(state)}
              onDelete={() => onRuleDelete(state)}
            />
          ))}
        </div>
        <div className="tw:flex tw:items-center tw:shrink-0 tw:overflow-hidden">
          <ActionIconButton
            name="add"
            viewBox="0 0 24 24"
            title={t('plugin_data_viewer_conditional_formatting_add_another_rule')}
            onClick={onRuleAdd}
          />
        </div>
      </div>
      <div className="tw:relative tw:flex-1 tw:overflow-hidden">
        {ruleTransition.previousRule && (
          <div
            key={ruleTransition.previousRule.id}
            style={{
              position: 'absolute',
              display: 'flex',
              width: '100%',
              height: '100%',
              transform: ruleTransition.isAnimating ? `translateX(${ruleTransition.direction === 'left' ? '-100%' : '100%'})` : 'translateX(0)',
              transition: 'transform 0.3s ease-out',
            }}
          >
            <ConditionalFormattingRuleForm columns={columns} state={ruleTransition.previousRule} onBack={handleBack} />
          </div>
        )}
        <div
          key={selectedRule.id}
          style={{
            position: 'absolute',
            display: 'flex',
            width: '100%',
            height: '100%',
            transform: ruleTransition.isAnimating ? 'translateX(0)' : `translateX(${ruleTransition.direction === 'left' ? '100%' : '-100%'})`,
            transition: 'transform 0.3s ease-out',
          }}
        >
          <ConditionalFormattingRuleForm columns={columns} state={selectedRule} onBack={handleBack} onDelete={() => onRuleDelete(selectedRule)} />
        </div>
      </div>
    </div>
  );
});

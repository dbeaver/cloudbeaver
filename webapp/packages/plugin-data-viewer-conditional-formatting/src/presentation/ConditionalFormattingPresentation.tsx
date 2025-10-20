/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ActionIconButton, Button, Container, Group, GroupItem, useTranslate } from '@cloudbeaver/core-blocks';
import { GridViewAction, IDatabaseDataViewAction, type DataPresentationComponent } from '@cloudbeaver/plugin-data-viewer';
import { observer } from 'mobx-react-lite';
import { ConditionalFormattingRuleForm } from './rule-form/ConditionalFormattingRuleForm.js';
import { GridConditionalFormattingAction } from '../GridConditionalFormattingAction.js';
import type { IFormatRuleState } from '../formatting/IFormatRuleState.js';
import { useState } from 'react';
import type { IColumnInfo } from '../formatting/IColumnInfo.js';
import { ALL_COLUMNS } from '../formatting/ALL_COLUMNS.js';
import { FormattingRule } from './FormattingRule.js';
import { useRuleTransition } from './useRuleTransition.js';

export const ConditionalFormattingPresentation: DataPresentationComponent = observer(function ConditionalFormattingPresentation({
  model,
  resultIndex,
}) {
  const [selectedRule, setSelectedRule] = useState<IFormatRuleState | null>(null);
  const conditionalFormattingAction = model.source.getAction(resultIndex, GridConditionalFormattingAction);
  const viewAction = model.source.getAction(resultIndex, IDatabaseDataViewAction, GridViewAction);
  const t = useTranslate();

  const ruleTransition = useRuleTransition(conditionalFormattingAction.rules, selectedRule);

  function handleAddRule() {
    const rule = conditionalFormattingAction?.createRule();
    setSelectedRule(rule);
  }

  function handleBack() {
    setSelectedRule(null);
  }

  function handleDeleteRule(state: IFormatRuleState, selectNext: boolean = true) {
    if (selectNext) {
      const currentIndex = conditionalFormattingAction.rules.findIndex(r => r.id === state.id);
      if (currentIndex !== -1) {
        const rules = conditionalFormattingAction.rules;
        const nextRule = rules[currentIndex + 1] || rules[currentIndex - 1];
        setSelectedRule(nextRule || null);
      }
    } else {
      setSelectedRule(null);
    }

    conditionalFormattingAction.deleteRule(state.id);
  }

  const columns: IColumnInfo[] = [
    ALL_COLUMNS,
    ...viewAction.columnKeys.map<IColumnInfo>(col => ({
      name: viewAction.getColumnName(col) || 'unknown',
      key: col,
    })),
  ];

  return (
    <div className="theme-background-secondary theme-text-on-secondary tw:relative tw:flex-1 tw:flex tw:overflow-hidden">
      {selectedRule ? (
        <div className="tw:relative tw:flex-1 tw:flex tw:flex-col tw:overflow-hidden">
          <div className="tw:flex tw:overflow-auto">
            <div className="tw:flex tw:overflow-auto">
              {conditionalFormattingAction.rules.map(state => (
                <FormattingRule
                  key={state.id}
                  columns={columns}
                  state={state}
                  selected={selectedRule.id === state.id}
                  preview
                  onSelect={() => setSelectedRule(state)}
                  onDelete={() => handleDeleteRule(state)}
                />
              ))}
            </div>
            <div className="tw:flex tw:items-center tw:shrink-0 tw:overflow-hidden">
              <ActionIconButton
                name="add"
                viewBox="0 0 24 24"
                title={t('plugin_data_viewer_conditional_formatting_add_another_rule')}
                onClick={handleAddRule}
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
              <ConditionalFormattingRuleForm
                columns={columns}
                state={selectedRule}
                onBack={handleBack}
                onDelete={() => handleDeleteRule(selectedRule)}
              />
            </div>
          </div>
        </div>
      ) : (
        <Group gap overflow>
          <Container overflow>
            {conditionalFormattingAction.rules.map(state => (
              <FormattingRule
                key={state.id}
                columns={columns}
                state={state}
                onSelect={() => setSelectedRule(state)}
                onDelete={() => handleDeleteRule(state, false)}
              />
            ))}
            {conditionalFormattingAction.rules.length === 0 && <div>{t('plugin_data_viewer_conditional_formatting_no_rules')}</div>}
          </Container>
          <GroupItem>
            <Button
              icon="add_sm"
              iconPlacement="start"
              aria-label={t('plugin_data_viewer_conditional_formatting_add_another_rule')}
              type="button"
              variant="secondary"
              onClick={handleAddRule}
            >
              {t('plugin_data_viewer_conditional_formatting_add_another_rule')}
            </Button>
          </GroupItem>
        </Group>
      )}
    </div>
  );
});

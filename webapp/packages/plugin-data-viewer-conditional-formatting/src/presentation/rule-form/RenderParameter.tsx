/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { FieldCheckbox, InputField, Select, useTranslate } from '@cloudbeaver/core-blocks';
import type { IFormatRuleParameter } from '../../formatting/IFormatRule.js';
import { ColorPicker } from '@dbeaver/ui-kit';
import { observer } from 'mobx-react-lite';

interface Props {
  parameter: IFormatRuleParameter;
  state: Record<string, any>;
}

export const RenderParameter = observer<Props>(function RenderParameter({ parameter, state }) {
  const t = useTranslate();

  if (parameter.type === 'boolean') {
    return (
      <FieldCheckbox name={parameter.key} state={state} defaultChecked={parameter.default as boolean} groupGap>
        {t(parameter.name)}
      </FieldCheckbox>
    );
  }

  if (parameter.type === 'select') {
    return (
      <Select
        items={parameter.options || []}
        name={parameter.key}
        state={state}
        defaultValue={parameter.default as string}
        keySelector={item => item.value}
        valueSelector={item => t(item.label)}
        zeroBasis
        tiny
      >
        {t(parameter.name)}
      </Select>
    );
  }

  if (parameter.type === 'color') {
    return (
      <div className="tw:flex tw:flex-none! tw:items-end">
        <ColorPicker
          name={parameter.key}
          value={state[parameter.key] || ''}
          defaultValue={parameter.default as string}
          onChange={color => (state[parameter.key] = color)}
        />
      </div>
    );
  }

  return (
    <InputField
      key={parameter.key}
      type={parameter.type}
      name={parameter.key}
      state={state}
      defaultState={{ [parameter.key]: parameter.default }}
      defaultValue={parameter.default as any}
      placeholder={t(parameter.name)}
      tiny
    >
      {t(parameter.name)}
    </InputField>
  );
});

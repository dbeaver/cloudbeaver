/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Container, InputField, Select, useTranslate } from '@cloudbeaver/core-blocks';
import { observer } from 'mobx-react-lite';
import type { IFormatRuleParameter } from '../../formatting/IFormatRule.js';
import { ColorPicker } from '@dbeaver/ui-kit';

interface Props {
  state: Record<string, any>;
  valueDisabled: boolean;
  typeParam?: IFormatRuleParameter;
  valueParam?: IFormatRuleParameter;
  colorParam?: IFormatRuleParameter;
  defaultColorValue?: string;
  colorMapState?: (state: any) => any;
  colorDisabled?: boolean;
}

export const ColorScalePointFields = observer<Props>(function ColorScalePointFields({
  typeParam,
  valueParam,
  colorParam,
  defaultColorValue,
  state,
  valueDisabled,
  colorMapState,
  colorDisabled,
}) {
  const t = useTranslate();

  const colorValue = state[colorParam?.key || ''] || (colorParam ? (colorParam.default ?? defaultColorValue) : undefined);
  const mappedColor = colorMapState ? colorMapState({ [colorParam?.key || '']: colorValue }) : colorValue;
  return (
    <Container gap>
      {typeParam && (
        <Select
          items={typeParam.options || []}
          name={typeParam.key}
          state={state}
          defaultValue={typeParam.default as string}
          keySelector={item => item.value}
          valueSelector={item => t(item.label)}
          zeroBasis
          tiny
        >
          {t(typeParam.name)}
        </Select>
      )}
      {valueParam && (
        <InputField
          type={valueParam.type}
          name={valueParam.key}
          state={state}
          defaultState={{ [valueParam.key]: valueParam.default }}
          defaultValue={valueParam.default as string}
          placeholder={t(valueParam.name)}
          disabled={valueDisabled}
          zeroBasis
          tiny
        >
          {t(valueParam.name)}
        </InputField>
      )}
      {colorParam && (
        <div className="tw:flex tw:flex-none! tw:items-end">
          <ColorPicker
            name={colorParam.key}
            value={mappedColor}
            title={t(colorParam.name)}
            defaultValue={(colorParam.default ?? defaultColorValue) as string}
            disabled={colorDisabled}
            onChange={color => (state[colorParam.key] = color)}
          />
        </div>
      )}
    </Container>
  );
});

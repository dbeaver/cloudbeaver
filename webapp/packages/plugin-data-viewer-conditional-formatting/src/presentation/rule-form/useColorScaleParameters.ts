/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useMemo } from 'react';
import { ThemeService } from '@cloudbeaver/core-theming';
import { useService } from '@cloudbeaver/core-di';
import type { IFormatRule, IFormatRuleParameter } from '../../formatting/IFormatRule.js';
import type { IFormatRuleState } from '../../formatting/IFormatRuleState.js';
import { getValueForRuleParameter } from '../../formatting/getValueForRuleParameter.js';
import { getSurfaceColor } from '../../getSurfaceColor.js';

interface IColorScalePoint {
  typeParam?: IFormatRuleParameter;
  valueParam?: IFormatRuleParameter;
  colorParam?: IFormatRuleParameter;
  get typeValue(): string | undefined;
  get colorValue(): string;
  get valueDisabled(): boolean;
}

interface IColorScaleParameters {
  min: IColorScalePoint;
  mid: IColorScalePoint;
  max: IColorScalePoint;
}

export function useColorScaleParameters(rule: IFormatRule, state: IFormatRuleState): IColorScaleParameters {
  const themeService = useService(ThemeService);
  const themeType = themeService.currentTheme?.type;
  return useMemo(() => {
    const surfaceColor = getSurfaceColor(themeType);
    const findParam = (key: string) => rule.parameters?.[key];
    const findFormat = (key: string) => rule.formatting?.[key];

    const min: IColorScalePoint = {
      typeParam: findParam('min-type'),
      valueParam: findParam('min-value'),
      colorParam: findFormat('min-color'),
      get typeValue() {
        return getValueForRuleParameter<string>(state.parameters, rule.parameters, 'min-type');
      },
      get colorValue() {
        return getValueForRuleParameter<string>(state.parameters, rule.formatting, 'min-color', surfaceColor);
      },
      get valueDisabled() {
        return this.typeValue === 'min-value';
      },
    };

    const mid: IColorScalePoint = {
      typeParam: findParam('mid-type'),
      valueParam: findParam('mid-value'),
      colorParam: findFormat('mid-color'),
      get typeValue() {
        return getValueForRuleParameter<string>(state.parameters, rule.parameters, 'mid-type');
      },
      get colorValue() {
        return getValueForRuleParameter<string>(state.parameters, rule.formatting, 'mid-color', '#ffff00');
      },
      get valueDisabled() {
        return this.typeValue === 'none';
      },
    };

    const max: IColorScalePoint = {
      typeParam: findParam('max-type'),
      valueParam: findParam('max-value'),
      colorParam: findFormat('max-color'),
      get typeValue() {
        return getValueForRuleParameter<string>(state.parameters, rule.parameters, 'max-type');
      },
      get colorValue() {
        return getValueForRuleParameter<string>(state.parameters, rule.formatting, 'max-color', '#00ff00');
      },
      get valueDisabled() {
        return this.typeValue === 'max-value';
      },
    };

    return { min, mid, max };
  }, [rule, state, themeType]);
}

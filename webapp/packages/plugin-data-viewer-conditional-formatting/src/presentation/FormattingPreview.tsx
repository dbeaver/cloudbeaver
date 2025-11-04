/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ColorScalePreview } from './ColorScalePreview.js';
import type { IFormatRule } from '../formatting/IFormatRule.js';
import type { IFormatRuleState } from '../formatting/IFormatRuleState.js';
import { getValueForRuleParameter } from '../formatting/getValueForRuleParameter.js';
import { useService } from '@cloudbeaver/core-di';
import { ThemeService } from '@cloudbeaver/core-theming';
import { getSurfaceColor } from '../getSurfaceColor.js';
import { observer } from 'mobx-react-lite';

interface Props {
  rule: IFormatRule;
  state: IFormatRuleState;
  text?: string;
  className?: string;
}

export const FormattingPreview = observer<Props>(function FormattingPreview({ rule, state, text, className }) {
  const themeService = useService(ThemeService);
  const themeType = themeService.currentTheme?.type;
  const surfaceColor = getSurfaceColor(themeType);
  let leftColor: string;
  let midColor: string | undefined;
  let rightColor: string;
  let fontStyle: 'normal' | 'italic' | undefined;
  let fontWeight: 'normal' | 'bold' | undefined;
  let textDecoration: 'none' | 'underline' | 'overline' | 'line-through' | undefined;

  if (state.type === 'single') {
    leftColor = midColor = rightColor = getValueForRuleParameter(state.parameters, rule.formatting, 'background-color', '#000000');
    fontStyle = getValueForRuleParameter<boolean>(state.parameters, rule.formatting, 'font-style') ? 'italic' : undefined;
    fontWeight = getValueForRuleParameter<boolean>(state.parameters, rule.formatting, 'font-weight') ? 'bold' : undefined;
    textDecoration = getValueForRuleParameter<'none' | 'underline' | 'overline' | 'line-through'>(
      state.parameters,
      rule.formatting,
      'text-decoration',
    );
  } else {
    leftColor = getValueForRuleParameter(state.parameters, rule.formatting, 'min-color', surfaceColor);
    midColor = getValueForRuleParameter(state.parameters, rule.formatting, 'mid-color');
    rightColor = getValueForRuleParameter(state.parameters, rule.formatting, 'max-color', '#000000');
  }

  return (
    <ColorScalePreview
      leftColor={leftColor}
      midColor={midColor}
      rightColor={rightColor}
      fontStyle={fontStyle}
      fontWeight={fontWeight}
      textDecoration={textDecoration}
      className={className}
    >
      {text}
    </ColorScalePreview>
  );
});

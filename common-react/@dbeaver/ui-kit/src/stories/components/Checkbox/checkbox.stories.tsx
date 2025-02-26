/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Checkbox } from '../../../Checkbox/Checkbox.js';
import './styles.css';

export const CheckboxStory = () => (
  <div className="tw:flex tw:flex-col tw:space-y-4">
    <Checkbox> Unchecked </Checkbox>
    <Checkbox defaultChecked> Default Checked </Checkbox>
    <Checkbox disabled> Disabled </Checkbox>
    <Checkbox disabled defaultChecked>
      Disabled Default Checked
    </Checkbox>
    <Checkbox accessibleWhenDisabled disabled defaultChecked>
      Default Checked Accessible When Disabled
    </Checkbox>
  </div>
);

export const Sizes = () => (
  <div className="tw:flex tw:flex-col tw:space-y-4">
    <Checkbox size="small"> Small </Checkbox>
    <Checkbox size="medium"> Medium </Checkbox>
    <Checkbox size="large"> Large </Checkbox>
    <Checkbox size="xlarge"> Extra Large </Checkbox>
  </div>
);

export const WithCustomIcon = () => (
  <div className="tw:flex tw:flex-col tw:space-y-4">
    <Checkbox>Default</Checkbox>
    <Checkbox
      icon={
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 16 16" height="1.25em" width="1.25em">
          <polyline points="3,8 7,12 14,4" />
        </svg>
      }
    >
      With Custom Icon
    </Checkbox>
    <Checkbox icon={'✓'}>With Custom Font Icon</Checkbox>
    <Checkbox size="large" className="cool-checkbox" icon={'👌'}>
      With Custom Icon And Styles
    </Checkbox>
  </div>
);

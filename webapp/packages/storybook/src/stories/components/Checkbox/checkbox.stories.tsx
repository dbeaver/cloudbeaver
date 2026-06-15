/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Checkbox, CheckboxIndicator } from '@dbeaver/ui-kit';
import { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

const meta = {
  component: Checkbox,
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Checkbox',
    checked: true,
  },
  argTypes: {
    size: {
      options: ['small', 'medium', 'large', 'xlarge'],
      control: {
        type: 'select',
      },
      defaultValue: 'medium',
    },
    checked: {
      control: {
        type: 'boolean',
      },
    },
    indeterminate: {
      control: {
        type: 'boolean',
      },
    },
    disabled: {
      control: {
        type: 'boolean',
      },
    },
  },
};

export const Sizes = () => (
  <div>
    <h2 className="tw:text-lg tw:my-2">Sizes</h2>
    <p>Checkbox has 4 predefined sizes: small, medium, large, and extra large.</p>
    <div className="tw:flex tw:flex-col tw:gap-4 tw:my-4">
      <Checkbox size="small" checked>
        Small
      </Checkbox>
      <Checkbox size="medium" checked>
        Medium
      </Checkbox>
      <Checkbox size="large" checked>
        Large
      </Checkbox>
      <Checkbox size="xlarge" checked>
        Extra large
      </Checkbox>
    </div>
    <h3>Design tokens for sizes</h3>
    <div className="tw:my-4">
      <p className="tw:text-base">
        Small checkbox height: <code>--dbv-kit-checkbox-small-height</code>
      </p>
      <p className="tw:text-base">
        Medium checkbox height: <code>--dbv-kit-checkbox-medium-height</code>
      </p>
      <p className="tw:text-base">
        Large checkbox height: <code>--dbv-kit-checkbox-large-height</code>
      </p>
      <p className="tw:text-base">
        Extra large checkbox height: <code>--dbv-kit-checkbox-xlarge-height</code>
      </p>
    </div>
  </div>
);

export const States = () => (
  <div>
    <h2 className="tw:text-lg tw:my-2">States</h2>
    <p>Checkbox supports checked, indeterminate and disabled states.</p>
    <div className="tw:flex tw:flex-col tw:gap-4 tw:my-4">
      <Checkbox>Unchecked</Checkbox>
      <Checkbox checked>Checked</Checkbox>
      <Checkbox indeterminate>Indeterminate</Checkbox>
      <Checkbox disabled>Disabled</Checkbox>
      <Checkbox disabled checked>
        Disabled checked
      </Checkbox>
    </div>
  </div>
);

export const CustomIcon = () => (
  <div>
    <h2 className="tw:text-lg tw:my-2">Custom icons</h2>
    <p>
      The checked and indeterminate marks can be overridden with the <code>icon</code> and <code>indeterminateIcon</code> properties.
    </p>
    <div className="tw:flex tw:flex-col tw:gap-4 tw:my-4">
      <Checkbox icon={<span>❤️</span>} checked>
        Custom check icon
      </Checkbox>
      <Checkbox indeterminateIcon={<span>➖</span>} indeterminate>
        Custom indeterminate icon
      </Checkbox>
    </div>
  </div>
);

export const Indicator = () => (
  <div>
    <h2 className="tw:text-lg tw:my-2">CheckboxIndicator</h2>
    <code>.dbv-kit-checkbox__check</code>
    <p>
      <code>CheckboxIndicator</code> is a purely decorative atom: it renders only the box and the check mark, with no <code>&lt;label&gt;</code>,{' '}
      <code>&lt;input&gt;</code> or event handlers. It is driven entirely by props (<code>checked</code>, <code>indeterminate</code>,{' '}
      <code>disabled</code>, <code>size</code>) and is meant for places where another element already owns the interaction — e.g. a menu item with{' '}
      <code>role=&quot;menuitemcheckbox&quot;</code>, a data-grid cell, or a tree node.
    </p>
    <div className="tw:flex tw:gap-4 tw:items-center tw:my-4">
      <CheckboxIndicator />
      <CheckboxIndicator checked />
      <CheckboxIndicator indeterminate />
      <CheckboxIndicator checked disabled />
    </div>
    <p>
      It composes inside the interactive component too — <code>Checkbox.Indicator</code> is the same atom that <code>Checkbox</code> renders
      internally.
    </p>
    <div className="tw:flex tw:gap-4 tw:items-center tw:my-4">
      <Checkbox.Indicator size="small" checked />
      <Checkbox.Indicator size="medium" checked />
      <Checkbox.Indicator size="large" checked />
      <Checkbox.Indicator size="xlarge" checked />
    </div>
  </div>
);

export const Controlled = () => {
  const [checked, setChecked] = useState(false);

  return (
    <div>
      <h2 className="tw:text-lg tw:my-2">Controlled</h2>
      <p>A controlled checkbox driven by React state.</p>
      <div className="tw:flex tw:gap-4 tw:items-center tw:my-4">
        <Checkbox checked={checked} onChange={event => setChecked(event.target.checked)}>
          {checked ? 'Checked' : 'Unchecked'}
        </Checkbox>
      </div>
    </div>
  );
};

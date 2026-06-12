/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Radio, RadioControl, RadioGroup, RadioLabel, RadioRoot } from '@dbeaver/ui-kit';
import { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

const meta = {
  component: Radio,
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Radio',
    value: 'radio',
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
    <p>Radio has 4 predefined sizes: small, medium, large, and extra large.</p>
    <div className="tw:flex tw:flex-col tw:gap-4 tw:my-4">
      <Radio size="small" value="s" checked>
        Small
      </Radio>
      <Radio size="medium" value="m" checked>
        Medium
      </Radio>
      <Radio size="large" value="l" checked>
        Large
      </Radio>
      <Radio size="xlarge" value="xl" checked>
        Extra large
      </Radio>
    </div>
    <h3>Design tokens for sizes</h3>
    <div className="tw:my-4">
      <p className="tw:text-base">
        Small radio height: <code>--dbv-kit-radio-small-height</code>
      </p>
      <p className="tw:text-base">
        Medium radio height: <code>--dbv-kit-radio-medium-height</code>
      </p>
      <p className="tw:text-base">
        Large radio height: <code>--dbv-kit-radio-large-height</code>
      </p>
      <p className="tw:text-base">
        Extra large radio height: <code>--dbv-kit-radio-xlarge-height</code>
      </p>
    </div>
  </div>
);

export const States = () => (
  <div>
    <h2 className="tw:text-lg tw:my-2">States</h2>
    <p>Radio supports checked and disabled states.</p>
    <div className="tw:flex tw:flex-col tw:gap-4 tw:my-4">
      <Radio value="a">Unchecked</Radio>
      <Radio value="b" checked>
        Checked
      </Radio>
      <Radio value="c" disabled>
        Disabled
      </Radio>
      <Radio value="d" disabled checked>
        Disabled checked
      </Radio>
    </div>
  </div>
);

export const Group = () => {
  const [value, setValue] = useState<string | number | null>('email');

  return (
    <div>
      <h2 className="tw:text-lg tw:my-2">RadioGroup</h2>
      <p>
        Multiple radios are grouped with <code>RadioGroup</code>, which owns the selected value through an AriaKit store.
      </p>
      <RadioGroup label="Notifications" value={value} setValue={setValue} vertical>
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
        <Radio value="push">Push</Radio>
      </RadioGroup>
      <p className="tw:my-4">
        Selected: <code>{value}</code>
      </p>
    </div>
  );
};

export const Composition = () => (
  <div>
    <h2 className="tw:text-lg tw:my-2">Composition</h2>
    <div className="codeblock tw:bg-gray-100 tw:p-4 tw:my-4">
      <code>&lt;RadioRoot&gt; &lt;RadioControl checked/&gt; &lt;RadioLabel&gt;Text&lt;/RadioLabel&gt; &lt;/RadioRoot&gt;</code>
    </div>
    <div className="tw:flex tw:flex-col tw:gap-4 tw:my-4">
      <RadioRoot className="tw:border tw:border-gray-300 tw:rounded tw:p-2">
        <RadioLabel>Assembled from atoms</RadioLabel>
        <RadioControl checked />
      </RadioRoot>
    </div>

    <h3 className="tw:text-lg tw:my-2">
      The <code>as</code> property
    </h3>
    <p>
      <code>RadioRoot</code> is polymorphic. By default it renders a <code>&lt;span&gt;</code> the interactive <code>Radio</code> renders it as{' '}
      <code>as=&quot;label&quot;</code> so the whole control toggles on click. Any other element type is allowed, and the extra props are type-checked
      for that element — e.g. <code>href</code> is only valid when <code>as=&quot;a&quot;</code>.
    </p>
    <div className="tw:flex tw:flex-col tw:gap-4 tw:my-4">
      <RadioRoot>
        <RadioControl checked />
        <RadioLabel>default — renders a &lt;span&gt;</RadioLabel>
      </RadioRoot>

      <RadioRoot as="label">
        <RadioControl checked />
        <RadioLabel>as=&quot;label&quot;</RadioLabel>
      </RadioRoot>

      <RadioRoot as="div">
        <RadioControl />
        <RadioLabel>as=&quot;div&quot;</RadioLabel>
      </RadioRoot>

      <RadioRoot as="a" href="https://ariakit.org" target="_blank" rel="noreferrer">
        <RadioControl checked />
        <RadioLabel>as=&quot;a&quot; — the wrapper is a link (href)</RadioLabel>
      </RadioRoot>
    </div>
  </div>
);

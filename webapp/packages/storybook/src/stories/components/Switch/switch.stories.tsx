/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState } from 'react';

import { Switch as SwitchBase, type SwitchProps } from '@dbeaver/ui-kit';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Components/Switch',
  component: SwitchBase.Provider,
} satisfies Meta<typeof SwitchBase>;

export default meta;
type Story = StoryObj<typeof meta>;

function Switch({ checked: initialChecked = false, disabled, children, ...rest }: SwitchProps): React.ReactElement {
  const [checked, setChecked] = useState(initialChecked);
  return (
    <SwitchBase.Provider {...rest} checked={checked} disabled={disabled} onChange={e => !disabled && setChecked(e.target.checked)}>
      <SwitchBase.Track />
      <SwitchBase.Input />
      <SwitchBase.Thumb />
      {children && <SwitchBase.Label>{children}</SwitchBase.Label>}
    </SwitchBase.Provider>
  );
}

export const Default: Story = {
  render: () => <Switch>Toggle me</Switch>,
};

export const States: Story = {
  render: () => (
    <div className="tw:flex tw:flex-col tw:items-start tw:gap-4">
      <Switch>Unchecked</Switch>
      <Switch checked>Checked</Switch>
      <Switch disabled>Disabled unchecked</Switch>
      <Switch disabled checked>
        Disabled checked
      </Switch>
    </div>
  ),
};

export const Dense: Story = {
  render: () => (
    <div
      className="tw:flex tw:flex-col tw:gap-4"
      style={
        {
          '--dbv-kit-switch-width': '28px',
          '--dbv-kit-switch-height': '16px',
          '--dbv-kit-switch-track-height': '16px',
          '--dbv-kit-switch-track-radius': '8px',
          '--dbv-kit-switch-thumb-size': '12px',
          '--dbv-kit-switch-thumb-offset': '2px',
          '--dbv-kit-switch-checked-offset': '14px',
        } as React.CSSProperties
      }
    >
      <Switch>Dense unchecked</Switch>
      <Switch checked>Dense checked</Switch>
      <Switch disabled>Dense disabled</Switch>
    </div>
  ),
};

export const CustomColors: Story = {
  render: () => (
    <div className="tw:flex tw:flex-col tw:gap-4">
      <div style={{ '--dbv-kit-switch-checked-color': '#16a34a' } as React.CSSProperties}>
        <Switch checked>Custom checked-color (green)</Switch>
      </div>
      <div style={{ '--dbv-kit-switch-checked-color': '#dc2626' } as React.CSSProperties}>
        <Switch checked>Custom checked-color (red)</Switch>
      </div>
      <div
        style={
          {
            '--dbv-kit-switch-track-color': '#7c3aed',
            '--dbv-kit-switch-thumb-color': '#ddd6fe',
            '--dbv-kit-switch-surface-color': '#ddd6fe',
          } as React.CSSProperties
        }
      >
        <Switch>Custom track-color / thumb-color / surface-color</Switch>
      </div>
    </div>
  ),
};

export const Spacing: Story = {
  render: () => (
    <div className="tw:flex tw:flex-col tw:gap-6">
      <div style={{ '--dbv-kit-switch-gap': '4px' } as React.CSSProperties}>
        <Switch checked>gap: 4px</Switch>
      </div>
      <div style={{ '--dbv-kit-switch-gap': '18px' } as React.CSSProperties}>
        <Switch checked>gap: 18px (default)</Switch>
      </div>
      <div style={{ '--dbv-kit-switch-gap': '32px' } as React.CSSProperties}>
        <Switch checked>gap: 32px</Switch>
      </div>
    </div>
  ),
};

export const LabelWeight: Story = {
  render: () => (
    <div className="tw:flex tw:flex-col tw:gap-4">
      <div style={{ '--dbv-kit-switch-label-weight': 'normal' } as React.CSSProperties}>
        <Switch checked>label-weight: normal (default)</Switch>
      </div>
      <div style={{ '--dbv-kit-switch-label-weight': '500' } as React.CSSProperties}>
        <Switch checked>label-weight: 500 (primary variant)</Switch>
      </div>
      <div style={{ '--dbv-kit-switch-label-weight': 'bold' } as React.CSSProperties}>
        <Switch checked>label-weight: bold</Switch>
      </div>
    </div>
  ),
};

export const Transition: Story = {
  render: () => (
    <div className="tw:flex tw:flex-col tw:gap-4">
      <div style={{ '--dbv-kit-switch-transition-duration': '100ms' } as React.CSSProperties}>
        <Switch>duration: 100ms (default)</Switch>
      </div>
      <div style={{ '--dbv-kit-switch-transition-duration': '500ms' } as React.CSSProperties}>
        <Switch>duration: 500ms (slow)</Switch>
      </div>
      <div
        style={
          {
            '--dbv-kit-switch-transition-duration': '300ms',
            '--dbv-kit-switch-transition-easing': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          } as React.CSSProperties
        }
      >
        <Switch>Custom easing (spring)</Switch>
      </div>
    </div>
  ),
};

export const LongLabel: Story = {
  render: () => (
    <div className="tw:max-w-xs">
      <Switch checked>
        Insert spaces when pressing Tab. This setting is overridden based on the file contents when Editor: Detect Indentation is on.
      </Switch>
    </div>
  ),
};

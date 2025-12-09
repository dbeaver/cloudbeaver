/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Command } from '@dbeaver/ui-kit';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';

const meta = {
  component: Command,
  parameters: {
    docs: {
      description: {
        component:
          "Command is a lightweight wrapper around Ariakit's Command with CloudBeaver styles. Use it for shortcut triggers and command items.",
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Command',
  },
  argTypes: {
    disabled: {
      control: { type: 'boolean' },
      defaultValue: false,
      description: 'Disable interaction',
    },
    children: {
      control: { type: 'text' },
      description: 'Content inside the command',
    },
  },
};

export const States = (): ReactElement => (
  <div>
    <h3 className="tw:text-lg tw:my-2">States</h3>
    <p>Command supports enabled and disabled states.</p>
    <div className="tw:flex tw:gap-4 tw:items-center tw:my-4">
      <Command>Enabled command</Command>
      <Command disabled>Disabled command</Command>
    </div>
  </div>
);

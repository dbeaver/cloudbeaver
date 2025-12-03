/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Disclosure, DisclosureContent, DisclosureProvider } from '@dbeaver/ui-kit';
import { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  component: Disclosure,
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DisclosureProvider>
      <Disclosure>Toggle</Disclosure>
      <DisclosureContent>Expanded content</DisclosureContent>
    </DisclosureProvider>
  ),
};

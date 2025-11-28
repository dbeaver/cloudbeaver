/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Focusable } from '@dbeaver/ui-kit';
import { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  component: Focusable,
} satisfies Meta<typeof Focusable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="tw:p-4">
      <p className="tw:mb-4">Tab to focus on the element below:</p>
      <Focusable className="tw:p-4 tw:border tw:border-gray-300 tw:rounded focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-blue-500">
        Focusable Element
      </Focusable>
    </div>
  ),
};

export const MultipleFocusableElements: Story = {
  render: () => (
    <div className="tw:p-4 tw:space-y-4">
      <p className="tw:mb-4">Use Tab key to navigate between focusable elements:</p>
      <Focusable className="tw:p-4 tw:border tw:border-gray-300 tw:rounded focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-blue-500">
        First Focusable Element
      </Focusable>
      <Focusable className="tw:p-4 tw:border tw:border-gray-300 tw:rounded focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-blue-500">
        Second Focusable Element
      </Focusable>
      <Focusable className="tw:p-4 tw:border tw:border-gray-300 tw:rounded focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-blue-500">
        Third Focusable Element
      </Focusable>
    </div>
  ),
};

export const WithDisabled: Story = {
  render: () => (
    <div className="tw:p-4 tw:space-y-4">
      <p className="tw:mb-4">The disabled element cannot receive focus:</p>
      <Focusable className="tw:p-4 tw:border tw:border-gray-300 tw:rounded focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-blue-500">
        Enabled Focusable Element
      </Focusable>
      <Focusable className="tw:p-4 tw:border tw:border-gray-300 tw:rounded tw:opacity-50 tw:cursor-not-allowed" disabled>
        Disabled Focusable Element
      </Focusable>
      <Focusable className="tw:p-4 tw:border tw:border-gray-300 tw:rounded focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-blue-500">
        Another Enabled Element
      </Focusable>
    </div>
  ),
};

export const WithAutoFocus: Story = {
  render: () => (
    <div className="tw:p-4 tw:space-y-4">
      <p className="tw:mb-4">The second element is automatically focused on mount:</p>
      <Focusable className="tw:p-4 tw:border tw:border-gray-300 tw:rounded focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-blue-500">
        First Element
      </Focusable>
      <Focusable className="tw:p-4 tw:border tw:border-gray-300 tw:rounded focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-blue-500" autoFocus>
        Auto-focused Element
      </Focusable>
      <Focusable className="tw:p-4 tw:border tw:border-gray-300 tw:rounded focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-blue-500">
        Third Element
      </Focusable>
    </div>
  ),
};

export const AsCustomElement: Story = {
  render: () => (
    <div className="tw:p-4 tw:space-y-4">
      <p className="tw:mb-4">Focusable can render as different HTML elements:</p>
      <Focusable className="tw:p-4 tw:border tw:border-gray-300 tw:rounded focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-blue-500">
        Rendered as div
      </Focusable>
      <Focusable
        render={<span />}
        className="tw:inline-block tw:p-4 tw:border tw:border-gray-300 tw:rounded focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-blue-500"
      >
        Rendered as span
      </Focusable>
      <Focusable
        render={<button type="button" />}
        className="tw:p-4 tw:border tw:border-gray-300 tw:rounded focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-blue-500 tw:bg-transparent hover:tw:bg-gray-100"
      >
        Rendered as button
      </Focusable>
    </div>
  ),
};

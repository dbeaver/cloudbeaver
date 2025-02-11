/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Button, type UiKitButtonProps } from '../index.js';
import type { Story } from '@ladle/react';

export const All = () => (
  <div>
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBlockEnd: '20px' }}>
      <Button>Primary</Button>
      <Button loading>Loading</Button>
      <Button disabled>Disabled</Button>
    </div>

    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBlockEnd: '20px' }}>
      <Button variant="secondary">Secondary</Button>
      <Button variant="secondary" loading>
        Loading
      </Button>
      <Button variant="secondary" disabled>
        Disabled
      </Button>
    </div>
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBlockEnd: '20px' }}>
      <Button variant="danger">Danger</Button>
      <Button variant="danger" loading>
        Loading
      </Button>
      <Button variant="danger" disabled>
        Disabled
      </Button>
    </div>
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
      <Button size="xlarge">XLarge</Button>
    </div>
  </div>
);

const Primary: Story<UiKitButtonProps> = props => <Button {...props}>Primary</Button>;
export const Interactive = Primary.bind({});

Interactive.argTypes = {
  variant: {
    options: ['primary', 'secondary', 'danger'],
    control: {
      type: 'select',
    },
    defaultValue: 'primary',
  },
  size: {
    options: ['small', 'medium', 'large', 'xlarge'],
    control: {
      type: 'select',
    },
    defaultValue: 'medium',
  },
  loading: {
    control: {
      type: 'boolean',
    },
    defaultValue: false,
  },
};

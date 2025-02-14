/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Button, type ButtonProps } from '../index.js';
import type { Story } from '@ladle/react';

export const All = () => (
  <div>
    <h2 className="text-2xl">Button</h2>
    <p>
      Underlying components docs: <br />
      <a target="_blank" href="https://ariakit.org/reference/button">
        https://ariakit.org/reference/button
      </a>
      <br />
      <br />
      Visual parameters:
      <dl>
        <dt className="font-bold">variant</dt>
        <dd>primary | secondary | danger</dd>
        <dt className="font-bold">size</dt>
        <dd>small | medium | large | xlarge</dd>
        <dt className="font-bold">loading</dt>
        <dd>boolean</dd>
      </dl>
    </p>
    <hr />
    <br />
    <h3 className="text-lg my-2">Variants</h3>
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
    <h3 className="text-lg my-2">Sizes</h3>
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBlockEnd: '20px' }}>
      <Button className="bg-purple-500 active:bg-purple-700" size="small">
        Small
      </Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large button</Button>
      <Button size="xlarge">EXTRA Large button</Button>
    </div>
    <h3 className="text-lg my-2">Icons</h3>
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBlockEnd: '20px' }}>
      <Button size="large">
        <Button.Icon placement="start">🎾</Button.Icon>
        Tennis
      </Button>
      <Button size="small">
        Love
        <Button.Icon placement="end">❤️</Button.Icon>
      </Button>
      <Button size="xlarge">
        <Button.Icon placement="start">🎾</Button.Icon>
        Tennis is Love
        <Button.Icon placement="end">❤️</Button.Icon>
      </Button>
      <Button className="text-lime-300">
        Have you seen
        <Button.Icon className="w-2">
          <svg width="16" height="16" fill="none">
            <g strokeWidth="0"></g>
            <g strokeLinecap="round" strokeLinejoin="round"></g>
            <g>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 16L3.54223 12.3383C1.93278 11.0162 1 9.04287 1 6.96005C1 3.11612 4.15607 0 8 0C11.8439 0 15 3.11612 15 6.96005C15 9.04287 14.0672 11.0162 12.4578 12.3383L8 16ZM3 6H5C6.10457 6 7 6.89543 7 8V9L3 7.5V6ZM11 6C9.89543 6 9 6.89543 9 8V9L13 7.5V6H11Z"
                fill="currentColor"
              ></path>
            </g>
          </svg>
        </Button.Icon>
        UFO?
      </Button>
    </div>
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBlockEnd: '20px' }}>
      <Button loading>
        <Button.Icon className="w-8 h-4" placement="start">
          <svg width="16" height="16" fill="none">
            <g strokeWidth="0"></g>
            <g strokeLinecap="round" strokeLinejoin="round"></g>
            <g>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 16L3.54223 12.3383C1.93278 11.0162 1 9.04287 1 6.96005C1 3.11612 4.15607 0 8 0C11.8439 0 15 3.11612 15 6.96005C15 9.04287 14.0672 11.0162 12.4578 12.3383L8 16ZM3 6H5C6.10457 6 7 6.89543 7 8V9L3 7.5V6ZM11 6C9.89543 6 9 6.89543 9 8V9L13 7.5V6H11Z"
                fill="currentColor"
              ></path>
            </g>
          </svg>
        </Button.Icon>
        UFO
      </Button>
      <Button variant="secondary" loading>
        <Button.Icon placement="start">🎾</Button.Icon>
        Tennis
      </Button>
      <Button disabled>
        <Button.Icon placement="start">🎾</Button.Icon>
        Tennis
      </Button>
      <Button variant="danger">
        <Button.Icon placement="start">🎾</Button.Icon>
        Tennis
      </Button>
      <Button>
        <Button.Icon>🎾</Button.Icon>
      </Button>
    </div>
    <h3 className="text-lg my-2">Custom renders</h3>
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBlockEnd: '20px' }}>
      <Button render={<a target="_blank" href="/" />} size="small">
        Link button
      </Button>
      <Button variant="secondary" render={<a />}>
        Link secondary
      </Button>
      <Button render={({ children, className }) => <p className={className}>{children} render</p>} size="medium">
        Paragraph
      </Button>
    </div>
    <h3 className="text-lg my-2">Change on focus</h3>
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBlockEnd: '20px' }}>
      <Button onFocusVisible={e => (e.currentTarget.textContent = 'Click me!')} render={<a href="/" />} size="small">
        Link button
      </Button>
    </div>
  </div>
);

const Primary: Story<ButtonProps> = props => <Button {...props}>Primary</Button>;
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

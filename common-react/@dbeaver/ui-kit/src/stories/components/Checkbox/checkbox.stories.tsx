/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState } from 'react';
import { Checkbox } from '../../../Checkbox/Checkbox.js';
import './styles.css';
import { Button } from '../../../index.js';

export const Documentation = () => (
  <div>
    <h1>Checkbox</h1>
    <p>
      The Checkbox component is a simple checkbox that can be used in different contexts. It has several visual parameters that can be customized.
    </p>
    <h2>Class names</h2>
    <p>
      <code>.dbv-kit-checkbox</code> - the main class name for the checkbox component. <br />
      <code>.dbv-kit-checkbox--small</code> - the class name for the small size. <br />
      <code>.dbv-kit-checkbox--medium</code> - the class name for the medium size. <br />
      <code>.dbv-kit-checkbox--large</code> - the class name for the large size. <br />
      <code>.dbv-kit-checkbox--xlarge</code> - the class name for the extra large size. <br />
      <code>.dbv-kit-checkbox__check</code> - the class name for the checkmark component. <br />
      <code>.dbv-kit-checkbox__text</code> - the class name for the text component. <br />
    </p>
    <p>
      Underlying components docs: <br />
      <a target="_blank" href="https://ariakit.org/reference/checkbox">
        https://ariakit.org/reference/checkbox
      </a>
    </p>
    <h3>Props:</h3>
    <dl>
      <dt className="tw:font-bold">size</dt>
      <dd>small | medium | large | xlarge</dd>
      <dt className="tw:font-bold">icon</dt>
      <dd>React.ReactNode</dd>
    </dl>
  </div>
);

export const States = () => {
  const [indeterminate, setIndeterminate] = useState(false);

  return (
    <div className="tw:flex tw:flex-col tw:items-start tw:space-y-4">
      <Checkbox> Unchecked </Checkbox>
      <Checkbox checked={false}> Unchecked (Controlled) </Checkbox>
      <Checkbox checked>Checked (Controlled)</Checkbox>
      <Checkbox defaultChecked> Default Checked </Checkbox>
      <Checkbox disabled> Disabled </Checkbox>
      <Checkbox disabled defaultChecked>
        Disabled Default Checked
      </Checkbox>
      <Checkbox accessibleWhenDisabled disabled defaultChecked>
        Default Checked Accessible When Disabled
      </Checkbox>
      <Button onClick={() => setIndeterminate(prev => !prev)}>Set Indeterminate</Button>
      <Checkbox indeterminate={indeterminate}>Indeterminate</Checkbox>
      <Checkbox indeterminate={indeterminate} indeterminateIcon={<div className="tw:flex tw:relative tw:-top-[1px] tw:font-bold">▫</div>}>
        Indeterminate Custom
      </Checkbox>
      <Checkbox>
        Insert spaces when pressing <code>Tab</code>. This setting is overridden based on the file contents when{' '}
        <a data-href="#" href="#">
          Editor: Detect Indentation
        </a>{' '}
        is on.
      </Checkbox>
    </div>
  );
};

export const Sizes = () => (
  <div className="tw:flex tw:flex-col">
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
        <svg fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 16 16">
          <polyline points="3,8 7,12 14,4" />
        </svg>
      }
    >
      With Custom Icon
    </Checkbox>
    <Checkbox icon={<span className="tw:flex tw:justify-center tw:font-semibold">✓</span>}>With Custom Font Icon</Checkbox>
    <Checkbox size="large" className="cool-checkbox" icon={'👌'}>
      With Custom Icon And Styles
    </Checkbox>
  </div>
);

export const Tokens = () => {
  return (
    <div className="tw:p-4 tw:my-4">
      <h1>Checkbox CSS Tokens</h1>
      <p>This UI kit uses several CSS tokens to style checkboxes.</p>
      <h2>Common checkbox tokens</h2>
      Affect all sizes of checkboxes.
      <div className="tw:my-4">
        <h3>General</h3>
        <div>
          <code>--dbv-kit-checkbox-height:</code> var(--dbv-kit-control-height-medium); <span className="comment"> Default checkbox height</span>
        </div>
        <div>
          <code>--dbv-kit-checkbox-gap:</code> calc(var(--tw-spacing) * 1.25); <span className="comment"> Gap between checkbox elements</span>
        </div>
        <h3>Colors</h3>
        <div>
          <code>--dbv-kit-checkbox-icon-color:</code> var(--tw-color-white); <span className="comment"> Default checkbox icon color</span>
        </div>
        <div>
          <code>--dbv-kit-checkbox-foreground:</code> var(--tw-color-black); <span className="comment"> Default checkbox text color</span>
        </div>
        <div>
          <code>--dbv-kit-checkbox-background:</code> transparent; <span className="comment"> Default checkbox background color</span>
        </div>
        <div>
          <code>--dbv-kit-checkbox-background-checked:</code> var(--dbv-kit-color-primary-600);{' '}
          <span className="comment"> Checkbox background color when checked</span>
        </div>
        <div>
          <code>--dbv-kit-checkbox-background-hover:</code> var(--dbv-kit-color-primary-100);{' '}
          <span className="comment"> Checkbox background color on hover</span>
        </div>
        <h3>Borders</h3>
        <div>
          <code>--dbv-kit-checkbox-border-width:</code> var(--dbv-kit-control-border-width); <span className="comment"> Checkbox border width</span>
        </div>
        <div>
          <code>--dbv-kit-checkbox-border-radius:</code> var(--dbv-kit-control-border-radius);{' '}
          <span className="comment"> Checkbox border radius</span>
        </div>
        <div>
          <code>--dbv-kit-checkbox-border-style:</code> solid; <span className="comment"> Checkbox border style</span>
        </div>
        <div>
          <code>--dbv-kit-checkbox-border-color:</code> var(--tw-color-gray-300); <span className="comment"> Checkbox border color</span>
        </div>
        <div>
          <code>--dbv-kit-checkbox-border-color-checked:</code> var(--dbv-kit-color-primary-600);{' '}
          <span className="comment"> Checkbox border color when checked</span>
        </div>
        <h3>Font</h3>
        <div>
          <code>--dbv-kit-checkbox-font-weight:</code> var(--tw-font-weight-normal); <span className="comment"> Checkbox font weight</span>
        </div>
        <div>
          <code>--dbv-kit-checkbox-font-size:</code> calc(var(--dbv-kit-font-size-base) * 0.875); <span className="comment"> Checkbox font size</span>
        </div>
      </div>
      <div className="tw:my-4">
        <h2>Specific checkbox tokens</h2>
        <h3>Checkbox Sizes</h3>
        <p>
          The <code>--dbv-kit-checkbox-*-height</code> tokens are used to define the height of checkboxes for different size variants.
        </p>
        <p style={{ height: 'var(--dbv-kit-checkbox-small-height)' }}>
          Small checkbox height: <code>--dbv-kit-checkbox-small-height</code>
        </p>
        <p style={{ height: 'var(--dbv-kit-checkbox-medium-height)' }}>
          Medium checkbox height: <code>--dbv-kit-checkbox-medium-height</code>
        </p>
        <p style={{ height: 'var(--dbv-kit-checkbox-large-height)' }}>
          Large checkbox height: <code>--dbv-kit-checkbox-large-height</code>
        </p>
        <p style={{ height: 'var(--dbv-kit-checkbox-xlarge-height)' }}>
          Extra large checkbox height: <code>--dbv-kit-checkbox-xlarge-height</code>
        </p>
      </div>
      <div className="tw:my-4">
        <h3>Checkbox Gap</h3>
        <p>
          The <code>--dbv-kit-checkbox-*-gap</code> tokens are used to define the gap between checkbox elements for different size variants.
        </p>
        <p>
          Small checkbox gap: <code>--dbv-kit-checkbox-small-gap</code>
        </p>
        <p>
          Medium checkbox gap: <code>--dbv-kit-checkbox-medium-gap</code>
        </p>
        <p>
          Large checkbox gap: <code>--dbv-kit-checkbox-large-gap</code>
        </p>
        <p>
          Extra large checkbox gap: <code>--dbv-kit-checkbox-xlarge-gap</code>
        </p>
      </div>
      <div className="tw:my-4">
        <h3>Checkbox Font Sizes </h3>
        <p>
          {' '}
          <code>--dbv-kit-checkbox-small-font-size</code>: calc(var(--dbv-kit-checkbox-font-size) * 0.875);
        </p>
        <p>
          {' '}
          <code>--dbv-kit-checkbox-medium-font-size</code>: var(--dbv-kit-checkbox-font-size);
        </p>
        <p>
          {' '}
          <code>--dbv-kit-checkbox-large-font-size</code>: calc(var(--dbv-kit-checkbox-font-size) * 1.125);
        </p>
        <p>
          {' '}
          <code>--dbv-kit-checkbox-xlarge-font-size</code>: calc(var(--dbv-kit-checkbox-font-size) * 1.25);
        </p>
      </div>
      <div className="tw:my-4">
        <h3>Checkbox Colors</h3>
        <p style={{ backgroundColor: 'var(--dbv-kit-checkbox-background-checked)', color: 'var(--dbv-kit-checkbox-foreground)' }}>
          Checked checkbox background: <code>--dbv-kit-checkbox-background-checked</code>
        </p>
        <p style={{ backgroundColor: 'var(--dbv-kit-checkbox-background-hover)', color: 'var(--dbv-kit-checkbox-foreground)' }}>
          Checkbox background (hover): <code>--dbv-kit-checkbox-background-hover</code>
        </p>
        <p style={{ backgroundColor: 'var(--dbv-kit-checkbox-background-active)', color: 'var(--dbv-kit-checkbox-foreground)' }}>
          Checkbox background (active): <code>--dbv-kit-checkbox-background-active</code>
        </p>
        <p style={{ borderColor: 'var(--dbv-kit-checkbox-border-color)', borderWidth: '1px', borderStyle: 'solid' }}>
          Checkbox border color: <code>--dbv-kit-checkbox-border-color</code>
        </p>
        <p style={{ borderColor: 'var(--dbv-kit-checkbox-border-color-checked)', borderWidth: '1px', borderStyle: 'solid' }}>
          Checked checkbox border color: <code>--dbv-kit-checkbox-border-color-checked</code>
        </p>
      </div>
      <div className="tw:my-4">
        <h3>Checkbox Borders</h3>
        <p>
          Checkbox border width: <code>--dbv-kit-checkbox-border-width</code>
        </p>
        <p>
          The <code>--dbv-kit-checkbox-border-width</code> token is used to define the border width of checkboxes.
        </p>
        <p>
          To change the border size of your checkbox, you can override the <code>--dbv-kit-checkbox-border-width</code> token in your CSS.
        </p>
      </div>
    </div>
  );
};

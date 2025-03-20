/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useState } from 'react';
import { _Radio, Radio, _RadioProvider, _RadioGroup } from '../../../Radio/index.js';
import { RadioGroup } from '../../../Radio/RadioGroup.js';

export const Documentation = () => {
  return (
    <section>
      <h1>Radio Component Documentation</h1>
      <p>
        The Radio component is a customizable radio button that allows users to select one option from a set. The appearance can be customized using
        CSS classes and variables.
      </p>
      <h2>Props</h2>
      Accept all props from the underlying{' '}
      <a target="_blank" href="https://ariakit.org/reference/radio">
        {' '}
        Radio
      </a>{' '}
      component.
      <h3>Other properties</h3>
      <p>
        <code>size</code> - Size of the radio button. Default is 'medium'.
      </p>
      <h2>CSS Classes</h2>
      <h3>Main Radio Element</h3>
      <p>
        <code>.dbv-kit-radio</code> - The main container class for the radio component. Controls the overall appearance including size, colors, and
        borders.
      </p>
      <h3>Control</h3>
      <p>
        <code>.dbv-kit-radio__control</code> - Applied to the control element of the radio component.
      </p>
      <h3>Text</h3>
      <p>
        <code>.dbv-kit-radio__title</code> - Applied to the visible title element of the radio component.
      </p>
      <h2>CSS Variables</h2>
      <h3>Radio Component Variables</h3>
      <p>
        <code>--dbv-kit-radio-height</code> - Controls the height of the radio component.
      </p>
      <p>
        <code>--dbv-kit-radio-gap</code> - Sets the gap between the radio button and the text.
      </p>
      <p>
        <code>--dbv-kit-radio-inactive-background</code> - Sets the background color of the inactive radio button.
      </p>
      <p>
        <code>--dbv-kit-radio-inactive-border</code> - Sets the border color of the inactive radio button.
      </p>
      <p>
        <code>--dbv-kit-radio-active-background</code> - Sets the background color of the active radio button.
      </p>
      <p>
        <code>--dbv-kit-radio-active-border</code> - Sets the border color of the active radio button.
      </p>
      <p>
        <code>--dbv-kit-radio-active-foreground</code> - Sets the foreground color of the active radio button.
      </p>
      <p>
        <code>--dbv-kit-radio-hover-shadow-color</code> - Defines the shadow color when hovering over the radio button.
      </p>
      <h3>Size Variables</h3>
      <p>
        <code>--dbv-kit-radio-small-height</code> - Controls the height of the small radio button.
      </p>
      <p>
        <code>--dbv-kit-radio-medium-height</code> - Controls the height of the medium radio button.
      </p>
      <p>
        <code>--dbv-kit-radio-large-height</code> - Controls the height of the large radio button.
      </p>
      <p>
        <code>--dbv-kit-radio-xlarge-height</code> - Controls the height of the extra-large radio button.
      </p>
      <h2>RadioGroup Component</h2>
      <p>
        The RadioGroup component is used to group multiple Radio components together. It supports both controlled and uncontrolled modes, and can be
        displayed vertically or horizontally. By default, you should use the RadioGroup component to use Radio components.
      </p>
      <h3>Props</h3>
      <p>
        Basically, RadioGroup accepts a list of underlying{' '}
        <a target="_blank" href="https://ariakit.org/reference/radio-provider">
          {' '}
          RadioProvider
        </a>{' '}
        component props such as 'value' | 'setValue' | 'store' | 'setActiveId' | 'rtl' | 'defaultValue'.{' '}
      </p>
      <h4 className="tw:underline">Other properties</h4>
      <p>
        <code>vertical</code> - Boolean to display the radio buttons vertically.
      </p>
      <p>
        <code>labelledBy</code> - ID of the element that labels the radio group, if you don't use label prop.
      </p>
      <p>
        <code>label</code> - React node to display as the label for the radio group. Rendered inside a label element and should respect HTML label
        semantics.
      </p>
      <p>
        <code>required</code> - Boolean to mark the radio group as required.
      </p>
      <p>
        <code>className</code> - Additional CSS classes to apply to the radio group.
      </p>
      <p>
        <code>items</code> - Array of objects with 'value' and 'label' properties to render radio buttons. Cannot be used together with children.
      </p>
      <p>
        <code>name</code> - Name of the radio group. Recommended to always provide a name to radio groups if children Radio components don't.
      </p>
      <p>
        <code>size</code> - Size of the radio buttons.
      </p>
    </section>
  );
};

export const RadioGroupControlled = () => {
  const [value, setValue] = useState('2');

  useEffect(() => {
    const intervalId = setInterval(() => {
      const randomValue = Math.floor(Math.random() * 3 + 1).toString();
      setValue(randomValue);
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <RadioGroup aria-label="Controlled radio group" value={value} setValue={val => setValue(val as string)}>
      <Radio value={'1'}>Item 1</Radio>
      <Radio value={'2'}>Item 2</Radio>
      <Radio value={'3'}>Item 3</Radio>
    </RadioGroup>
  );
};

export const RadioGroupUncontrolled = () => (
  <RadioGroup label="Uncontrolled">
    <Radio value={'1'}>Item 1</Radio>
    <Radio value={'2'}>Item 2</Radio>
    <Radio value={'3'}>Item 3</Radio>
  </RadioGroup>
);

export const Vertical = () => (
  <RadioGroup label="Vertical" vertical>
    <Radio value={'1'}>Item 1</Radio>
    <Radio value={'2'}>Item 2</Radio>
    <Radio value={'3'}>Item 3</Radio>
  </RadioGroup>
);

export const Required = () => (
  <RadioGroup label="Required" required>
    <Radio value={'1'}>Item 1</Radio>
    <Radio value={'2'}>Item 2</Radio>
    <Radio value={'3'}>Item 3</Radio>
  </RadioGroup>
);

export const LabelsReactComponents = () => (
  <RadioGroup label="" vertical>
    <Radio value={'1'}>
      <div className="tw:flex tw:hover:bg-orange-100 tw:transition tw:duration-300 tw:ease-in-out">
        <div className="tw:bg-orange-500 tw:text-white tw:px-2">Orange</div>
        <div className="tw:ml-2 tw:text-gray-500">Juicy</div>
      </div>
    </Radio>
    <Radio value={'2'}>
      <div className="tw:flex tw:hover:bg-green-100">
        <div className="tw:bg-green-300 tw:text-green-900 tw:px-2">Apple</div>
        <div className="tw:ml-2 tw:text-gray-500">Vital</div>
      </div>
    </Radio>
    <Radio value={'3'}>
      <div className="tw:flex tw:hover:bg-rose-100">
        <div className="tw:bg-rose-400 tw:text-white tw:px-2">Peach</div>
        <div className="tw:ml-2 tw:text-gray-500">Silky</div>
      </div>
    </Radio>
  </RadioGroup>
);

export const GroupWithCustomLabel = () => (
  <div>
    <div id="fruits-radio" className="tw:text-lg">
      Pick a fruit
    </div>
    <RadioGroup labelledBy="fruits-radio">
      <Radio value={'1'}>Apple</Radio>
      <Radio value={'2'}>Banana</Radio>
      <Radio value={'3'}>Cherry</Radio>
    </RadioGroup>
  </div>
);

export const Sizes = () => (
  <div className="tw:space-y-4">
    <RadioGroup label="Small">
      <Radio size="small" value={'1'}>
        Small
      </Radio>
      <Radio size="small" value={'2'}>
        Small
      </Radio>
      <Radio size="small" value={'3'}>
        Small
      </Radio>
    </RadioGroup>
    <RadioGroup label="Medium">
      <Radio size="medium" value={'1'}>
        Medium
      </Radio>
      <Radio size="medium" value={'2'}>
        Medium
      </Radio>
      <Radio size="medium" value={'3'}>
        Medium
      </Radio>
    </RadioGroup>
    <RadioGroup label="Large">
      <Radio size="large" value={'1'}>
        Large
      </Radio>
      <Radio size="large" value={'2'}>
        Large
      </Radio>
      <Radio size="large" value={'3'}>
        Large
      </Radio>
    </RadioGroup>
    <RadioGroup label="Extra Large">
      <Radio size="xlarge" value={'1'}>
        Extra Large
      </Radio>
      <Radio size="xlarge" value={'2'}>
        Extra Large
      </Radio>
      <Radio size="xlarge" value={'3'}>
        Extra Large
      </Radio>
    </RadioGroup>
  </div>
);

export const RadioDisabled = () => (
  <RadioGroup label="Disabled">
    <Radio value={'1'} disabled>
      Disabled
    </Radio>
    <Radio value={'2'}>Enabled</Radio>
    <Radio value={'3'} disabled>
      Disabled
    </Radio>
    <Radio value={'4'}>Enabled</Radio>
  </RadioGroup>
);

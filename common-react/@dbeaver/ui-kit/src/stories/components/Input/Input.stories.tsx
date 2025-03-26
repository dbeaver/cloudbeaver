/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Button } from '../../../Button/Button.js';
import { Input } from '../../../Input/Input.js';

export const Documentation = () => {
  return (
    <section>
      <h2>Input Component Documentation</h2>
      <p>
        The Input component is a customizable form control that allows users to enter text. It can be configured with various sizes and states, and
        can include labels with optional required indicators.
      </p>

      <h2>CSS Classes</h2>

      <h3>Input Wrapper</h3>
      <p>
        <code>.dbv-kit-input-wrapper</code> - The container that wraps the input and its label. Controls the layout and positioning.
      </p>

      <h3>Main Input Element</h3>
      <p>
        <code>.dbv-kit-input</code> - The main class for the input component. Controls the appearance including size, colors, and borders.
      </p>

      <h3>Size Variants</h3>
      <p>
        <code>.dbv-kit-input--small</code> - Smaller size variant of the input.
      </p>
      <p>
        <code>.dbv-kit-input--medium</code> - Default size variant of the input.
      </p>
      <p>
        <code>.dbv-kit-input--large</code> - Larger size variant of the input.
      </p>
      <p>
        <code>.dbv-kit-input--xlarge</code> - Extra large size variant of the input.
      </p>

      <h3>Label</h3>
      <p>
        <code>.dbv-kit-input__title</code> - Applied to the label element of the input component.
      </p>
      <p>
        <code>.dbv-kit-input__title--required</code> - Applied to the label when the input is required, adds an asterisk indicator.
      </p>

      <h2>CSS Variables</h2>

      <h3>Base Input Variables</h3>
      <p>
        <code>--dbv-kit-input-radius</code> - Controls the border radius of the input.
      </p>
      <p>
        <code>--dbv-kit-input-font-size</code> - Sets the default font size of the input text.
      </p>
      <p>
        <code>--dbv-kit-input-background</code> - Sets the background color of the input.
      </p>
      <p>
        <code>--dbv-kit-input-border-color</code> - Defines the default border color of the input.
      </p>
      <p>
        <code>--dbv-kit-input-border-width</code> - Sets the width of the border around the input.
      </p>
      <p>
        <code>--dbv-kit-input-border-style</code> - Defines the style of the border (solid, dashed, etc.).
      </p>
      <p>
        <code>--dbv-kit-input-foreground</code> - Sets the text color of the input.
      </p>
      <p>
        <code>--dbv-kit-input-height</code> - Controls the height of the input field.
      </p>
      <p>
        <code>--dbv-kit-input-padding</code> - Sets the horizontal padding inside the input.
      </p>
      <p>
        <code>--dbv-kit-input-placeholder-foreground</code> - Controls the color of placeholder text.
      </p>

      <h3>Label Variables</h3>
      <p>
        <code>--dbv-kit-input-label-foreground</code> - Sets the text color of the label.
      </p>
      <p>
        <code>--dbv-kit-input-label-padding</code> - Controls the padding of the label.
      </p>

      <h3>Size Variables</h3>
      <p>
        <code>--dbv-kit-input-small-padding</code> - Controls the padding for small inputs.
      </p>
      <p>
        <code>--dbv-kit-input-small-font-size</code> - Sets the font size for small inputs.
      </p>
      <p>
        <code>--dbv-kit-input-small-height</code> - Controls the height for small inputs.
      </p>
      <p>
        <code>--dbv-kit-input-medium-padding</code> - Controls the padding for medium inputs.
      </p>
      <p>
        <code>--dbv-kit-input-medium-font-size</code> - Sets the font size for medium inputs.
      </p>
      <p>
        <code>--dbv-kit-input-medium-height</code> - Controls the height for medium inputs.
      </p>
      <p>
        <code>--dbv-kit-input-large-padding</code> - Controls the padding for large inputs.
      </p>
      <p>
        <code>--dbv-kit-input-large-font-size</code> - Sets the font size for large inputs.
      </p>
      <p>
        <code>--dbv-kit-input-large-height</code> - Controls the height for large inputs.
      </p>
      <p>
        <code>--dbv-kit-input-xlarge-padding</code> - Controls the padding for extra large inputs.
      </p>
      <p>
        <code>--dbv-kit-input-xlarge-font-size</code> - Sets the font size for extra large inputs.
      </p>
      <p>
        <code>--dbv-kit-input-xlarge-height</code> - Controls the height for extra large inputs.
      </p>
    </section>
  );
};

export const InputText = () => {
  return (
    <>
      <div className="tw:space-y-2">
        <Input placeholder="Username" />
        <Input placeholder="Password" type="password" />
        <Button>Log in</Button>
      </div>
    </>
  );
};

export const InputNumber = () => {
  return (
    <>
      <div className="tw:space-y-2">
        <Input type="number" label="Age" defaultValue={18} />
        <Button>Enter</Button>
      </div>
    </>
  );
};

export const InputEmail = () => {
  return (
    <>
      <datalist id="ice-cream-emails">
        <option value="Chocolate@gmail.com"></option>
        <option value="Coconut@gmail.com"></option>
        <option value="Mint@gmail.com"></option>
        <option value="Strawberry@gmail.com"></option>
        <option value="Vanilla@gmail.com"></option>
      </datalist>
      <div className="tw:space-y-2">
        <Input list="ice-cream-emails" type="email" label="E-mail" placeholder="john@gmail.com" />
        <Button>Send</Button>
      </div>
    </>
  );
};

export const InputMonth = () => {
  return (
    <>
      <div className="tw:space-y-2">
        <Input type="month" label="Month" />
        <Button>Set</Button>
      </div>
    </>
  );
};

export const InputWeek = () => {
  return (
    <>
      <div className="tw:space-y-2">
        <Input type="week" label="Week" />
        <Button>Set</Button>
      </div>
    </>
  );
};

export const InputDate = () => {
  return (
    <>
      <div className="tw:space-y-2">
        <Input label="Birth date" type="date" />
        <Button>Set</Button>
      </div>
    </>
  );
};

export const InputTime = () => {
  return (
    <>
      <div className="tw:space-y-2">
        <Input type="time" label="Time" />
        <Button>Set</Button>
      </div>
    </>
  );
};

export const InputRange = () => {
  return (
    <>
      This is not a custom component, but a native HTML input range element.
      <div className="tw:space-y-2">
        <Input type="range" label="Range" min={1} max={100} />
        <Button>Set</Button>
      </div>
    </>
  );
};

export const InputSearch = () => {
  return (
    <>
      <div className="tw:space-y-2">
        <Input type="search" label="Search" />
        <Button>Find</Button>
      </div>
    </>
  );
};

export const InputTel = () => {
  return (
    <>
      <div className="tw:space-y-2">
        <Input type="tel" label="Phone" />
        <Button>Call</Button>
      </div>
    </>
  );
};

export const InputDisabled = () => {
  return (
    <>
      <div className="tw:space-y-2">
        <Input label="Username" value="John" disabled />
        <Input label="E-mail" value="john@google.com" disabled />
        <div className="tw:mt-2"> To change this fields, please ask your administrator</div>
      </div>
    </>
  );
};

export const InputRequired = () => {
  return (
    <form>
      <div className="tw:space-y-2">
        <Input label="Username" required />
        <Input label="E-mail" required />
        <Button type="submit">Register</Button>
      </div>
    </form>
  );
};

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Select } from '../../../Select/Select.js';

export const Docs = () => {
  return (
    <section>
      <h2>Select Component Documentation</h2>
      <p>
        The Select component is a customizable dropdown selector that allows users to choose from a list of options. The appearance can be customized
        using CSS classes and variables.
      </p>

      <h2>CSS Classes</h2>

      <h3>Main Select Element</h3>
      <p>
        <code>.dbv-kit-select</code> - The main container class for the select component. Controls the overall appearance including size, colors, and
        borders.
      </p>

      <h3>Label</h3>
      <p>
        <code>.dbv-kit-select__label</code> - Applied to the label element of the select component.
      </p>

      <h3>Popover</h3>
      <p>
        <code>.dbv-kit-select__popover</code> - Controls the dropdown menu that appears when the select is clicked.
      </p>

      <h3>Items</h3>
      <p>
        <code>.dbv-kit-select__item</code> - Applied to each option in the dropdown menu.
      </p>

      <h2>CSS Variables</h2>

      <h3>Select Component Variables</h3>
      <p>
        <code>--dbv-kit-select-height</code> - Controls the height of the select component.
      </p>
      <p>
        <code>--dbv-kit-select-padding-inline</code> - Sets the horizontal padding inside the select component.
      </p>
      <p>
        <code>--dbv-kit-select-background</code> - Sets the background color of the select component.
      </p>
      <p>
        <code>--dbv-kit-select-foreground</code> - Sets the text color of the select component.
      </p>
      <p>
        <code>--dbv-kit-select-border-color</code> - Defines the border color of the select component.
      </p>
      <p>
        <code>--dbv-kit-select-border-radius</code> - Controls the rounded corners of the select component.
      </p>
      <p>
        <code>--dbv-kit-select-border-width</code> - Sets the width of the border around the select component.
      </p>
      <p>
        <code>--dbv-kit-select-border-style</code> - Defines the style of the border (solid, dashed, etc.).
      </p>
      <p>
        <code>--dbv-kit-select-font-weight</code> - Controls the boldness of the text in the select component.
      </p>
      <p>
        <code>--dbv-kit-select-font-size</code> - Sets the size of the text in the select component.
      </p>
      <p>
        <code>--dbv-kit-control-outline-width</code> - Defines the width of the focus outline.
      </p>
      <p>
        <code>--dbv-kit-control-outline-color</code> - Sets the color of the focus outline.
      </p>

      <h3>Label Variables</h3>
      <p>
        <code>--dbv-kit-select-label-padding-inline</code> - Controls the horizontal padding of the label.
      </p>
      <p>
        <code>--dbv-kit-select-label-foreground</code> - Sets the text color of the label.
      </p>

      <h3>Popover Variables</h3>
      <p>
        <code>--dbv-kit-select-popover-background</code> - Sets the background color of the dropdown menu.
      </p>
      <p>
        <code>--dbv-kit-select-popover-foreground</code> - Controls the text color of the dropdown menu.
      </p>
      <p>
        <code>--dbv-kit-select-popover-shadow</code> - Defines the shadow effect for the dropdown menu.
      </p>

      <h3>Item Variables</h3>
      <p>
        <code>--dbv-kit-select-item-padding-inline</code> - Sets the horizontal padding for dropdown items.
      </p>
      <p>
        <code>--dbv-kit-select-item-padding-block</code> - Controls the vertical padding for dropdown items.
      </p>
      <p>
        <code>--dbv-kit-select-item-selected-background</code> - Defines the background color for the selected item.
      </p>
      <p>
        <code>--dbv-kit-select-item-hover-background</code> - Sets the background color when hovering over an item.
      </p>
    </section>
  );
};

export const Example = () => {
  return (
    <>
      <h1>Select</h1>
      <p>
        The select component is used to create a dropdown list of options. This example shows how to use composition of Select elements to create a
        dropdown list with a popover. This approach should be used when you need to customize the appearance of the dropdown list drastically.
      </p>
      <h3>Theme</h3>
      <Select.Provider>
        <Select className="tw:w-[300px]" />
        <Select.Popover>
          <Select.Item value="Light">🌕 Light</Select.Item>
          <Select.Item value="Dark">🌘 Dark</Select.Item>
          <Select.Item disabled value="System">
            🌓 System
          </Select.Item>
        </Select.Popover>
        <Select.Label>Application color theme</Select.Label>
      </Select.Provider>
    </>
  );
};

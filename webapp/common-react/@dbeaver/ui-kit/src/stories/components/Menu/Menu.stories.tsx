/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Menu } from '../../../Menu/Menu.js';

export const Docs = () => {
  return (
    <section>
      <h2>Menu Component Documentation</h2>
      <p>
        The Menu component provides an accessible context menu / dropdown menu built on top of Ariakit primitives and styled via CSS classes and
        variables.
      </p>

      <h2>CSS Classes</h2>

      <h3>Button</h3>
      <p>
        <code>.dbv-kit-menu__button</code> – Styles the trigger button.
      </p>

      <h3>Popover</h3>
      <p>
        <code>.dbv-kit-menu__popover</code> – Styles the floating menu panel.
      </p>

      <h3>Items</h3>
      <p>
        <code>.dbv-kit-menu__item</code> – Styles a menu item (applies to normal/checkbox/radio items).
      </p>

      <h3>Misc</h3>
      <p>
        <code>.dbv-kit-menu__separator</code>, <code>.dbv-kit-menu__heading</code>, <code>.dbv-kit-menu__description</code>,
        <code>.dbv-kit-menu__group</code>, <code>.dbv-kit-menu__group-label</code>
      </p>

      <h2>CSS Variables</h2>

      <h3>Button</h3>
      <p>
        <code>--dbv-kit-menu-button-height</code>, <code>--dbv-kit-menu-button-padding-inline</code>
      </p>

      <h3>Colors</h3>
      <p>
        <code>--dbv-kit-menu-foreground</code>, <code>--dbv-kit-menu-background</code>, <code>--dbv-kit-menu-disabled-foreground</code>,
        <code>--dbv-kit-menu-disabled-background</code>
      </p>

      <h3>Border</h3>
      <p>
        <code>--dbv-kit-menu-border-width</code>, <code>--dbv-kit-menu-border-color</code>, <code>--dbv-kit-menu-border-style</code>,
        <code>--dbv-kit-menu-border-radius</code>, <code>--dbv-kit-menu-hover-border-color</code>
      </p>

      <h3>Typography</h3>
      <p>
        <code>--dbv-kit-menu-font-weight</code>, <code>--dbv-kit-menu-font-size</code>
      </p>

      <h3>Popover</h3>
      <p>
        <code>--dbv-kit-menu-popover-background</code>, <code>--dbv-kit-menu-popover-foreground</code>, <code>--dbv-kit-menu-popover-shadow</code>,
        <code>--dbv-kit-menu-popover-max-height</code>
      </p>

      <h3>Item</h3>
      <p>
        <code>--dbv-kit-menu-item-padding-inline</code>, <code>--dbv-kit-menu-item-padding-block</code>,
        <code>--dbv-kit-menu-item-hover-background</code>, <code>--dbv-kit-menu-item-hover-foreground</code>,
        <code>--dbv-kit-menu-item-selected-background</code>
      </p>

      <h3>Separator</h3>
      <p>
        <code>--dbv-kit-menu-separator-color</code>
      </p>
    </section>
  );
};

export const Example = () => {
  return (
    <div className="tw:space-y-8">
      <h1>Menu</h1>
      <p>
        The menu component is used to render a button that opens an accessible popover with actionable items. It follows the same composition pattern
        as Select.
      </p>

      <div>
        <h3>Default</h3>
        <Menu.Provider>
          <Menu.Button className="tw:w-[260px]">
            Open menu
            <Menu.ButtonArrow />
          </Menu.Button>
          <Menu className="tw:w-[260px]">
            <Menu.Heading>Section title</Menu.Heading>
            <Menu.Description>Optional description for this menu.</Menu.Description>
            <Menu.Item onClick={() => console.log('New file')}>New file</Menu.Item>
            <Menu.Item onClick={() => console.log('Open...')}>Open…</Menu.Item>
            <Menu.Item aria-disabled>Disabled action</Menu.Item>
            <Menu.Separator />
            <Menu.Group>
              <Menu.GroupLabel>More actions</Menu.GroupLabel>
              <Menu.Item onClick={() => console.log('Settings')}>Settings</Menu.Item>
              <Menu.Item onClick={() => console.log('About')}>About</Menu.Item>
            </Menu.Group>
          </Menu>
        </Menu.Provider>
      </div>
    </div>
  );
};

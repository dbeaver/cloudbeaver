/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Button, Menu, useMenuStore } from '@dbeaver/ui-kit';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fragment, useMemo, useState } from 'react';

const meta = {
  component: Menu.Button,
} satisfies Meta<typeof Menu.Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Menu.Provider>
      <Menu.Button>
        <Button variant="primary">
          Open menu
          <Menu.ButtonArrow />
        </Button>
      </Menu.Button>
      <Menu>
        <Menu.Item>Action 1</Menu.Item>
        <Menu.Item>Action 2</Menu.Item>
        <Menu.Item>Action 3 which demonstrates a very long text that should be wrapped on next line if it does not fit the item container</Menu.Item>
      </Menu>
    </Menu.Provider>
  ),
};

export const WithHeadingAndDescription = () => (
  <Menu.Provider>
    <Menu.Button>
      <Button variant="primary">
        Info menu
        <Menu.ButtonArrow />
      </Button>
    </Menu.Button>
    <Menu>
      <Menu.Heading>Section title</Menu.Heading>
      <Menu.Description>Optional section description</Menu.Description>
      <Menu.Separator />
      <Menu.Item>Action</Menu.Item>
      <Menu.Item>Another action</Menu.Item>
      <Menu.Separator />
      <Menu.Dismiss>Close</Menu.Dismiss>
    </Menu>
  </Menu.Provider>
);

export const WithGroups = () => (
  <Menu.Provider>
    <Menu.Button>
      <Button variant="primary">
        Grouped menu
        <Menu.ButtonArrow />
      </Button>
    </Menu.Button>
    <Menu>
      <Menu.Group>
        <Menu.GroupLabel>File</Menu.GroupLabel>
        <Menu.Item>New</Menu.Item>
        <Menu.Item>Open…</Menu.Item>
      </Menu.Group>
      <Menu.Separator />
      <Menu.Group>
        <Menu.GroupLabel>Edit</Menu.GroupLabel>
        <Menu.Item>Cut</Menu.Item>
        <Menu.Item>Copy</Menu.Item>
        <Menu.Item>Paste</Menu.Item>
      </Menu.Group>
    </Menu>
  </Menu.Provider>
);

export const WithDisabledItems = () => (
  <Menu.Provider>
    <Menu.Button>
      <Button variant="primary">
        Disabled items
        <Menu.ButtonArrow />
      </Button>
    </Menu.Button>
    <Menu>
      <Menu.Item>Enabled</Menu.Item>
      <Menu.Item disabled>Disabled</Menu.Item>
      <Menu.Item>Enabled again</Menu.Item>
    </Menu>
  </Menu.Provider>
);

export const CheckboxItems = () => {
  const [flags, setFlags] = useState({
    autosave: true,
    notifications: false,
  });

  return (
    <Menu.Provider>
      <Menu.Button>
        <Button variant="primary">
          Preferences
          <Menu.ButtonArrow />
        </Button>
      </Menu.Button>
      <Menu>
        <Menu.ItemCheckbox
          name="autosave"
          checked={flags.autosave}
          onChange={event => setFlags(s => ({ ...s, autosave: event.currentTarget.checked }))}
        >
          Autosave
        </Menu.ItemCheckbox>
        <Menu.ItemCheckbox
          name="notifications"
          checked={flags.notifications}
          onChange={event => setFlags(s => ({ ...s, notifications: event.currentTarget.checked }))}
        >
          Notifications
        </Menu.ItemCheckbox>
      </Menu>
    </Menu.Provider>
  );
};

export const RadioGroup = () => {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');

  return (
    <Menu.Provider>
      <Menu.Button>
        <Button variant="primary">
          Theme: {theme}
          <Menu.ButtonArrow />
        </Button>
      </Menu.Button>
      <Menu>
        <Menu.ItemRadio value="system" name="theme" checked={theme === 'system'} onChange={() => setTheme('system')}>
          System
        </Menu.ItemRadio>
        <Menu.ItemRadio value="light" name="theme" checked={theme === 'light'} onChange={() => setTheme('light')}>
          Light
        </Menu.ItemRadio>
        <Menu.ItemRadio value="dark" name="theme" checked={theme === 'dark'} onChange={() => setTheme('dark')}>
          Dark
        </Menu.ItemRadio>
      </Menu>
    </Menu.Provider>
  );
};

export const ControlledStore = () => {
  const store = useMenuStore({ placement: 'bottom-start' });

  return (
    <Fragment>
      <div className="tw:flex tw:gap-2 tw:mb-2">
        <button className="tw:px-2 tw:py-1 tw:border tw:rounded" onClick={() => store.show()}>
          Open programmatically
        </button>
        <button className="tw:px-2 tw:py-1 tw:border tw:rounded" onClick={() => store.hide()}>
          Close programmatically
        </button>
      </div>
      <Menu.Provider store={store}>
        <Menu.Button>
          <Button variant="primary">
            Controlled menu
            <Menu.ButtonArrow />
          </Button>
        </Menu.Button>
        <Menu gutter={8}>
          <Menu.Item>One</Menu.Item>
          <Menu.Item>Two</Menu.Item>
        </Menu>
      </Menu.Provider>
    </Fragment>
  );
};

export const WithoutPortal = () => (
  <div className="tw:p-8 tw:border tw:rounded tw:max-w-sm">
    <p className="tw:mb-2">Menu rendered inside container (portal=false)</p>
    <Menu.Provider>
      <Menu.Button>
        <Button variant="primary">
          Local menu
          <Menu.ButtonArrow />
        </Button>
      </Menu.Button>
      <Menu portal={false}>
        <Menu.Item>Aligned tight</Menu.Item>
        <Menu.Item>Another item</Menu.Item>
      </Menu>
    </Menu.Provider>
  </div>
);

export const LongListScrollable = () => {
  const items = useMemo(() => Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`), []);

  return (
    <Menu.Provider>
      <Menu.Button>
        <Button variant="primary">
          Many items
          <Menu.ButtonArrow />
        </Button>
      </Menu.Button>
      <Menu>
        {items.map(label => (
          <Menu.Item key={label}>{label}</Menu.Item>
        ))}
      </Menu>
    </Menu.Provider>
  );
};

export const MixedContent = () => (
  <Menu.Provider>
    <Menu.Button>
      <Button variant="primary">
        Mixed content
        <Menu.ButtonArrow />
      </Button>
    </Menu.Button>
    <Menu>
      <Menu.Heading>Profile</Menu.Heading>
      <Menu.Item>View profile</Menu.Item>
      <Menu.Item>Settings</Menu.Item>
      <Menu.Separator />
      <Menu.Group>
        <Menu.GroupLabel>Preferences</Menu.GroupLabel>
        <Menu.ItemCheckbox name="email-updates" defaultChecked>
          Email updates
        </Menu.ItemCheckbox>
        <Menu.ItemCheckbox name="browser-notifications">Browser notifications</Menu.ItemCheckbox>
      </Menu.Group>
      <Menu.Separator />
      <Menu.Group>
        <Menu.GroupLabel>Theme</Menu.GroupLabel>
        <Menu.ItemRadio value="system" name="theme2" defaultChecked>
          System
        </Menu.ItemRadio>
        <Menu.ItemRadio value="light" name="theme2">
          Light
        </Menu.ItemRadio>
        <Menu.ItemRadio value="dark" name="theme2">
          Dark
        </Menu.ItemRadio>
      </Menu.Group>
      <Menu.Separator />
      <Menu.Dismiss>Sign out</Menu.Dismiss>
    </Menu>
  </Menu.Provider>
);

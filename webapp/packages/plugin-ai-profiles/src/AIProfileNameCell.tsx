/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext, type ReactNode } from 'react';
import { observer } from 'mobx-react-lite';

import { IconButton, Link, MenuItemElement, useTranslate } from '@cloudbeaver/core-blocks';
import { DataGridCellInnerContext } from '@cloudbeaver/plugin-data-grid';
import { Command, Menu, MenuButton, MenuItem, MenuProvider } from '@dbeaver/ui-kit';

import type { AIProfile } from './AIProfilesResource.js';

interface Props {
  profile: AIProfile;
  badge?: ReactNode;
  disabled?: boolean;
  onOpen?: (profile: AIProfile) => void;
  onClone?: (profileId: string) => void;
}

export const AIProfileNameCell = observer<Props>(function AIProfileNameCell({ profile, badge, disabled, onOpen, onClone }) {
  const translate = useTranslate();
  const cell = useContext(DataGridCellInnerContext);

  return (
    <div className="tw:group tw:flex tw:w-full tw:min-w-0 tw:items-center tw:justify-between tw:gap-1">
      <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2" title={profile.name}>
        {onOpen ? (
          <Command render={<div />} tabIndex={0} className="tw:min-w-0 tw:cursor-pointer tw:outline-none!" onClick={() => onOpen(profile)}>
            <Link truncate>{profile.name}</Link>
          </Command>
        ) : (
          <span className="tw:truncate">{profile.name}</span>
        )}
        {badge}
      </div>
      {onClone && (
        <MenuProvider placement="bottom-end">
          <MenuButton
            render={
              <IconButton
                name="snack"
                viewBox="0 0 16 16"
                className={`tw:shrink-0 tw:group-hover:opacity-100 tw:focus:opacity-100 tw:focus-visible:outline-2! tw:focus-visible:outline-solid! tw:aria-expanded:opacity-100 ${cell?.isFocused ? 'tw:opacity-100' : 'tw:opacity-0'}`}
                aria-label={translate('plugin_ai_profiles_profile_menu')}
                onKeyDown={event => {
                  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                    event.preventDefault();
                  }
                }}
              />
            }
          />
          <Menu modal>
            <MenuItem
              disabled={disabled}
              render={<MenuItemElement label="plugin_ai_profiles_profile_clone" icon="copy" />}
              onClick={() => onClone(profile.id)}
            />
          </Menu>
        </MenuProvider>
      )}
    </div>
  );
});

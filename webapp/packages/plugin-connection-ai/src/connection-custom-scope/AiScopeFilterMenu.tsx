/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';

import { Checkbox, IconOrImage, useTranslate } from '@cloudbeaver/core-blocks';
import { IconButton, Menu, MenuButton } from '@dbeaver/ui-kit';

interface Props {
  filter: { containers: boolean; objects: boolean };
}

export const AiScopeFilterMenu = observer<Props>(function AiScopeFilterMenu({ filter }) {
  const translate = useTranslate();
  const selected = [filter.containers && 'containers', filter.objects && 'objects'].filter(value => value !== false);
  const title = translate('plugin_ai_scope_filter');

  return (
    <Menu.Provider
      placement="bottom-end"
      values={{ selected }}
      setValues={(values: { selected: string[] }) =>
        runInAction(() => {
          filter.containers = values.selected.includes('containers');
          filter.objects = values.selected.includes('objects');
        })
      }
    >
      <div className="theme-form-element-radius theme-background-surface theme-text-on-surface theme theme-border-color-background tw:flex tw:items-center tw:justify-center tw:box-border tw:h-8 tw:w-8 tw:shrink-0 tw:border-2">
        <MenuButton
          render={
            <IconButton
              className="tw:relative! tw:box-border! tw:bg-inherit! tw:cursor-pointer! tw:w-[28px]! tw:h-full! tw:p-1! tw:hover:opacity-80!"
              size="small"
              title={title}
              aria-label={title}
            />
          }
        >
          <IconOrImage className="tw:w-full tw:h-full" icon="filter" />
        </MenuButton>
      </div>
      <Menu aria-label={title} modal>
        <Menu.Group className="tw:flex tw:flex-col">
          {(['containers', 'objects'] as const).map(key => (
            <Menu.ItemCheckbox key={key} name="selected" value={key} className="tw:px-2!" tabbable>
              <Checkbox tabIndex={-1} size="small" checked={filter[key]} label={translate(`plugin_ai_scope_${key}`)} />
            </Menu.ItemCheckbox>
          ))}
        </Menu.Group>
      </Menu>
    </Menu.Provider>
  );
});

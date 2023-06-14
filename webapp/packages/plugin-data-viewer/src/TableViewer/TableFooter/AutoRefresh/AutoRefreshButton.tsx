/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Icon, Menu, MenuItem, MenuItemElement, TimerIcon, useTranslate } from '@cloudbeaver/core-blocks';
import { declensionOfNumber } from '@cloudbeaver/core-utils';

import type { IDatabaseDataModel } from '../../../DatabaseDataModel/IDatabaseDataModel';
import { useAutoRefresh } from './useAutoRefresh';

const styles = css`
  auto-reload {
    composes: theme-text-primary theme-ripple from global;
    height: 100%;
    display: flex;
    cursor: pointer;
    align-items: center;

    & icon-box {
      position: relative;
      padding-left: 8px;
      display: flex;
      align-items: center;

      & Icon {
        width: 16px;
        height: 16px;
        flex-grow: 0;
        flex-shrink: 0;
      }

      &:hover > Icon :global(use) {
        fill: var(--theme-primary) !important;
      }
    }

    & arrow-box {
      position: relative;
      height: 100%;
      display: flex;
      align-items: center;
      padding-right: 8px;

      & > Icon {
        width: 14px;
        height: 14px;
        flex-grow: 0;
        flex-shrink: 0;
      }

      &:hover > Icon :global(use) {
        fill: var(--theme-primary) !important;
      }
    }
  }
`;

interface Props {
  model: IDatabaseDataModel<any, any>;
  disabled?: boolean;
}

const intervals = [5, 10, 15, 30, 60];

export const AutoRefreshButton = observer<Props>(function AutoRefreshButton({ model, disabled }) {
  const translate = useTranslate();
  const autoRefresh = useAutoRefresh(model);
  const interval = autoRefresh.settings.interval;
  const intervals_messages: string[] = [];

  const buttonTitle = translate(interval === null ? 'data_viewer_action_refresh' : 'data_viewer_action_auto_refresh_stop');

  function handleClick() {
    if (disabled) {
      return;
    }

    if (interval === null) {
      model.refresh();
    } else {
      autoRefresh.stop();
    }
  }

  for (let interval of intervals) {
    let message = ['ui_second_first_form', 'ui_second_second_form', 'ui_second_third_form'];

    if (interval >= 60) {
      message = ['ui_minute_first_form', 'ui_minute_second_form', 'ui_minute_third_form'];
      interval = Math.round(interval / 60);
    }

    intervals_messages.push(translate(declensionOfNumber(interval, message), undefined, { interval }));
  }

  return styled(styles)(
    <auto-reload aria-disabled={disabled}>
      <icon-box title={buttonTitle} onClick={handleClick}>
        {interval === null ? <Icon name="/icons/refresh_m.svg#root" viewBox="0 0 24 24" /> : <TimerIcon state="stop" interval={interval} />}
      </icon-box>
      <Menu
        label="Auto refresh"
        items={
          <>
            <MenuItem aria-label={translate('ui_custom')} close onClick={autoRefresh.configure}>
              <MenuItemElement label={translate('ui_custom')} />
            </MenuItem>
            {intervals.map((inte, i) => (
              <MenuItem
                key={inte}
                aria-label={intervals_messages[i]}
                selected={interval === inte}
                close
                onClick={() => autoRefresh.setInterval(inte)}
              >
                <MenuItemElement label={intervals_messages[i]} />
              </MenuItem>
            ))}
            <MenuItem aria-label={translate('ui_processing_stop')} selected={interval === null} close onClick={autoRefresh.stop}>
              <MenuItemElement label={translate('ui_processing_stop')} />
            </MenuItem>
          </>
        }
        disabled={disabled}
        modal
        disclosure
      >
        <arrow-box title={translate('data_viewer_action_auto_refresh')}>
          <Icon name="arrow" viewBox="0 0 16 16" />
        </arrow-box>
      </Menu>
    </auto-reload>,
  );
});

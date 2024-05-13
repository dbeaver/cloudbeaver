/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Icon, Menu, MenuItem, MenuItemElement, s, TimerIcon, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { declensionOfNumber } from '@cloudbeaver/core-utils';

import type { IDatabaseDataModel } from '../../../DatabaseDataModel/IDatabaseDataModel';
import styles from './AutoRefreshButton.m.css';
import { useAutoRefresh } from './useAutoRefresh';

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
  const style = useS(styles);

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

  return (
    <div className={s(style, { autoReload: true })} aria-disabled={disabled}>
      <div className={s(style, { iconBox: true })} title={buttonTitle} onClick={handleClick}>
        {interval === null ? (
          <Icon className={s(style, { icon: true })} name="/icons/refresh_m.svg#root" viewBox="0 0 24 24" />
        ) : (
          <TimerIcon state="stop" interval={interval} />
        )}
      </div>
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
        <div className={s(style, { arrowBox: true })} title={translate('data_viewer_action_auto_refresh')}>
          <Icon className={s(style, { icon: true })} name="arrow" viewBox="0 0 16 16" />
        </div>
      </Menu>
    </div>
  );
});

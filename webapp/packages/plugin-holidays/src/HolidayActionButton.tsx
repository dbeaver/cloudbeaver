/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import holidayStyles from './HolidayActionButton.module.css';
import { HolidaysService } from './HolidaysService.js';

export const HolidayActionButton = observer(function HolidayActionButton() {
  const { holiday } = useService(HolidaysService);

  function handleHolidayActionButtonClick() {
    if (holiday?.isCelebrating) {
      holiday.stopCelebration();
    } else {
      holiday?.startCelebration();
    }
  }

  if (!holiday) {
    return null;
  }

  return (
    <button
      className={s(holidayStyles, { holidayButton: true, buttonActive: holiday.isCelebrating })}
      title={holiday.name}
      onClick={handleHolidayActionButtonClick}
    >
      <img width={24} height={24} src={holiday.iconSrc} />
    </button>
  );
});

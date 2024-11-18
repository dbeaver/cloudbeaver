/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useService } from '@cloudbeaver/core-di';

import { HolidaysService } from '../HolidaysService.js';

export const ChristmasBall = observer(function ChristmasBall() {
  const { isCelebrating, celebrate, stopCelebration, isHoliday } = useService(HolidaysService);

  const handleButtonClick = () => {
    if (isCelebrating) {
      stopCelebration();
    } else {
      celebrate();
    }
  };

  return isHoliday ? (
    <button style={{ background: isCelebrating ? 'green' : 'gray' }} onClick={handleButtonClick}>
      ICON
    </button>
  ) : null;
});

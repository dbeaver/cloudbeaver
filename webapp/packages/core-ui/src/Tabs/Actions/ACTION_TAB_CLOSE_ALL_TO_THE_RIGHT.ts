/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createAction } from "@cloudbeaver/core-view";

export const ACTION_TAB_CLOSE_ALL_TO_THE_RIGHT = createAction('tab-close-all-to-the-right', {
  label: 'ui_close_all_to_the_right',
  tooltip: 'ui_close_all_to_the_right'
});

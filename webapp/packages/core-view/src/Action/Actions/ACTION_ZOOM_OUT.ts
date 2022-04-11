/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createAction } from '../createAction';

export const ACTION_ZOOM_OUT = createAction('zoom-out', {
  label: 'core_view_zoom_out',
  tooltip: 'core_view_zoom_out',
  icon: '/icons/zoom-out.svg',
});

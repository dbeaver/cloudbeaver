/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useRef } from 'react';

import { getComputed, useMouse, useStateDelay } from '@cloudbeaver/core-blocks';
import type { IDNDBox } from '@cloudbeaver/core-ui';

export function useDropOutside(dndBox: IDNDBox) {
  const nestedRef = useRef<HTMLDivElement>(null);
  const mouse = useMouse();

  const showDropOutsidePrev = useRef({
    state: false,
    bottom: false,
  });
  let showDropOutside = getComputed(() => !!dndBox.state.context && dndBox.state.canDrop);
  let bottom = false;

  const box = nestedRef.current?.getBoundingClientRect();
  const offset = 24;

  if (mouse.state.position !== null && box) {
    if (mouse.state.position.y > box.height - offset) {
      bottom = true;
      showDropOutside &&= true;
    } else if (mouse.state.position.y < offset) {
      showDropOutside &&= true;
    } else if (showDropOutsidePrev.current.state) {
      showDropOutside &&= true;
      bottom = showDropOutsidePrev.current.bottom;
    } else {
      showDropOutside = false;
    }
  }

  showDropOutside = useStateDelay(showDropOutside, 100);
  showDropOutsidePrev.current.bottom = bottom;
  showDropOutsidePrev.current.state = showDropOutside;
  bottom = useStateDelay(bottom, 100);
  const zoneActive = dndBox.state.context && showDropOutside && dndBox.state.isOverCurrent;

  return {
    mouse,
    showDropOutside,
    zoneActive,
    bottom,
    nestedRef,
  };
}

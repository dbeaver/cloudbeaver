import { getOS, OperatingSystem } from '@cloudbeaver/core-utils';

import type { IKeyBinding } from './IKeyBinding';

export function getOSSpecificKeys(keyBinding: IKeyBinding | undefined): string | string[] {
  if (keyBinding === undefined) {
    return '';
  } else {
    const OS = getOS();
    let specificKeys;
    if (OS === OperatingSystem.macOS) {
      specificKeys = keyBinding.keysMac;
    }
    return specificKeys ?? keyBinding.keys;
  }
}

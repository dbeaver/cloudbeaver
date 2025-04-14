/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { base64ToHex } from './base64ToHex.js';

const BASE_64_STRING =
  'iVBORw0KGgoAAAANSUhEUgAAAhAAAAEWCAIAAAC40zleAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAACydSURBVHhe7Z1rsF1VtecnkAcQkhgsjVJlW3xQEcWkeOV5njknhHhCUCAVIOQFQQIHbocgJCGPaum6RXjdEMWU3WmVRxQhXLttbt+riAKBW1QJlerYbW4CX/jiLZUqbvmlu/ph9xhzzNeaa+199pn7PPZa6/+rUTlzjTnmWHPD3uO/51p776n6lq';

describe('base64ToHex', () => {
  it('should return a hex string', () => {
    expect(base64ToHex(BASE_64_STRING)).toBe(
      '89504E470D0A1A0A0000000D4948445200000210000001160802000000B8D3395E000000017352474200AECE1CE90000000467414D410000B18F0BFC6105000000097048597300000EC300000EC301C76FA86400002C9D49444154785EED9D6BB05D55B5E72790071092182C8D52655B7C5011C5A478E5799E392784784250201520E4054102076E872024218F6AE9BA4578DD10C594DD69954714215CBB6D6EDFAB8802815B540995EAD86D6E025FF8E22D952A6EF9A5BBFA61F71873CCD79A6BED7DF699FB3CF65AEBFFAB5139738D39E65873C3DEE3BFE75A7BEFA9FA96',
    );
  });

  it('should return an empty string', () => {
    expect(base64ToHex('')).toBe('');
  });

  it('should throw an error if the base64 string is invalid', () => {
    expect(() => base64ToHex('-10')).toThrow();
  });
});

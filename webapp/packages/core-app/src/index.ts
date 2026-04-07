/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import './module.js';
// Services
export * from './AppScreen/AppScreenService.js';
export * from './AppScreen/AppScreenBootstrap.js';
export * from './AppScreen/SkipNavService.js';

export * from './AppLocaleService.js';

// components
export * from './BodyLazy.js';

//styles for skip nav links
import styles from './AppScreen/SkipNavLinks.module.css';
export { styles as skipNavStyles };

/* eslint-disable import-helpers/order-imports, import/order, import/no-duplicates */
/* this eslint-disable required for webpack inject */
import 'reflect-metadata';

import { bootstrap } from '@dbeaver/core';

const PLUGINS = []; // will be injected by webpack

bootstrap(PLUGINS);

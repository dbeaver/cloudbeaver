/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { toJS } from 'mobx';

import { isResourceAlias, type ResourceAlias, type ResourceAliasFactory, type ResourceAliasOptions } from './ResourceAlias.js';
import type { ResourceKey, ResourceKeySimple } from './ResourceKey.js';
import type { ResourceKeyAlias } from './ResourceKeyAlias.js';
import { isResourceKeyList, ResourceKeyList } from './ResourceKeyList.js';
import type { ResourceKeyListAlias } from './ResourceKeyListAlias.js';
import type { ResourceLogger } from './ResourceLogger.js';

export type IParamAlias<TKey> = {
  id: string;
  getAlias: ResourceAliasResolver<TKey, any>;
  transformKey?: ResourceAliasKeyTransformer<TKey, any>;
};

export type ResourceAliasResolver<TKey, TOptions extends ResourceAliasOptions> = (param: ResourceAlias<TKey, TOptions>) => ResourceKey<TKey>;

export type ResourceAliasKeyTransformer<TKey, TOptions extends ResourceAliasOptions> = <T extends ResourceKeySimple<TKey>>(
  param: ResourceAlias<TKey, TOptions>,
  key: T,
) => T;

export class ResourceAliases<TKey> {
  protected paramAliases: Array<IParamAlias<TKey>>;
  private captureAliasGetterExecution: boolean;

  constructor(
    private readonly logger: ResourceLogger,
    private readonly validateKey: (key: TKey) => boolean,
  ) {
    this.paramAliases = [];

    this.captureAliasGetterExecution = false;
  }

  has(key: ResourceAlias<TKey, any>): boolean {
    return this.paramAliases.some(alias => alias.id === key.id);
  }

  isAlias<TOptions extends ResourceAliasOptions>(
    key: ResourceKey<TKey>,
    aliasToCompare?: ResourceAlias<TKey, TOptions> | ResourceAliasFactory<TKey, TOptions>,
  ): ResourceAlias<TKey, TOptions> | undefined {
    if (isResourceAlias(key)) {
      key = this.transformToAlias(key);
      if (this.has(key)) {
        if (aliasToCompare === undefined) {
          return key as ResourceAlias<TKey, TOptions>;
        }
        return key.find(aliasToCompare);
      }
      throw new Error(`Alias ${key.toString()} is not registered in ${this.logger.getName()}`);
    }
    return undefined;
  }

  add<TOptions extends ResourceAliasOptions>(
    param: ResourceAlias<TKey, TOptions> | ResourceAliasFactory<TKey, TOptions>,
    getAlias: ResourceAliasResolver<TKey, TOptions>,
    transformKey?: ResourceAliasKeyTransformer<TKey, TOptions>,
  ): void {
    this.paramAliases.push({ id: param.id, getAlias, transformKey });
  }

  replace<TOptions extends ResourceAliasOptions>(
    param: ResourceAlias<TKey, TOptions> | ResourceAliasFactory<TKey, TOptions>,
    getAlias: ResourceAliasResolver<TKey, TOptions>,
    transformKey?: ResourceAliasKeyTransformer<TKey, TOptions>,
  ): void {
    const indexOf = this.paramAliases.findIndex(aliasInfo => aliasInfo.id === param.id);

    if (indexOf === -1) {
      this.add(param, getAlias, transformKey);
    } else {
      this.paramAliases.splice(indexOf, 1, { id: param.id, getAlias, transformKey });
    }
  }

  transformToAlias(
    key: ResourceKeyAlias<TKey, any> | ResourceKeyListAlias<TKey, any>,
  ): ResourceKeyAlias<TKey, any> | ResourceKeyListAlias<TKey, any> {
    if (this.captureAliasGetterExecution) {
      return key;
    }

    let deep = 0;
    transform: if (deep < 10) {
      if (!this.validateResourceKey(key)) {
        let paramString = JSON.stringify(toJS(key));

        if (isResourceKeyList(key) || isResourceAlias(key)) {
          paramString = key.toString();
        }
        this.logger.warn(`Invalid resource key ${paramString}`);
      }

      for (const alias of this.paramAliases) {
        if (alias.id === key.id) {
          const data = this.captureGetAlias(alias, key);

          if (isResourceAlias(data)) {
            key = data.setParent(key);
          } else {
            return key;
          }
          deep++;
          break transform;
        }
      }
    } else {
      this.logger.error('Alias transform deep limit reached');
    }
    return key;
  }
  transformToKey(param: ResourceKey<TKey>): TKey | ResourceKeyList<TKey> {
    let deep = 0;

    const transforms: Array<{ key: ResourceKeyAlias<TKey, any> | ResourceKeyListAlias<TKey, any>; alias: IParamAlias<TKey> }> = [];
    while (deep < 10) {
      if (!this.validateResourceKey(param)) {
        let paramString = JSON.stringify(toJS(param));

        if (isResourceKeyList(param)) {
          paramString = param.toString();
        }
        this.logger.warn(`Invalid resource key ${paramString}`);
      }

      if (isResourceAlias(param)) {
        for (const alias of this.paramAliases) {
          if (alias.id === param.id) {
            transforms.push({ key: param, alias });
            const nextParam = this.captureGetAlias(alias, param);

            if (isResourceAlias(nextParam)) {
              param = nextParam.setParent(param);
            } else {
              param = nextParam;
            }

            deep++;
            break;
          }
        }
      } else {
        break;
      }
    }

    if (deep === 10) {
      this.logger.error('Alias transform deep limit reached');
    }

    if (isResourceAlias(param)) {
      throw new Error(`Alias ${param.toString()} is not registered in ${this.logger.getName()}`);
    }

    for (const { key, alias } of transforms) {
      param = alias.transformKey ? alias.transformKey(key, param) : param;
    }

    return param;
  }

  protected captureGetAlias(alias: IParamAlias<TKey>, param: ResourceAlias<TKey, any>): ResourceKey<TKey> {
    try {
      this.captureAliasGetterExecution = true;
      return alias.getAlias(param);
    } finally {
      this.captureAliasGetterExecution = false;
    }
  }

  /**
   * Check if key is valid. Can be overridden to provide custom validation.
   * When key is alias checks that alias is registered.
   * When key is list checks that all keys are valid.
   * When key is primitive checks that this type of primitive is valid for current resource.
   * @param param - Resource key
   */
  protected validateResourceKey(param: ResourceKey<TKey>): boolean {
    if (isResourceAlias(param)) {
      return this.has(param);
    }

    if (isResourceKeyList(param)) {
      return param.length === 0 || param.every(this.validateKey.bind(this));
    }
    return this.validateKey(param);
  }
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, makeObservable, observable } from 'mobx';

import type { SqlDialectInfo } from '@cloudbeaver/core-sdk';

type RequireOne<T, K extends keyof T> = {
  [X in Exclude<keyof T, K>]?: T[X]
} & {
  [P in K]-?: T[P]
};

export interface IQueryInfo {
  start: number;
  end: number;
}

export interface ISQLScriptSegment {
  query: string;

  /** query begin index in script */
  begin: number;
  /** query end index in script */
  end: number;

  /** query begin line */
  from: number;
  /** query end line */
  to: number;
  /** query begin index in line */
  fromPosition: number;
  /** query end index in line */
  toPosition: number;
}

export interface ISQLScriptLine {
  index: number;
  begin: number;
  end: number;
}

const defaultDialect: RequireOne<
SqlDialectInfo,
'scriptDelimiter' | 'quoteStrings' | 'singleLineComments' | 'multiLineComments'
> = {
  scriptDelimiter: ';',
  quoteStrings: [['"', '"']],
  singleLineComments: ['--'],
  multiLineComments: [['/*', '*/']],
};

export class SQLParser {
  get scriptDelimiters(): string[] {
    return [...this.customScriptDelimiters, this.dialect?.scriptDelimiter || defaultDialect.scriptDelimiter];
  }

  get quoteStrings(): string[][] {
    return [...this.customQuotes, ...(this.dialect?.quoteStrings || defaultDialect.quoteStrings)];
  }

  get singleLineComments(): string[] {
    return this.dialect?.singleLineComments || defaultDialect.singleLineComments;
  }

  get multiLineComments(): string[][] {
    return this.dialect?.multiLineComments || defaultDialect.multiLineComments;
  }

  get scripts(): ISQLScriptSegment[] {
    this.update();
    return this._scripts;
  }

  get lineCount(): number {
    this.update();
    return this.lines.length;
  }

  get actualScript(): string {
    return this.script;
  }

  private dialect: SqlDialectInfo | null;
  private _scripts: ISQLScriptSegment[];
  private script: string;
  private parsedScript: string | null;
  private lines: ISQLScriptLine[];
  private customScriptDelimiters: string[];
  private readonly customQuotes: string[][];

  constructor() {
    this.dialect = null;
    this._scripts = [];
    this.script = '';
    this.parsedScript = null;
    this.lines = [];
    this.customScriptDelimiters = [];
    this.customQuotes = [["'", "'"]];

    makeObservable<this, 'dialect' | '_scripts' | 'script' | 'parsedScript' | 'lines' | 'customScriptDelimiters' | 'update' | 'customQuotes'>(this, {
      scriptDelimiters: computed,
      quoteStrings: computed,
      singleLineComments: computed,
      multiLineComments: computed,
      actualScript: computed,
      dialect: observable.ref,
      _scripts: observable.shallow,
      script: observable.ref,
      parsedScript: observable.ref,
      lines: observable.shallow,
      customScriptDelimiters: observable.ref,
      customQuotes: observable.ref,
      getScriptSegment: action,
      getSegment: action,
      getQueryAtPos: action,
      getLineAtPos: action,
      getScriptLineAtPos: action,
      setScript: action,
      setDialect: action,
      setCustomDelimiters: action,
      parse: action,
      setQueries: action,
      isEndsWithDelimiter: action,
      update: action,
    });
  }

  getScriptSegment(): ISQLScriptSegment {
    const script = this.parsedScript || '';
    const to = this.getScriptLineAtPos(script.length);

    return {
      query: script,
      begin: 0,
      end: script.length,
      from: 0,
      to: this.lineCount,
      fromPosition: 0,
      toPosition: to?.end || 0,
    };
  }

  getSegment(begin: number, end: number): ISQLScriptSegment | undefined {
    if (begin === end) {
      return this.getQueryAtPos(begin);
    }

    if (end === -1) {
      end = begin;
    }

    this.update();
    const from = this.getScriptLineAtPos(begin);
    const to = this.getScriptLineAtPos(end);

    if (!from || !to) {
      return undefined;
    }

    return {
      query: (this.parsedScript || '').substring(begin, end),
      begin,
      end,
      from: from.index,
      to: to.index,
      fromPosition: begin - from.begin,
      toPosition: end - to.begin,
    };
  }

  getQueryAtPos(position: number): ISQLScriptSegment | undefined {
    this.update();
    const script = this._scripts.find(script => script.begin <= position && script.end > position);

    if (script) {
      return script;
    }

    const line = this.getLineAtPos(position);

    const closestScripts = this._scripts.filter(
      script => script.begin <= position && (script.to === line || script.to === line - 1)
    );

    if (closestScripts.length > 0) {
      return closestScripts[closestScripts.length - 1];
    }

    return undefined;
  }

  getLineAtPos(position: number): number {
    return this.lines.find(line => line.begin <= position && line.end > position)?.index ?? 0;
  }

  getScriptLineAtPos(position: number): ISQLScriptLine | undefined {
    return this.lines.find(line => line.begin <= position && line.end > position);
  }

  setScript(script: string): void {
    this.script = script;
  }

  setDialect(dialect: SqlDialectInfo | null): void {
    this.dialect = dialect;
    this.parsedScript = '';
  }

  setCustomDelimiters(delimiters: string[]): void {
    this.customScriptDelimiters = delimiters;
  }

  parse(script: string): void {
    this._scripts = [];
    this.parsedScript = script;
    this.lines = [];

    let ignore = false;
    let releaseChar = '';
    let currentSegment = '';

    let position = 0;

    let begin = 0;
    for (const line of script.split('\n')) {
      const end = begin + line.length + 1;

      this.lines.push({
        index: this.lines.length,
        begin,
        end,
      });

      begin = end;
    }

    for (const char of script) {
      currentSegment += char;
      position++;

      if (ignore) {
        if (currentSegment.endsWith(releaseChar)) {
          ignore = false;
        }

        if (position < script.length) {
          continue;
        }
      }

      const scriptDelimiter = this.scriptDelimiters.find(scriptDelimiter => currentSegment.endsWith(scriptDelimiter));

      if (scriptDelimiter || position === script.length) {
        let query = currentSegment;

        if (scriptDelimiter) {
          query = query.substring(0, query.length - scriptDelimiter.length);
        }

        query = query.trim();

        if (query) {
          const begin = script.indexOf(query, position - currentSegment.length);
          const end = begin + query.length;
          const from = this.getScriptLineAtPos(begin);
          const to = this.getScriptLineAtPos(end);

          if (from && to) {
            this._scripts.push({
              query,
              begin,
              end,
              from: from.index,
              to: to.index,
              fromPosition: begin - from.begin,
              toPosition: end - to.begin,
            });
          }
        }

        currentSegment = '';
      }

      for (const singleLineComment of this.singleLineComments) {
        if (currentSegment.endsWith(singleLineComment)) {
          ignore = true;
          releaseChar = '\n';
          break;
        }
      }

      if (ignore) {
        continue;
      }

      for (const quote of this.quoteStrings) {
        if (currentSegment.endsWith(getBlockChar(quote, true))) {
          ignore = true;
          releaseChar = getBlockChar(quote, false);
          break;
        }
      }

      if (ignore) {
        continue;
      }

      for (const comment of this.multiLineComments) {
        if (currentSegment.endsWith(getBlockChar(comment, true))) {
          ignore = true;
          releaseChar = getBlockChar(comment, false);
          break;
        }
      }
    }
  }

  setQueries(queries: IQueryInfo[]): this {
    this.update();
    this._scripts = [];

    for (const query of queries) {
      const from = this.getScriptLineAtPos(query.start);
      const to = this.getScriptLineAtPos(query.end);

      if (from && to) {
        this._scripts.push({
          query: this.script.substring(query.start, query.end),
          begin: query.start,
          end: query.end,
          from: from.index,
          to: to.index,
          fromPosition: query.start - from.begin,
          toPosition: query.end - to.begin,
        });
      }
    }

    return this;
  }

  isEndsWithDelimiter(position?: number): boolean {
    this.update();
    const script = this.parsedScript?.substring(0, position);
    return this.scriptDelimiters.some(delimiter => script?.endsWith(delimiter));
  }

  private update() {
    if (this.parsedScript !== this.script) {
      this.parse(this.script);
    }
  }
}

function getBlockChar(chars: string[], openChar: boolean) {
  if (chars.length === 1) {
    return chars[0];
  }

  return openChar ? chars[0] : chars[1];
}

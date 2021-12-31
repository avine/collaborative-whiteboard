import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

import { STORAGE_PREFIX } from './storage.types';

@Injectable()
export class CwStorageService {
  private readonly local = this.document.defaultView?.localStorage;
  private readonly session = this.document.defaultView?.sessionStorage;

  constructor(@Inject(DOCUMENT) private document: Document) {}

  setSession<T = any>(key: string, value: T): void {
    this.set(this.session, key, value);
  }

  getSession<T = any>(key: string, defaultValue: T): T;
  getSession<T = any>(key: string, defaultValue?: undefined): T | null;
  getSession<T = any>(key: string, defaultValue?: T): T | null {
    return this.get(this.session, key) ?? defaultValue ?? null;
  }

  removeSession(key: string): void {
    this.remove(this.session, key);
  }

  setLocal<T = any>(key: string, value: T): void {
    this.set(this.local, key, value);
  }

  getLocal<T = any>(key: string, defaultValue: T): T;
  getLocal<T = any>(key: string, defaultValue?: undefined): T | null;
  getLocal<T = any>(key: string, defaultValue?: T): T | null {
    return this.get(this.local, key) ?? defaultValue ?? null;
  }

  removeLocal(key: string): void {
    this.remove(this.local, key);
  }

  private set<T = any>(storage: Storage | undefined, key: string, value: T): void {
    storage?.setItem(this.getKey(key), JSON.stringify(value));
  }

  private get<T = any>(storage: Storage | undefined, key: string): T | null {
    const value = storage?.getItem(this.getKey(key)) ?? null;
    if (value === null) {
      return null;
    }
    return JSON.parse(value);
  }

  private remove(storage: Storage | undefined, key: string): void {
    storage?.removeItem(this.getKey(key));
  }

  private getKey(key: string): string {
    return STORAGE_PREFIX + key;
  }
}

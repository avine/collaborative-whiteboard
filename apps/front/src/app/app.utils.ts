import { APP_VERSION } from './app.version';

export const isAppVersionOutdated = (version: string | null): boolean =>
  APP_VERSION.substring(0, 1) !== (version ?? '').substring(0, 1);

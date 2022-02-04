import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cwPurify',
  pure: true,
})
export class CwPurifyPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform<A extends any[], R>(fn: (...args: A) => R, ...args: A): R {
    return fn(...args);
  }
}

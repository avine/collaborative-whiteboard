export const applyOn = <T>(args: T[], fn: (arg: T) => void) => args.forEach((arg) => fn(arg));

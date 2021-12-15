export const addStorageKeySuffix = (key: string, suffix: string | undefined) => suffix ? `${key}-${suffix}` : key;

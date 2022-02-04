export const getDrawEventUID = () =>
  `${Date.now()}-${Math.round(Math.random() * 1e16)
    .toString(16)
    .substring(0, 4)}`;

export const getDomUID = (prefix = '') => (prefix ? `${prefix}-` : '') + Math.random().toString().substring(2);

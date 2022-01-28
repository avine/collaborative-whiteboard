export const getAnimFlushCount = (remain: number, total: number) => {
  // Let's do some easing!
  const count = Math.round((Math.sin((remain / total) * Math.PI) * total) / 50) + 1;
  return Math.min(count, remain);
};

export const WORKING_START_HOUR = 9;
export const WORKING_END_HOUR = 17;
export const SLOT_MINUTES = 30;
export const SLOT_LOOKAHEAD_DAYS = 30;
export const SLOT_GRID_LABEL = 'Business Slots';

export const isDateWithinLookahead = (date: Date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);

  return diffDays >= 0 && diffDays <= SLOT_LOOKAHEAD_DAYS;
};

import { ADMIN_GROUPS } from "../config";

const isBelongsTo = (groups: string[]): boolean => {
  for (const key in ADMIN_GROUPS) {
    if (groups && groups.indexOf(ADMIN_GROUPS[key]) > -1) {
      return true;
    }
  }
  return false;
};

export { isBelongsTo };

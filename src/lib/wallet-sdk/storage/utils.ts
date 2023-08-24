
export const recordify = (recordStr: string) => {
  try {
    return JSON.parse(recordStr);
  } catch {
    return null;
  }
};

export const stringify = (object: string): string => {
  return JSON.stringify(object);
}
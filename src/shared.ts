/* eslint-disable @typescript-eslint/no-explicit-any */

// 87
// 87a
// 1:2:3
// 2a:3
const isShort = /^\d+[ab]?(?::\d+[ab]?)*$/;

const splitShort = (short: string, schema: any) => {
  const names = schema.sectionNames;
  const heNames = schema.heSectionNames;
  const parts = short.split(':');
  return parts.map((part, i) => ({
    name: names[i],
    nameHebrew: heNames[i],
    number: part,
  }));
};

export const getSectionsFromRef = (
  refPath: string,
  schema: any
): undefined | Array<{ name: string; nameHebrew: string; number?: string }> => {
  if (isShort.test(refPath)) {
    if (schema.sectionNames) return splitShort(refPath, schema);
    const node = schema.nodes?.find((n: any) => n.default);
    if (node) return getSectionsFromRef(refPath, node);
  }

  const parts = refPath.split(/( |(?:, ))/);
  const last = parts.at(-1);
  if (last && isShort.test(last)) {
    for (let i = 1; i <= parts.length - 1; i += 2) {
      const maybe = parts.slice(0, i).join('');
      const node = schema.nodes?.find((node: any) => node.title === maybe);
      if (node) {
        const rest = getSectionsFromRef(parts.slice(i + 1).join(''), node);
        if (rest) {
          return [{ name: node.title, nameHebrew: node.heTitle }, ...rest];
        }
      }
    }
  }
};

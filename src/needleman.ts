// https://gist.github.com/shinout/f19da7720d130f3925ac
// https://dke.maastrichtuniversity.nl/o.boes/misc/2013-needleman-wunsch.html

export type Needleman<Reference, Incoming> =
  | { type: 'match'; expect: Reference; got: Incoming; cost: number }
  | { type: 'miss'; expect: Reference; cost: number }
  | { type: 'extra'; got: Incoming; cost: number };

export const needleman = <Reference, Incoming = Reference>(
  reference: Reference[],
  incoming: Incoming[],
  matches = (expect: Reference, got: Incoming) =>
    expect === (got as never) ? 1 : (0 as number),
  { match = 3, sub = -1, gap = -1 } = {}
) => {
  let refLength = reference.length;
  let inLength = incoming.length;

  const matrix: number[][] = [[]];

  for (let j = 0; j <= inLength; j++) matrix[0][j] = j * gap;

  for (let i = 1; i <= refLength; i++) {
    matrix[i] = [i * gap];

    for (let j = 1; j <= inLength; j++) {
      const matched = matches(reference[i - 1], incoming[j - 1]);
      matrix[i][j] = Math.max(
        matrix[i - 1][j] + gap,
        matrix[i][j - 1] + gap,
        matrix[i - 1][j - 1] + (matched ? match * matched : sub)
      );
    }
  }

  const result: Needleman<Reference, Incoming>[] = [];

  while (refLength > 0 && inLength > 0) {
    const expect = () => reference[refLength];
    const cost = () => matrix[refLength][inLength];
    const got = () => incoming[inLength];
    if (cost() == matrix[refLength - 1][inLength] + gap) {
      refLength--;
      result.push({ type: 'miss', expect: expect(), cost: cost() });
    } else if (cost() == matrix[refLength][inLength - 1] + gap) {
      inLength--;
      result.push({ type: 'extra', got: got(), cost: cost() });
    } else {
      refLength--;
      inLength--;
      result.push({
        type: 'match',
        expect: expect(),
        got: got(),
        cost: cost(),
      });
    }
  }

  result.reverse();

  return result;
};

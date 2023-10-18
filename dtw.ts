// Adapted from https://github.com/GordonLesti/dynamic-time-warping

export const dtw = <Reference, Incoming = Reference>(
  reference: Reference[],
  incoming: Incoming[],
  distanceFunction: (a: Reference, b: Incoming) => number
) => {
  const matrix: number[][] = [];
  for (let i = 0; i < reference.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < incoming.length; j++) {
      let cost = Infinity;
      if (i > 0) {
        cost = Math.min(cost, matrix[i - 1][j]);
        if (j > 0) {
          cost = Math.min(cost, matrix[i - 1][j - 1]);
          cost = Math.min(cost, matrix[i][j - 1]);
        }
      } else {
        if (j > 0) {
          cost = Math.min(cost, matrix[i][j - 1]);
        } else {
          cost = 0;
        }
      }
      matrix[i][j] = cost + distanceFunction(reference[i], incoming[j]);
    }
  }

  let i = reference.length - 1;
  let j = incoming.length - 1;
  const path: [number, number][] = [[i, j]];
  while (i > 0 || j > 0) {
    if (i > 0) {
      if (j > 0) {
        if (matrix[i - 1][j] < matrix[i - 1][j - 1]) {
          if (matrix[i - 1][j] < matrix[i][j - 1]) {
            path.push([i - 1, j]);
            i--;
          } else {
            path.push([i, j - 1]);
            j--;
          }
        } else {
          if (matrix[i - 1][j - 1] < matrix[i][j - 1]) {
            path.push([i - 1, j - 1]);
            i--;
            j--;
          } else {
            path.push([i, j - 1]);
            j--;
          }
        }
      } else {
        path.push([i - 1, j]);
        i--;
      }
    } else {
      path.push([i, j - 1]);
      j--;
    }
  }
  path.reverse();

  const distance = matrix[reference.length - 1][incoming.length - 1];

  return {
    distance,
    path,
    matrix,
  };
};

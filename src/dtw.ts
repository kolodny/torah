// Adapted from https://github.com/GordonLesti/dynamic-time-warping

export const dtw = <Reference, Incoming = Reference>(
  reference: Reference[],
  incoming: Incoming[],
  distanceFunction: (a: Reference, b: Incoming) => number
) => {
  const penalty = 0;
  const matrix: number[][] = [];
  for (let i = 0; i < reference.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < incoming.length; j++) {
      let cost = Infinity;

      if (i > 0 && j > 0) {
        // Diagonal move
        cost = Math.min(cost, matrix[i - 1][j - 1]);
      }

      if (i > 0) {
        // Vertical move
        cost = Math.min(cost, matrix[i - 1][j] + penalty);
      }

      if (j > 0) {
        // Horizontal move
        cost = Math.min(cost, matrix[i][j - 1] + penalty);
      }

      if (i === 0 && j === 0) {
        // Starting cell
        cost = 0;
      }

      matrix[i][j] = cost + distanceFunction(reference[i], incoming[j]);

      // Add a large penalty to the last row and column (but not the last cell).
      if (
        (i == reference.length - 1 || j == incoming.length - 1) &&
        (i != reference.length - 1 || j != incoming.length - 1)
      ) {
        // matrix[i][j] += 1000;
      }
    }
  }

  // matrix[3][1] = 40;

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

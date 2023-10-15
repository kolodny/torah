// Adapted from https://github.com/GordonLesti/dynamic-time-warping

export const dtw = <T>(
  ts1: T[],
  ts2: T[],
  distanceFunction: (a: T, b: T) => number
) => {
  const ser1 = ts1;
  const ser2 = ts2;
  const distFunc = distanceFunction;

  const matrix: number[][] = [];
  for (let i = 0; i < ser1.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < ser2.length; j++) {
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
      matrix[i][j] = cost + distFunc(ser1[i], ser2[j]);
    }
  }

  let path: [number, number][] = [];

  const distance = matrix[ser1.length - 1][ser2.length - 1];

  let i = ser1.length - 1;
  let j = ser2.length - 1;
  path = [[i, j]];
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
  path = path.reverse();

  return {
    distance,
    path,
    matrix,
  };
};

import { Worker } from "worker_threads";
import { readFileSync } from "fs";

/**
 * This function is used to return a levenshtein's distance
 * between two given strings.
 *
 * @param strA The first argument for comparison
 * @param strB The second argument for comparison
 */
export function levenshtein(strA: string, strB: string): number {
  if (strA === strB) return 0;
  if (strA !== strB && strA.toLowerCase() === strB.toLowerCase()) return 1;

  let v0: number[] = [];
  let v1: number[] = [];

  // initialize v0 (the previous row of distances)
  // this row is A[0][i]: edit distance for an empty s
  // the distance is just the number of characters to delete from t

  for (let i = 0; i <= strB.length; i++) {
    v0[i] = i;
  }

  for (let i = 0; i <= strA.length - 1; i++) {
    // calculate v1 (current row distances) from the previous row v0

    // first element of v1 is A[i+1][0]
    //   edit distance is delete (i+1) chars from s to match empty t
    v1[0] = i + 1;

    for (let j = 0; j <= strB.length - 1; j++) {
      const delCost: number = v0[j + 1] + 1;
      const insertCost: number = v1[j] + 1;
      const substitutionCost: number = strA[i] === strB[j] ? v0[j] : v0[j] + 1;

      v1[j + 1] = Math.min(delCost, insertCost, substitutionCost);
    }

    const p = Array.from(v1);
    v1 = v0;
    v0 = p;
    // [v0, v1] = [v1, v0];
  }

  return v0[strB.length];
}

/**
 *
 * This function calculates the distance between giveString and each string in dictionary
 * array and returns the closest string from dictionary array.
 *
 * @param givenString A string for which the lowest levenshtein distance will be found
 * @param dictionary An array in which to look for the string closest to givenString
 */
export function levenshteinOnArray(
  givenString: string,
  dictionary: string[]
): { value: string; distance: number } | null {
  if (!Array.isArray(dictionary)) return null;
  if (dictionary.filter(e => typeof e !== 'string').length > 0) return null;
  if (dictionary.length === 0) return null;

  let closestMatch = {
    value: dictionary[0],
    distance: Math.max(dictionary[0].length, givenString.length)
  };

  for (let i = 0; i < dictionary.length; i++) {
    const distanceI = levenshtein(givenString, dictionary[i]);
    if (distanceI < closestMatch.distance) {
      closestMatch = {
        value: dictionary[i],
        distance: distanceI
      };
    }
  }

  return closestMatch;
}

export async function levenshteinOnArrayAsync(
  givenString: string,
  dictionary: string[]
): Promise<{
  value: string;
  distance: number;
} | null> {
  return new Promise((resolve, reject) => {
    let completed = 0;
    const workers = [];

    if (!Array.isArray(dictionary)) resolve(null);
    if (dictionary.filter(e => typeof e !== 'string').length > 0) resolve(null);
    if (dictionary.length === 0) resolve(null);
  
    let closestMatch = {
      value: dictionary[0],
      distance: Math.max(dictionary[0].length, givenString.length)
    };

    const workersCount = require("os").cpus().length;

    const splitIntoChunksBy = Math.ceil(dictionary.length / workersCount);

    let i, j;

    const chunks = [];
    for (i = 0, j = dictionary.length; i < j; i += splitIntoChunksBy) {
      const chunk = dictionary.slice(i, i + splitIntoChunksBy);
      chunks.push(chunk);
    }

    for (let i = 0; i < chunks.length; i++) {
      const worker = new Worker(
        readFileSync(__dirname + "/worker.js", "utf-8"),
        {
          eval: true,
          workerData: {
            path: __dirname,
            givenString,
            dictionary: chunks[i]
          }
        }
      );

      worker.on("message", msg => {
        switch (msg.type) {
          case "finished":
            completed++;
            if (closestMatch.distance >= msg.payload.distance) {
              closestMatch = msg.payload;
            }
            if (completed === chunks.length) {
              resolve(closestMatch);
            }
            break;
          default:
          // do-nothing
        }
      });

      worker.on("exit", code => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });

      workers.push(worker);
    }
  });
}

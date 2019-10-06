import { readFileSync } from "fs";

namespace Levenshteiner {
  const isNode: boolean =
    typeof process !== "undefined" &&
    process.versions != null &&
    process.versions.node != null &&
    Number.parseInt(process.version.split(".")[0].replace('v', '')) >= 12;

  const workers: any[] = [];
  const workersCount = require("os").cpus().length;
  if (isNode) {
    const { Worker } = require("worker_threads");
    for (let i = 0; i < workersCount; i++) {
      const worker = new Worker(
        readFileSync(__dirname + "/worker.js", "utf-8"),
        {
          eval: true,
          workerData: {
            path: __dirname
          }
        }
      );

      workers.push(worker);
    }
  }

  export function killWorkers() {
    if (isNode) {
      workers.forEach(worker => worker.terminate());
      console.log('killed');
    }
  }

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
        const substitutionCost: number =
          strA[i] === strB[j] ? v0[j] : v0[j] + 1;

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
    if (dictionary.filter(e => typeof e !== "string").length > 0) return null;
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

  /**
   * This function runs prestarted workers which then each compute closest match for each chunk
   * and merges them to get the total best one.
   *
   * @param givenString String which is used as comparison base.
   * @param chunks Array of string[] arrays each of which is a separate chunk to compare.
   */
  async function levenshteinArrayWorker(
    givenString: string,
    chunks: string[][]
  ): Promise<{
    value: string;
    distance: number;
  } | null> {
    return new Promise((resolve, reject) => {
      let closestMatch: {
        value: string;
        distance: number;
      } | null = null;

      let completed = 0;

      for (let i = 0; i < chunks.length; i++) {
        workers[i].on("message", (msg: { type: string; payload: any }) => {
          switch (msg.type) {
            case "finished":
              completed++;
              if (
                !closestMatch ||
                closestMatch.distance >= msg.payload.distance
              ) {
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

        workers[i].on("exit", (code: number) => {
          if (code !== 0)
            reject(new Error(`Worker stopped with exit code ${code}`));
        });

        workers[i].postMessage({
          givenString,
          dictionary: chunks[i]
        });
      }
    });
  }

  async function levenshteinArrayPromises(
    givenString: string,
    chunks: string[][]
  ): Promise<{
    value: string;
    distance: number;
  } | null> {
    return new Promise((resolve, reject) => {
      const promises: Promise<{ value: string; distance: number } | null>[] = [];

      chunks.forEach((chunk: string[]) => {
        promises.push(new Promise ((resolve, reject) => {
          const result = levenshteinOnArray(givenString, chunk);
          resolve(result);
        }));
      });

      Promise
        .all(promises)
        .then(results => {
          console.log(results);
          let bestMatch: { value: string; distance: number } | null = null;
          results.forEach((result: { value: string; distance: number } | null) => {
            if (!bestMatch || (result && bestMatch.distance > result.distance)) bestMatch = result;
          })
          resolve(bestMatch);
        });
    });
  }

  /**
   * This function calculates the distance between giveString and each string in dictionary
   * array and returns the closest string from dictionary array. Unlike the levenshteinOnArray
   * it uses either Worker Threads (if run on Node.js 12+) or with Promises (if run in browser or
   * earlier version of Node.js)
   *
   * @param givenString A string for which the lowest levenshtein distance will be found
   * @param dictionary An array in which to look for the string closest to givenString
   */
  export async function levenshteinOnArrayAsync(
    givenString: string,
    dictionary: string[]
  ): Promise<{
    value: string;
    distance: number;
  } | null> {
    return new Promise(async (resolve, reject) => {
      let completed = 0;

      if (!Array.isArray(dictionary)) resolve(null);
      if (dictionary.filter(e => typeof e !== "string").length > 0)
        resolve(null);
      if (dictionary.length === 0) resolve(null);

      const chunksCount = Math.min(dictionary.length, workersCount);
      const chunkSize = Math.ceil(dictionary.length / chunksCount);

      let i, j;

      const chunks = [];
      for (i = 0, j = dictionary.length; i < j; i += chunkSize) {
        const chunk = dictionary.slice(i, i + chunkSize);
        chunks.push(chunk);
      }
      
      let closestMatch: {
        value: string;
        distance: number;
      } | null;
      
      if (isNode) {
        closestMatch = await levenshteinArrayWorker(givenString, chunks);
      } else {
        closestMatch = await levenshteinArrayPromises(givenString, chunks);
      }

      resolve(closestMatch);
    });
  }
}

/**
 * This function calculates the distance between giveString and each string in dictionary
 * array and returns the closest string from dictionary array. Unlike the levenshteinOnArray
 * it uses either Worker Threads (if run on Node.js 12+) or with Promises (if run in browser or
 * earlier version of Node.js)
 *
 * @param givenString A string for which the lowest levenshtein distance will be found
 * @param dictionary An array in which to look for the string closest to givenString
 */
export async function levenshteinOnArrayAsync(
  givenString: string,
  dictionary: string[]
): Promise<{
  value: string;
  distance: number;
} | null> {
  return await Levenshteiner.levenshteinOnArrayAsync(givenString, dictionary);
}

/**
 * This function calculates the distance between giveString and each string in dictionary
 * array and returns the closest string from dictionary array.
 *
 * @param givenString A string for which the lowest levenshtein distance will be found
 * @param dictionary An array in which to look for the string closest to givenString
 */
export function levenshteinOnArray(
  givenString: string,
  dictionary: string[]
): {
  value: string;
  distance: number;
} | null {
  return Levenshteiner.levenshteinOnArray(givenString, dictionary);
}

/**
 * This function is used to return a levenshtein's distance
 * between two given strings.
 *
 * @param strA The first argument for comparison
 * @param strB The second argument for comparison
 */
export function levenshtein(strA: string, strB: string): number {
  return Levenshteiner.levenshtein(strA, strB);
}

export function killWorkers() {
  return Levenshteiner.killWorkers();
}
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";

if (!isMainThread && parentPort) {
  const data = workerData;
  const { levenshteinOnArray } = require(__dirname + "/lib/src/index");
  const bestMatch = levenshteinOnArray(data.givenString, data.dictionary);
  parentPort.postMessage({ type: "finished", payload: bestMatch });
}

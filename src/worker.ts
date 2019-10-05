import { Worker, isMainThread, parentPort, workerData } from "worker_threads";

if (!isMainThread && parentPort) {
  const data = workerData;
  const { levenshteinOnArray } = require(data.path + "/index");
  const bestMatch = levenshteinOnArray(data.givenString, data.dictionary);
  parentPort.postMessage({ type: "finished", payload: bestMatch });
}

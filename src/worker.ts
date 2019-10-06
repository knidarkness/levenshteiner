import { Worker, isMainThread, parentPort, workerData } from "worker_threads";

if (!isMainThread && parentPort) {
  parentPort.on("message", data => {
    const { levenshteinOnArray } = require(workerData.path + "/index");
    const bestMatch = levenshteinOnArray(data.givenString, data.dictionary);
    if (parentPort)
      parentPort.postMessage({ type: "finished", payload: bestMatch });
  });
}

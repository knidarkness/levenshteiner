import { levenshteinOnArrayAsync, levenshteinOnArray, levenshtein, killWorkers } from "./index";

levenshteinOnArrayAsync("tst", ["test", "worooos"]).then(r => {
  console.log("done");
  console.log(r);
  killWorkers();
});

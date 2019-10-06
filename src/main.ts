import { levenshteinOnArrayAsync, levenshteinOnArray, levenshtein } from "./index";

levenshteinOnArrayAsync("tst", ["test", "worooos"]).then(r => {
  console.log("done");
  console.log(r);
  levenshteinOnArrayAsync("vale", ["value", "google", "facebook"]).then(res => {
    console.log("again");
    console.log(res);
    process.exit(0);
  });
});

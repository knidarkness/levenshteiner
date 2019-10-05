# Levenshteiner

[![Build Status](https://travis-ci.org/knidarkness/levenshteiner.svg?branch=master)](https://travis-ci.org/knidarkness/levenshteiner) ![Bundle Size](https://img.shields.io/bundlephobia/min/levenshteiner) ![Required Node](https://img.shields.io/node/v/levenshteiner) ![License](https://img.shields.io/npm/l/levenshteiner)

## TL;DR

This is one of the fastest levenstein parsers available today for the Node.js. It utilizes features of `worker_threads` module which is released with Node.js 12+. It becomes LTS version of Node on October 2019, so you should be able to use this package in production right now.

## Usage

This package provides three main methods:
- `levenshtein(strA: string, strB: string)` which calculates Levenshtein distance between two strings
- `levenshteinOnArray(givenString: string, dictionary: string[])` which finds the item in `dictionary` with the lowest distance to `givenString`
- `levenshteinOnArrayAsync(givenString: string, dictionary: string[])` which also finds the closest to the `givenString` value from the `dictionary` array. However, this method utilizes `worker_threads` to parallelize calculations, so performance is significantly better with new threds capability of Node.js

## License

This package is released under the MIT License.
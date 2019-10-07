# Levenshteiner

![Version](https://img.shields.io/npm/v/levenshteiner) [![Build Status](https://travis-ci.org/knidarkness/levenshteiner.svg?branch=master)](https://travis-ci.org/knidarkness/levenshteiner) ![Bundle Size](https://img.shields.io/bundlephobia/min/levenshteiner) ![Required Node](https://img.shields.io/node/v/levenshteiner) ![License](https://img.shields.io/npm/l/levenshteiner)

## TL;DR

This is one of the fastest packages to calculate Levenshtein distance available today for the Node.js. It utilizes features of `worker_threads` module which is released with Node.js 12+. It becomes LTS version of Node on October 2019, so you should be able to use this package in production right now.

## Installation

Just run `npm install --save levenshteiner` or `yarn add levenshteiner` and you should be ready to go. To use the package in your app, import is as 

`import 

## Usage

This package provides three main methods:
- `levenshtein(strA: string, strB: string): number` which calculates Levenshtein distance between two strings. 
- `levenshteinOnArray(givenString: string, dictionary: string[]): { value: string, distance: number} | null` which finds the item in `dictionary` with the lowest distance to `givenString`
- `levenshteinOnArrayAsync(givenString: string, dictionary: string[]): Promise<{value: string, distance: number} | null>` which also finds the closest to the `givenString` value from the `dictionary` array. However, this method utilizes `worker_threads` to parallelize calculations, so performance is significantly better with new threds capability of Node.js

Two last methods will return `null` in case if `dictionary` is not an Array of non-zero length all elements of which are strings.

## License

This package is released under the MIT License.
# npm SHA-256 Hash Fetcher

A lightweight, zero-dependency JavaScript library to fetch the latest version
and SHA-256 file hashes for npm packages using the jsDelivr API.

## Features

- Fetches the latest resolved version of any npm package.
- Gets the SHA-256 hash for a specific file within a package.
- Returns hashes for all files if only a package name is provided.
- Handles single string or an array of resource paths as input.
- Converts the base64 hash from jsDelivr to a standard hex SHA-256 string.

## Installation

This is a JavaScript ES module. You can import it directly into your project.

```bash
npm install npm-sha256-hash-fetcher
```

## Usage

Import the `NPMSHA256HashFetcher` class and create a new instance.

```js
import { NPMSHA256HashFetcher } from './index.js';

const fetcher = new NPMSHA256HashFetcher();
```

### Example 1: Get hash for a single, specific file

```js
try {
  const resource = 'react/cjs/react.production.js';
  const results = await fetcher.getHexHashForResource(resource);

  // results is an array of Promise.allSettled results
  if (results[0].status === 'fulfilled') {
    console.log(results[0].value);
  }
} catch (e) {
  console.error(e);
}

/* Expected Output (for Example 1):
{
  "input": "react/cjs/react.production.js",
  "packageName": "react",
  "filePath": "/cjs/react.production.js",
  "latestVersion": "18.3.1",
  "base64Hash": "x30nS/L2bN2nUu2u/mJtTjSw+b8nNlFkMv4s2l3d3bY=",
  "hexHash": "c77d274bf2f66cdb6952edadf989b538d2c3e6ff2736516432fe2cdad77775b6"
}
*/
```

### Example 2: Get all files for a package

```js
try {
  const resource = 'vue'; // Just the package name
  const results = await fetcher.getHexHashForResource(resource);

  if (results[0].status === 'fulfilled') {
    console.log(results[0].value);
  }
} catch (e) {
  console.error(e);
}

/*
Expected Output (for Example 2):
{
  "input": "vue",
  "packageName": "vue",
  "latestVersion": "3.4.30",
  "files": [
    {
      "path": "/README.md",
      "size": 523,
      "base64Hash": "...",
      "hexHash": "..."
    },
    {
      "path": "/dist/vue.cjs.js",
      "size": 542718,
      "base64Hash": "...",
      "hexHash": "..."
    },
    // ... all other files
  ]
}
*/
```

### Example 3: Get multiple resources at once

```js
try {
  const resources = ['lodash/debounce.js', 'react', 'invalid/package/path'];

  const results = await fetcher.getHexHashForResource(resources);

  // results is an array: [fulfilled, fulfilled, rejected]
  console.log(JSON.stringify(results, null, 2));
} catch (e) {
  console.error(e);
}
```

## API

`getHexHashForResource(resources)`

This is the main method for the library.

`resources: string | string[]`

- A single resource string (e.g., `"react/cjs/react.production.js"`)
  - OR a single package name (e.g., `"react"`)
  - OR an array of resource strings (e.g., ["react", "vue/dist/vue.js"])
- Returns: `Promise<Array<object>>`
  - A `Promise` that resolves to an array of `Promise.allSettled` result
    objects. Each object will have a status(`"fulfilled"` or `"rejected"`).
  - If `"fulfilled"`, the value will be an object containing the hash data.
  - If `"rejected"`, the reason will be an `Error` object.

## License

Apache 2.0

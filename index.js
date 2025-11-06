/**
 * -----------------------------------------------------------------
 * npm SHA-256 Hash
 * -----------------------------------------------------------------
 * This library provides functions to fetch file hashes from npm
 * packages using the jsDelivr API.
 */

export class NPMSHA256HashFetcher {
  constructor() {
    this.apiBase = 'https://data.jsdelivr.com/v1';
  }

  /**
   * Parses the input path into package name and file path.
   * @param {string} inputPath - The full resource path (e.g., "react/cjs/react.production.js")
   * @returns {{packageName: string, filePath: string} | null}
   */
  parseInput(inputPath) {
    if (!inputPath || typeof inputPath !== 'string') {
      return null;
    }

    const parts = inputPath.trim().split('/');
    let packageName;
    let filePath = null; // Default to null (all files)

    if (parts[0].startsWith('@')) {
      // Scoped package
      if (parts.length < 2) return null; // Invalid, e.g., "@scope"
      packageName = `${parts[0]}/${parts[1]}`;
      if (parts.length > 2) {
        filePath = `/${parts.slice(2).join('/')}`;
      }
    } else {
      // Unscoped package
      if (parts.length < 1) return null; // Empty string
      packageName = parts[0];
      if (parts.length > 1) {
        filePath = `/${parts.slice(1).join('/')}`;
      }
    }

    return { packageName, filePath };
  }

  /**
   * Fetches the resolved "latest" version for a given npm package.
   * @param {string} packageName - The name of the npm package (e.g., "react" or "@angular/core")
   * @returns {Promise<string>} - The latest version string (e.g., "18.2.0")
   */
  async getLatestVersion(packageName) {
    const url = `${this.apiBase}/packages/npm/${packageName}/resolved`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Package not found (${response.status})`);
    }
    const data = await response.json();
    if (!data.version) {
      throw new Error('Could not resolve latest version for package.');
    }
    return data.version;
  }

  /**
   * Fetches the full file list for a specific package version.
   * @param {string} packageName - The name of the npm package
   * @param {string} version - The exact package version
   * @returns {Promise<Array<object>>} - An array of file objects
   */
  async getPackageFiles(packageName, version) {
    const url = `${this.apiBase}/packages/npm/${packageName}@${version}?structure=flat`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Could not fetch file list for ${packageName}@${version} (${response.status})`
      );
    }

    const data = await response.json();
    if (!data.files || !Array.isArray(data.files)) {
      throw new Error('Invalid file list format received from API.');
    }
    return data.files;
  }

  /**
   * Finds a specific file's hash from a file list.
   * @param {Array<object>} filesData - The array of file objects.
   * @param {string} filePath - The full path to the file to find.
   * @returns {string} - The base64-encoded hash.
   */
  findFileHash(filesData, filePath) {
    const file = filesData.find(
      (f) => f.name.toLowerCase() === filePath.toLowerCase()
    );

    if (!file) {
      throw new Error(`File not found: ${filePath}`);
    }

    if (!file.hash) {
      throw new Error(`Hash not found for file: ${filePath}`);
    }

    return file.hash;
  }

  /**
   * Converts a base64-encoded hash into a hex-encoded string.
   * @param {string} base64Hash - The base64-encoded hash
   * @returns {string} - The hex-encoded string
   */
  base64ToHex(base64Hash) {
    try {
      const binaryString = atob(base64Hash);
      const hex = Array.from(binaryString, (c) =>
        c.charCodeAt(0).toString(16).padStart(2, '0')
      ).join('');
      return hex;
    } catch (e) {
      throw new Error(`Failed to convert base64 to hex: ${e.message}`);
    }
  }

  /**
   * Main function to orchestrate the entire process.
   * Can handle a single resource path or just a package name.
   * @param {string} resourcePath - Full resource path (e.g., "react/cjs/react.production.js") OR just a package name (e.g., "react")
   * @returns {Promise<object>} - An object containing the final results
   */
  async _getHexHashForResource(resourcePath) {
    const parsed = this.parseInput(resourcePath);
    if (!parsed) {
      throw new Error(
        "Invalid input path. Format: 'package/file/path.js' or '@scope/package/file/path.js'"
      );
    }

    const { packageName, filePath } = parsed;

    const version = await this.getLatestVersion(packageName);
    const allFiles = await this.getPackageFiles(packageName, version);

    // Case 1: Only package name was provided, return all files
    if (!filePath) {
      const filesWithHexHash = allFiles.map((file) => ({
        path: file.name,
        size: file.size,
        base64Hash: file.hash,
        hexHash: this.base64ToHex(file.hash),
      }));

      return {
        input: resourcePath,
        packageName,
        latestVersion: version,
        files: filesWithHexHash,
      };
    }

    // Case 2: A specific file was requested
    const base64Hash = this.findFileHash(allFiles, filePath);
    const hexHash = this.base64ToHex(base64Hash);

    return {
      input: resourcePath,
      packageName,
      filePath,
      latestVersion: version,
      base64Hash,
      hexHash,
    };
  }

  /**
   * Main function to orchestrate the entire process.
   * Can handle a single resource path or an array of resource paths.
   * @param {string|string[]} resources - A single resource path (e.g., "react") or an array (e.g., ["react", "vue/dist/vue.js"])
   * @returns {Promise<Array<object>>} - An array of Promise.allSettled results.
   */
  async getHexHashForResource(resources) {
    const paths = Array.isArray(resources) ? resources : [resources];

    if (paths.length === 0) {
      return [];
    }

    const results = await Promise.allSettled(
      paths.map((path) => this._getHexHashForResource(path))
    );

    return results;
  }
}

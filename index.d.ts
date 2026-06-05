/**
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParsedInput {
  packageName: string;
  version: string | null;
  filePath: string | null;
}

export interface FileEntry {
  name: string;
  hash: string;
  size: number;
}

export interface FileWithHexHash {
  path: string;
  size: number;
  base64Hash: string;
  hexHash: string;
}

export interface SingleFileResult {
  input: string;
  packageName: string;
  filePath: string;
  latestVersion: string;
  base64Hash: string;
  hexHash: string;
}

export interface AllFilesResult {
  input: string;
  packageName: string;
  latestVersion: string;
  files: FileWithHexHash[];
}

export type ResourceResult = SingleFileResult | AllFilesResult;

export class NPMSHA256HashFetcher {
  readonly apiBase: string;

  parseInput(inputPath: string): ParsedInput | null;

  getLatestVersion(packageName: string): Promise<string>;

  getPackageFiles(packageName: string, version: string): Promise<FileEntry[]>;

  findFileHash(filesData: FileEntry[], filePath: string): string;

  base64ToHex(base64Hash: string): string;

  getHexHashForResource(
    resources: string | string[]
  ): Promise<Array<PromiseSettledResult<ResourceResult>>>;
}

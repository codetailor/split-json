'use strict';

import * as JSONStream from 'JSONStream';
import * as es from 'event-stream';

import * as fs from 'fs';
import * as path from 'path';

/**
 * Split large JSON file into smaller part files
 *
 * @arg inputFilePath {string} Path to the large JSON file
 * @arg outputFolder {string} Path to the folder for the part files
 * @arg outputPrefix {string} Prefix for the part filenames
 * @arg maxItemsPerFile {number} (optional) Maximum number of items in each part file (default: 10000)
 * @arg minPartNumberLength {number} (optional) Minimum length of the part file number (ex: 4 -> 0001) (default: 4)
 */
export default function split(inputFilePath: string, outputFolder: string, outputPrefix: string, maxItemsPerFile: number = 10_000, minPartNumberLength: number = 4) {
  return new Promise((resolve, reject) => {
	if (!fs.existsSync(inputFilePath)) { return reject('Input file not found'); }

    const fileStream = fs.createReadStream(inputFilePath, 'utf-8');
    const jsonParser = JSONStream.parse('*', null);

	if (!fs.existsSync(outputFolder)) { fs.mkdirSync(outputFolder, { recursive: true }); }

    let list: any[] = [];
    let partNumber: number = 1;

    const writeToFile = (content: string) => fs.writeFileSync(path.join(outputFolder, outputPrefix + ('' + partNumber).padStart(minPartNumberLength, '0') + '.json'), content);

    fileStream.pipe(jsonParser).pipe(
      es.mapSync((item: any) => {
        list.push(item);
        if (list.length >= maxItemsPerFile) {
          writeToFile(JSON.stringify(list));
          list = [];
          partNumber++;
        }
        return item;
      }),
    );

    fileStream.on('end', () => {
      if (list.length > 0) {
        writeToFile(JSON.stringify(list));
      }

      return resolve(null);
    });

    fileStream.on('error', reject);
  });
}

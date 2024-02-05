const fs = require('fs');
const fastcsv = require('fast-csv');
const bfj = require('bfj');

function flattenJson(obj, parentKey = '', result = {}) {
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            let propName = parentKey ? parentKey + '_' + key : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                flattenJson(obj[key], propName, result);
            } else {
                result[propName] = obj[key];
            }
        }
    }
    return result;
}

async function processJsonToCsv(jsonFilePath, csvFilePath) {
    const writeStream = fs.createWriteStream(csvFilePath);
    const csvStream = fastcsv.format({ headers: true });
    csvStream.pipe(writeStream);

    try {
        await bfj.walk(jsonFilePath, {
            bfj: {
                yieldRate: 16384,  // Adjust yield rate as needed for performance
                highWaterMark: 1024 * 1024  // Adjust buffer size as needed
            }
        })
        .on('data', (node) => {
            if (node.path.length === 0 && node.type === 'object') {
                // Flatten and write each object to CSV
                csvStream.write(flattenJson(node.value));
            }
        })
        .on('end', () => {
            console.log('JSON processing complete. CSV file created.');
            csvStream.end();
        });
    } catch (error) {
        console.error('Error processing JSON file:', error);
    }
}

processJsonToCsv('Level.sav.json', 'output.csv');

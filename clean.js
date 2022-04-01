const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const fileNames = fs.readdirSync(path.join(__dirname, 'output'))
const cleanFileNames = fileNames.filter(fileName => !fileName.includes('svg'))

for (let i = 0; i < cleanFileNames.length; i++) {
    if (i % 1000 == 0) {
        console.log(`${i} files processed of ${cleanFileNames.length}`)
    }

    sharp('./output/' + cleanFileNames[i])
        .resize(64, 64)
        .toFile(`./clean_output_small/${i}.jpg`)
}
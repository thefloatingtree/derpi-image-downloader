
const { Input } = require('enquirer')
const cliProgress = require('cli-progress');
const { default: axios } = require('axios');
const fs = require('fs');
const path = require('path');

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

function cleanTags(tagString) {
    return tagString
        .split(',')
        .filter((tag) => {
            return tag.length
        })
        .map((tag) => {
            return tag.toLowerCase().trim()
        })
        .join(',')
}

function getUrl(tags, minimumScore, currentPage) {
    return `https://derpibooru.org/api/v1/json/search/images?q=${cleanTags(tags + ",score.gte:" + minimumScore)}&page=${currentPage}&per_page=50`
}

async function getTotalImages(tags, minimumScore) {
    const response = await axios.get(getUrl(tags, minimumScore, 1))
    return response.data.total
}

async function getPage(tags, minimumScore, currentPage) {
    const response = await axios.get(getUrl(tags, minimumScore, currentPage))
    return response.data
}

async function downloadImage(imageData, outputDirectory) {
    const outputFilePath = path.resolve(__dirname, outputDirectory, imageData.id + '.' + imageData.format)

    const response = await axios.get(imageData.representations.thumb, { responseType: 'stream' }) 

    const writer = response.data.pipe(fs.createWriteStream(outputFilePath))

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    })
}

async function main() {
    const tags = await new Input({
        message: 'Tags',
        initial: 'pony, solo, safe'
    }).run()

    const minimumScore = await new Input({
        message: 'Minimum Score',
        initial: '100'
    }).run()

    const totalImages = await getTotalImages(tags, minimumScore)
    const totalPages = Math.ceil(totalImages / 50)

    loadingBar.start(totalImages, 0)

    for (let page = 1; page <= totalPages; page++) {
        const pageData = await getPage(tags, minimumScore, page)
 
        for (let i = 0; i < pageData.images.length; i++) {
            try {
                await downloadImage(pageData.images[i], './output')
                loadingBar.update((page - 1) * 50 + i)
            } catch { }
        }
    }

    loadingBar.stop()
}

main()
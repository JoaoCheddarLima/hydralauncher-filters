import 'dotenv/config';

import { writeFileSync } from 'fs';
import { millify } from 'millify';

import {
  GameMapMemory,
  HydraLinksResponse,
  ParsedGame,
  WrittenGameList,
} from './types';
import {
  extractGameJsonLinks,
  parseGameSize,
  write,
} from './utils';

const {
    FILTER: filter,
    BASE_URL: baseUrl
} = process.env

if (!filter || !baseUrl) {
    console.error("Please provide a filter and a base url")
    process.exit(1)
}

write(`🔍 Searching for games that match the filter: ${filter}`)

const labels = {
    processed: (url: string, i: number, length: number) => write(`✅ Processed (${url}) ${i} out of ${length} links`),
    noDownloads: (url: string) => write("\n\t❌ No downloads found in the link " + url),
    end: (length: number, total: number) => write(`\n📦\t${millify(length, { precision: 1 })} games that match: ${filter} filter out of ${millify(total, { precision: 2 })} found!`),
    savedAt: (path: string) => write(`🗃️\tSaved at: ${path}`)
}

function parseAndSaveData(mappedGames: Map<string, GameMapMemory>, allGames: ParsedGame[], totalGames: number) {
    mappedGames.forEach(({
        game
    }, name) => {
        allGames.push({
            title: name,
            fileSize: parseGameSize(game.fileSize)
        })
    })

    allGames.sort((a, b) => {
        return b.fileSize - a.fileSize
    })

    const writtenGames: WrittenGameList[] = allGames.map(e => {
        return {
            title: e.title,
            fileSize: String(e.fileSize.toFixed(2)) + " GB"
        }
    })

    const savePath = `./filters/${filter!.split(" ").join("-") + "_games.json"}`

    writeFileSync(savePath, JSON.stringify(writtenGames, null, 4))

    labels.end(allGames.length, totalGames)
    labels.savedAt(savePath)
}

fetch(baseUrl)
    .then(async res => {
        let website = await res.text()

        const linkList = extractGameJsonLinks(website)

        const mappedGames = new Map<string, GameMapMemory>()

        let allGames: ParsedGame[] = []
        let totalGames = 0

        let i = 0

        linkList.forEach(async link => {
            let y = 0
            const url = baseUrl + "/" + link
            const data: HydraLinksResponse = await (await fetch(url)).json()

            if (!data.downloads.length) return labels.noDownloads

            totalGames += data.downloads.length
            let filteredGames = data.downloads.filter(link => link.title.toLowerCase().includes(filter))

            i++
            labels.processed(url, i, linkList.length)

            if (i == linkList.length && !filteredGames.length) {
                parseAndSaveData(mappedGames, allGames, totalGames)
                return
            }

            filteredGames.forEach(async game => {
                const mappedGame = mappedGames.get(game.title)

                const gameTitle = game.title.slice(0, game.title.indexOf("("))
                    .trim()
                    .replace("’", "'")
                    .replace("–", "-")
                    .replace("-", "-")

                const gameUploadTime = new Date(game.uploadDate)

                if (!mappedGame) {
                    mappedGames.set(gameTitle, {
                        timestamp: gameUploadTime,
                        game
                    })
                } else {
                    if (gameUploadTime.getMilliseconds() > mappedGame.timestamp.getMilliseconds()) {
                        mappedGames.set(gameTitle, {
                            timestamp: gameUploadTime,
                            game
                        })
                    }
                }

                y++
                if (y === filteredGames.length) {
                    if (i !== linkList.length) return;

                    parseAndSaveData(mappedGames, allGames, totalGames)
                }
            })
        })
    })
import 'dotenv/config';

import {
  GameInterfaces,
  GameMapMemory,
  HydraLinksResponse,
  ParsedGame,
} from './types';
import {
  extractGameJsonLinks,
  filterGames,
  parseAndSaveData,
  readDataLocally,
  write,
} from './utils';
import { labels } from './utils/logging';

const {
    FILTER: filter,
    BASE_URL: baseUrl
} = process.env

if (!filter || !baseUrl) {
    console.error("Please provide a filter and a base url")
    process.exit(1)
}

write(`🔍 Searching for games that match the filter: ${filter}`)

function validateFilteredGames({
    filteredGames,
    allGames
}: {
    filteredGames: GameInterfaces[],
    allGames: GameInterfaces[]
}) {
    const allFilteredGames: ParsedGame[] = []
    const mappedGames: Map<string, GameMapMemory> = new Map()

    if (!filteredGames.length) {
        write("❌ No games found that match the filter")
        process.exit(1)
    }

    write(`✅ Found ${filteredGames.length} games that match the initial filter`)

    let y = 0
    filteredGames.forEach(async game => {
        const gameTitle = game.title.slice(0, game.title.indexOf("("))
            .trim()
            .replace("’", "'")
            .replace("–", "-")
            .replace("-", "-")

        const mappedGame = mappedGames.get(gameTitle)

        const gameUploadTime = new Date(game.uploadDate)

        if (!mappedGame) {
            mappedGames.set(
                gameTitle,
                {
                    timestamp: gameUploadTime,
                    game
                }
            )
        } else {
            if (gameUploadTime.getMilliseconds() > mappedGame.timestamp.getMilliseconds()) {
                mappedGames.set(
                    gameTitle,
                    {
                        timestamp: gameUploadTime,
                        game
                    }
                )
            }
        }

        y++
        if (y === filteredGames.length) {
            parseAndSaveData({
                filteredGames: allFilteredGames,
                allGames,
                mappedGames,
                filter: filter!
            })
        }
    })
}

async function main() {
    const cachedData = readDataLocally()?.games

    let allGames: GameInterfaces[] = cachedData || []

    if (cachedData) {
        write("📦 Found cached data, skipping the scraping process")
        return validateFilteredGames({
            filteredGames: filterGames(allGames, filter!),
            allGames
        })
    }

    const website = await (await fetch(baseUrl!)).text()

    const linkList = extractGameJsonLinks(website)

    let i = 0

    linkList.forEach(async link => {
        const url = baseUrl + "/" + link
        const data: HydraLinksResponse = await (await fetch(url)).json()

        if (!data.downloads.length) return labels.noDownloads(url)

        allGames = allGames.concat(data.downloads)

        i++
        labels.processed(url, i, linkList.length)

        if (i == linkList.length) validateFilteredGames({
            filteredGames: filterGames(allGames, filter!),
            allGames
        })
    })
}
main()
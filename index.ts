import 'dotenv/config';

import { scrapeHydra } from './scrapers/hydralinks';
import {
  GameInterfaces,
  GameMapMemory,
  ParsedGame,
} from './types';
import {
  filterGames,
  parseAndSaveData,
  readDataLocally,
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

write(`🔍 Searching for games that match the filter: "${filter}"`)

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

    const scrapedGames = await scrapeHydra()

    if (!scrapedGames) {
        write("❌ No games found")
        process.exit(1)
    }

    validateFilteredGames({
        filteredGames: filterGames(scrapedGames, filter!),
        allGames: scrapedGames
    })
}
main()
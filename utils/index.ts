import {
  readFileSync,
  writeFileSync,
} from 'fs';

import {
  CachedGamesData,
  GameInterfaces,
  GameMapMemory,
  ParsedGame,
  WrittenGameList,
} from '../types';
import { labels } from './logging';

export function saveDataLocally(data: GameInterfaces[]) {
    const cachedAt = Date.now()

    const cachedData = {
        cachedAt,
        games: data
    }

    writeFileSync('./cache/links.json', JSON.stringify(cachedData))

    write("🗃️\tSaved games on local cache")
}

export function filterGames(allGames: GameInterfaces[], filter: string) {
    return allGames.filter(game => game.title.toLowerCase().includes(filter))
}

export function readDataLocally(): CachedGamesData | null {
    let cacheUpdateTime = 1000 * 60 * 60 * 2 // 2 hours
    
    const now = Date.now()
    try {
        const cachedData: CachedGamesData = JSON.parse(readFileSync('./cache/links.json').toString())
        const cachedAt = cachedData.cachedAt

        if (now - cachedAt > cacheUpdateTime) {
            throw new Error("Cache outdated")
        }

        return cachedData
    } catch (err) {
        write("📂 Cache not found or outdated")
        return null
    }
}

export function extractGameJsonLinks(website: string) {
    let linkList: string[] = []

    const query = 'data-url="'

    while (website.includes(query)) {
        let start = website.indexOf(query) + query.length
        website = website.slice(start)

        let end = website.indexOf("\"")
        let link = website.slice(0, end)

        if (!link) continue

        if (link.endsWith(".json") && !linkList.includes(link)) {
            linkList.push(link)
        }
    }

    return linkList
}

export function parseGameSize(extension: string): number {
    let gameSize = parseFloat(extension.split(" ")[0])

    if (!extension.includes("GB")) {
        gameSize = gameSize / 1024
    }

    return gameSize
}

export function parseAndSaveData({
    filteredGames,
    mappedGames,
    allGames,
    filter
}: {
    filteredGames: ParsedGame[],
    allGames: GameInterfaces[],
    mappedGames: Map<string, GameMapMemory>,
    filter: string
}) {
    mappedGames.forEach(({
        game
    }, name) => {
        filteredGames.push({
            title: name,
            fileSize: parseGameSize(game.fileSize)
        })
    })

    filteredGames.sort((a, b) => {
        return b.fileSize - a.fileSize
    })

    const writtenGames: WrittenGameList[] = filteredGames.map(e => {
        return {
            title: e.title,
            fileSize: String(e.fileSize.toFixed(2)) + " GB"
        }
    })

    const savePath = `./filters/${filter!.split(" ").join("-") + "_games.json"}`

    writeFileSync(savePath, JSON.stringify(writtenGames, null, 4))
    saveDataLocally(allGames)

    labels.end(filteredGames.length, allGames.length, filter!)
    labels.savedAt(savePath)
}

export function write(text: string) {
    process.stdout.write(text + "\n")
}
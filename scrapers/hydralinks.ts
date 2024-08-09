import 'dotenv/config';

import {
  GameInterfaces,
  HydraLinksResponse,
} from '../types/index';
import {
  extractGameJsonLinks,
  saveDataLocally,
} from '../utils';
import { labels } from '../utils/logging';

const {
    BASE_URL: baseUrl
} = process.env

export async function scrapeHydra(): Promise<GameInterfaces[]> {
    const website = await (await fetch(baseUrl!)).text()

    let allGames: GameInterfaces[] = []

    const linkList = extractGameJsonLinks(website)
    let i = 0

    const promises: Promise<GameInterfaces[] | null>[] = []

    linkList.forEach(async link => {
        promises.push(new Promise(async (res, rej) => {
            try {
                const url = baseUrl + "/" + link
                const data: HydraLinksResponse = await (await fetch(url)).json()

                if (!data.downloads.length) {
                    labels.noDownloads(url)
                    throw new Error("No downloads found")
                }

                i++
                labels.processed(url, i, linkList.length)

                res(data.downloads)
            } catch (e) {
                rej()
            }
        }))
    })

    const results = (await Promise.allSettled(promises)).filter(e => e.status === "fulfilled").map(e => e.value)

    results.forEach(result => {
        if (!result) return;

        allGames = allGames.concat(result)
    })

    saveDataLocally(allGames)

    return allGames
}
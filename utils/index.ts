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

export function write(text: string) {
    process.stdout.write(text + "\n")
}
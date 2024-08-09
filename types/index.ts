export interface GameInterfaces {
    title: string
    uris: string[]
    uploadDate: Date
    fileSize: string
}

export interface CachedGamesData {
    cachedAt: number
    games: GameInterfaces[]
}

export interface ParsedGame {
    title: string
    fileSize: number
}

export interface WrittenGameList {
    title: string
    fileSize: string
}

export interface HydraLinksResponse {
    name: string,
    downloads: GameInterfaces[]
}

export interface GameMapMemory {
    timestamp: Date,
    game: GameInterfaces
}

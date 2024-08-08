export interface CrackGameInterfaces {
    title: string
    uris: string[]
    uploadDate: Date
    fileSize: string
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
    downloads: CrackGameInterfaces[]
}

export interface GameMapMemory {
    timestamp: Date,
    game: CrackGameInterfaces
}

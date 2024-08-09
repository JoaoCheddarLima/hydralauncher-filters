import { millify } from 'millify';

import { write } from './';

export const labels = {
    processed: (url: string, i: number, length: number) => write(`✅ Processed (${url}) ${i} out of ${length} links`),
    noDownloads: (url: string) => write("\n\t❌ No downloads found in the link " + url),
    end: (length: number, total: number, filter: string) => write(`\n📦\t${millify(length, { precision: 1 })} games that match: ${filter} filter out of ${millify(total, { precision: 2 })} found!`),
    savedAt: (path: string) => write(`🗃️\tSaved at: ${path}`)
}
/**
 * Just enough of an .xlsx reader for the bibliography import: every sheet, by name,
 * as rows of header -> text. No dependency -- an .xlsx is a zip of XML files,
 * and Node's zlib already inflates zip entries.
 */
import { inflateRawSync } from 'zlib'

export type Row = Record<string, string>

/** Every file in a zip, by path. */
function unzip(buffer: Buffer): Map<string, Buffer> {
  // The central directory is found from the End Of Central Directory record,
  // the last thing in the file (followed only by an optional comment).
  let eocd = buffer.length - 22
  while (eocd >= 0 && buffer.readUInt32LE(eocd) !== 0x06054b50) eocd--
  if (eocd < 0) throw new Error('Not an .xlsx file (no zip directory found).')

  const files = new Map<string, Buffer>()
  let at = buffer.readUInt32LE(eocd + 16)
  const count = buffer.readUInt16LE(eocd + 10)
  for (let i = 0; i < count; i++) {
    const method = buffer.readUInt16LE(at + 10)
    const size = buffer.readUInt32LE(at + 20)
    const nameLength = buffer.readUInt16LE(at + 28)
    const extraLength = buffer.readUInt16LE(at + 30)
    const commentLength = buffer.readUInt16LE(at + 32)
    const localHeader = buffer.readUInt32LE(at + 42)
    const name = buffer.toString('utf8', at + 46, at + 46 + nameLength)

    const dataStart =
      localHeader +
      30 +
      buffer.readUInt16LE(localHeader + 26) +
      buffer.readUInt16LE(localHeader + 28)
    const data = buffer.subarray(dataStart, dataStart + size)
    files.set(name, method === 8 ? inflateRawSync(data) : data)

    at += 46 + nameLength + extraLength + commentLength
  }
  return files
}

const decode = (xml: string) =>
  xml
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

/** The visible text of a string item: all its runs, without phonetic hints. */
const textOf = (xml: string) =>
  decode(
    [...xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
      .map((m) => m[1])
      .join(''),
  )

/** Each sheet's rows, keyed by the text in its first row. Empty rows are dropped. */
export function readWorkbook(file: Buffer): Map<string, Row[]> {
  const files = unzip(file)
  const read = (name: string) => files.get(name)?.toString('utf8') ?? ''

  const shared = [...read('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    textOf(m[1]),
  )

  // Sheet names live in workbook.xml; their file paths in its relationships.
  const targets = new Map(
    [...read('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b[^>]*>/g)].map((m) => [
      m[0].match(/Id="([^"]+)"/)![1],
      m[0].match(/Target="([^"]+)"/)![1].replace(/^\/?(xl\/)?/, 'xl/'),
    ]),
  )

  const sheets = new Map<string, Row[]>()
  for (const sheet of read('xl/workbook.xml').matchAll(/<sheet\b[^>]*>/g)) {
    const name = decode(sheet[0].match(/name="([^"]*)"/)![1])
    const target = targets.get(sheet[0].match(/r:id="([^"]+)"/)![1])!

    const grid = [...read(target).matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map((row) => {
      const cells: Record<string, string> = {}
      for (const cell of row[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const [, column, attributes, body = ''] = cell
        const value = body.match(/<v>([\s\S]*?)<\/v>/)?.[1]
        if (/t="s"/.test(attributes))
          cells[column] = value === undefined ? '' : shared[Number(value)]
        else if (/t="inlineStr"/.test(attributes)) cells[column] = textOf(body)
        else cells[column] = value === undefined ? '' : decode(value)
      }
      return cells
    })

    const [header = {}, ...rest] = grid
    sheets.set(
      name,
      rest
        .map((cells) => {
          const row: Row = {}
          for (const [column, title] of Object.entries(header)) {
            if (title.trim()) row[title.trim()] = (cells[column] ?? '').trim()
          }
          return row
        })
        .filter((row) => Object.values(row).some(Boolean)),
    )
  }
  return sheets
}

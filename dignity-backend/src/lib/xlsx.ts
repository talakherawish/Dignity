/**
 * Just enough .xlsx for the bibliography import and export: reading every
 * sheet, by name, as rows of header -> text, and writing sheets of text back
 * out. No dependency -- an .xlsx is a zip of XML files, and Node's zlib
 * already inflates and deflates zip entries.
 */
import { deflateRawSync, inflateRawSync } from 'zlib'

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

// ---------------------------------------------------------------------------
// Writing

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

/** A zip of the given files, each deflated. */
function zip(files: { name: string; data: Buffer }[]): Buffer {
  const local: Buffer[] = []
  const central: Buffer[] = []
  let offset = 0
  for (const file of files) {
    const name = Buffer.from(file.name, 'utf8')
    const compressed = deflateRawSync(file.data)
    const crc = crc32(file.data)

    const header = Buffer.alloc(30)
    header.writeUInt32LE(0x04034b50, 0)
    header.writeUInt16LE(20, 4) // version needed to extract
    header.writeUInt16LE(0x0800, 6) // file names are UTF-8
    header.writeUInt16LE(8, 8) // deflate
    header.writeUInt32LE(crc, 14)
    header.writeUInt32LE(compressed.length, 18)
    header.writeUInt32LE(file.data.length, 22)
    header.writeUInt16LE(name.length, 26)
    local.push(header, name, compressed)

    const entry = Buffer.alloc(46)
    entry.writeUInt32LE(0x02014b50, 0)
    entry.writeUInt16LE(20, 4) // version made by
    entry.writeUInt16LE(20, 6) // version needed to extract
    entry.writeUInt16LE(0x0800, 8)
    entry.writeUInt16LE(8, 10)
    entry.writeUInt32LE(crc, 16)
    entry.writeUInt32LE(compressed.length, 20)
    entry.writeUInt32LE(file.data.length, 24)
    entry.writeUInt16LE(name.length, 28)
    entry.writeUInt32LE(offset, 42)
    central.push(entry, name)

    offset += header.length + name.length + compressed.length
  }
  const directory = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...local, directory, end])
}

const escapeXml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // Control characters XML 1.0 cannot carry at all (stray ones pasted in
    // from other documents) would make Excel refuse the whole file.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')

/** "A", ..., "Z", "AA", ... -- the column letter for a 0-based index. */
function columnName(index: number): string {
  let name = ''
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name
  }
  return name
}

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
const MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const PACKAGE_RELS = 'http://schemas.openxmlformats.org/package/2006/relationships'
const DOC_RELS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const SHEET_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml'

function sheetXml(rows: string[][]): string {
  const cells = (row: string[], r: number) =>
    row
      .map((value, c) =>
        value
          ? `<c r="${columnName(c)}${r + 1}" t="inlineStr"${r === 0 ? ' s="1"' : ''}>` +
            `<is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`
          : '',
      )
      .join('')
  return (
    XML_HEAD +
    `<worksheet xmlns="${MAIN}">` +
    // The header row stays in view while scrolling.
    '<sheetViews><sheetView workbookViewId="0">' +
    '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
    '</sheetView></sheetViews>' +
    '<sheetData>' +
    rows.map((row, r) => `<row r="${r + 1}">${cells(row, r)}</row>`).join('') +
    '</sheetData></worksheet>'
  )
}

/**
 * An .xlsx of the given sheets, every cell plain text -- the same shape
 * `readWorkbook` reads, so a written file can be imported straight back.
 * Each sheet's first row is bold and frozen, as a header.
 */
export function writeWorkbook(sheets: { name: string; rows: string[][] }[]): Buffer {
  const files: { name: string; xml: string }[] = [
    {
      name: '[Content_Types].xml',
      xml:
        XML_HEAD +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        `<Override PartName="/xl/workbook.xml" ContentType="${SHEET_TYPE}.sheet.main+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="${SHEET_TYPE}.styles+xml"/>` +
        sheets
          .map(
            (_, i) =>
              `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="${SHEET_TYPE}.worksheet+xml"/>`,
          )
          .join('') +
        '</Types>',
    },
    {
      name: '_rels/.rels',
      xml:
        XML_HEAD +
        `<Relationships xmlns="${PACKAGE_RELS}">` +
        `<Relationship Id="rId1" Type="${DOC_RELS}/officeDocument" Target="xl/workbook.xml"/>` +
        '</Relationships>',
    },
    {
      name: 'xl/workbook.xml',
      xml:
        XML_HEAD +
        `<workbook xmlns="${MAIN}" xmlns:r="${DOC_RELS}"><sheets>` +
        sheets
          .map(
            (sheet, i) =>
              `<sheet name="${escapeXml(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
          )
          .join('') +
        '</sheets></workbook>',
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      xml:
        XML_HEAD +
        `<Relationships xmlns="${PACKAGE_RELS}">` +
        sheets
          .map(
            (_, i) =>
              `<Relationship Id="rId${i + 1}" Type="${DOC_RELS}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
          )
          .join('') +
        `<Relationship Id="rId${sheets.length + 1}" Type="${DOC_RELS}/styles" Target="styles.xml"/>` +
        '</Relationships>',
    },
    {
      // Two cell formats: 0 plain, 1 bold (the header row).
      name: 'xl/styles.xml',
      xml:
        XML_HEAD +
        `<styleSheet xmlns="${MAIN}">` +
        '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>' +
        '<font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
        '<fills count="2"><fill><patternFill patternType="none"/></fill>' +
        '<fill><patternFill patternType="gray125"/></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
        '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
        '</styleSheet>',
    },
    ...sheets.map((sheet, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      xml: sheetXml(sheet.rows),
    })),
  ]
  return zip(files.map((file) => ({ name: file.name, data: Buffer.from(file.xml, 'utf8') })))
}

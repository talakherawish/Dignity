/**
 * Fills the new Readings and Documents section (src/collections/Readings.ts)
 * with what the team already has:
 *
 * 1. The two readings from the old one-page-per-reading collection
 *    (`readings-documents`, no longer in the config but still in MongoDB) --
 *    Kant on Project Gutenberg -- moved into a "Philosophical Texts" subject.
 *    The old documents are left where they are.
 * 2. The Research Ethics Learning Platform's reference documents -- the
 *    Belmont Report, the Declaration of Helsinki and the Nuremberg Code, each
 *    in English with its Arabic translation, and the research ethics
 *    literature review -- uploaded into a "Research Ethics" subject.
 *
 * Everything is published, and the script is safe to run again: a subject is
 * found by its title, and a reading already in it (same title) is skipped.
 *
 * --target is required, so production is never written to by accident (see
 * scripts/import-bibliography.ts for what sandbox means):
 *
 *   npm run payload -- run scripts/set-up-readings.ts -- --target sandbox \
 *     --relp "C:/Users/tala/Desktop/dignity/Research & Activities/Research Projects/Research Ethics Learning Platform (RELP)/Reference Documents"
 */
import path from 'path'
import { retried } from '../src/lib/importShared'

const SANDBOX_DATABASE = 'dignity-sandbox'

function argument(name: string): string | undefined {
  const at = process.argv.indexOf(`--${name}`)
  return at === -1 ? undefined : process.argv[at + 1]
}

const target = argument('target')
const relp = argument('relp')
if ((target !== 'sandbox' && target !== 'production') || !relp) {
  console.error('Needs --target sandbox|production and --relp <Reference Documents folder>.')
  process.exit(1)
}

if (target === 'sandbox') {
  const url = new URL(process.env.DATABASE_URL ?? '')
  url.pathname = `/${SANDBOX_DATABASE}`
  process.env.DATABASE_URL = url.toString()
}

// Imported only now, so the config reads the DATABASE_URL set above.
const { getPayload } = await import('payload')
const { default: config } = await import('../src/payload.config')
const payload = await getPayload({ config })
console.log(`Writing to database "${payload.db.connection.name}" (${target})`)
if (target === 'sandbox' && payload.db.connection.name !== SANDBOX_DATABASE) {
  console.error('The sandbox URL did not take effect -- stopping before touching anything.')
  process.exit(1)
}

async function subject(title: string, titleAr: string): Promise<string> {
  const { docs } = await payload.find({
    collection: 'reading-lists',
    where: { title: { equals: title } },
    limit: 1,
    depth: 0,
  })
  if (docs[0]) return String(docs[0].id)
  const created = await retried(() =>
    payload.create({ collection: 'reading-lists', data: { title, titleAr } }),
  )
  console.log(`Created subject "${title}".`)
  return String(created.id)
}

async function upload(file: string, alt: string): Promise<string> {
  const media = await retried(() =>
    payload.create({ collection: 'media', data: { alt }, filePath: file }),
  )
  return String(media.id)
}

type Reading = Record<string, unknown> & { title: string }

async function add(subjectId: string, reading: Reading, files?: { file?: string; other?: string }) {
  const { totalDocs } = await payload.count({
    collection: 'readings',
    where: { and: [{ subject: { equals: subjectId } }, { title: { equals: reading.title } }] },
  })
  if (totalDocs) {
    console.log(`  already there: ${reading.title}`)
    return
  }
  const otherVersion = { ...((reading.otherVersion as object) ?? {}) } as Record<string, unknown>
  const data: Record<string, unknown> = { ...reading, subject: subjectId, _status: 'published' }
  if (files?.file) data.file = await upload(files.file, reading.title)
  if (files?.other) {
    otherVersion.file = await upload(files.other, String(otherVersion.title ?? reading.title))
  }
  if (Object.keys(otherVersion).length) data.otherVersion = otherVersion
  // Retried: Atlas refuses the first writes to a brand-new collection while it
  // is still creating it ("catalog changes"); see retried in importShared.ts.
  await retried(() => payload.create({ collection: 'readings', data: data as never }))
  console.log(`  added: ${reading.title}`)
}

// ── 1. The old readings ──────────────────────────────────────────────────────

const old = await payload.db.connection.db!.collection('readings-documents').find({}).toArray()
// What the old items were missing, filled in for the two that exist.
const known: Record<string, Partial<Reading>> = {
  'Perpetual Peace: A Philosophical Essay': { year: '1795' },
  'Fundamental Principles of the Metaphysic of Morals by Immanuel Kant': {
    title: 'Fundamental Principles of the Metaphysic of Morals',
    year: '1785',
  },
}
if (old.length) {
  const philosophy = await subject('Philosophical Texts', 'نصوص فلسفية')
  for (const doc of old) {
    const extra = known[doc.title] ?? {}
    const otherTitle = String(doc.titleAr ?? '').trim()
    await add(philosophy, {
      itemType: 'book',
      language: doc.language ?? 'en',
      title: doc.title,
      authors: doc.authors?.length
        ? doc.authors.map((a: { name: string }) => ({ name: a.name }))
        : [{ name: 'Immanuel Kant' }],
      source:
        doc.sourceName ||
        (String(doc.link ?? '').includes('gutenberg') ? 'Project Gutenberg' : undefined),
      year: doc.year || undefined,
      link: doc.link || undefined,
      file: doc.file || undefined,
      keywords: doc.keywords ?? [],
      note: doc.translator ? `Translated by ${doc.translator}.` : undefined,
      otherVersion:
        otherTitle || doc.linkAr || doc.fileAr
          ? {
              title: otherTitle || undefined,
              link: doc.linkAr || undefined,
              file: doc.fileAr || undefined,
            }
          : undefined,
      ...extra,
    } as Reading)
  }
}

// ── 2. The RELP reference documents ──────────────────────────────────────────

const en = (name: string) => path.join(relp, 'English', name)
const ar = (name: string) => path.join(relp, 'Arabic', name)
const ethics = await subject('Research Ethics', 'أخلاقيات البحث العلمي')

await add(
  ethics,
  {
    itemType: 'document',
    language: 'en',
    title:
      'The Belmont Report: Ethical Principles and Guidelines for the Protection of Human Subjects of Research',
    authors: [
      {
        name: 'National Commission for the Protection of Human Subjects of Biomedical and Behavioral Research',
      },
    ],
    source: 'U.S. Department of Health, Education, and Welfare',
    year: '1979',
    note: 'Part B: Basic Ethical Principles -- respect for persons, beneficence and justice.',
    otherVersion: {
      title:
        'تقرير بلمونت: المبادئ والمبادئ التوجيهية الأخلاقية لحماية البشر من مخاطر البحث العلمي',
    },
  },
  { file: en('Belmont Report En.pdf'), other: ar('Belmont Report Ar.pdf') },
)

await add(
  ethics,
  {
    itemType: 'document',
    language: 'en',
    title:
      'WMA Declaration of Helsinki: Ethical Principles for Medical Research Involving Human Subjects',
    authors: [{ name: 'World Medical Association' }],
    source: 'World Medical Association',
    year: '1964',
    note: 'Adopted in Helsinki in 1964; this text is as amended in Fortaleza, Brazil, in October 2013.',
    otherVersion: { title: 'إعلان هلسنكي: المبادئ الأخلاقية للبحوث الطبية التي تجرى على الإنسان' },
  },
  { file: en('Helsinki Declaration En.pdf'), other: ar('Helsinki Declaration Ar.pdf') },
)

await add(
  ethics,
  {
    itemType: 'document',
    language: 'en',
    title: 'The Nuremberg Code',
    source: 'Nuremberg Military Tribunals',
    year: '1947',
    note: 'Ten principles for permissible medical experiments on human beings, beginning with voluntary consent.',
    otherVersion: { title: 'كود نيورمبرج' },
  },
  { file: en('Nuremberg Code En.pdf'), other: ar('Nuremberg Code Ar.pdf') },
)

await add(
  ethics,
  {
    itemType: 'report',
    language: 'en',
    title: 'Research Ethics: A Review of Relevant Research Literature',
    authors: [{ name: 'Sunaina Maira' }],
    source: 'Birzeit University Research Ethics Committee',
    note: 'Commissioned in 2012 by Birzeit University’s Research Ethics Committee, with a focus on research ethics in the global South.',
  },
  { file: en('Research Ethics Literature Review.pdf') },
)

// ── 3. Arabic notes ──────────────────────────────────────────────────────────
// The notes above were first written in English only. Filled in where still
// empty, so an Arabic note an editor has since written or changed is kept.

const notesAr: Record<string, string> = {
  'The Belmont Report: Ethical Principles and Guidelines for the Protection of Human Subjects of Research':
    'الجزء الثاني: المبادئ الأخلاقية الأساسية -- احترام الأشخاص، والإحسان، والعدالة.',
  'WMA Declaration of Helsinki: Ethical Principles for Medical Research Involving Human Subjects':
    'اعتُمد في هلسنكي عام 1964؛ وهذا النص بصيغته المعدّلة في فورتاليزا، البرازيل، في تشرين الأول/أكتوبر 2013.',
  'The Nuremberg Code': 'عشرة مبادئ للتجارب الطبية المسموح بها على البشر، أولها الموافقة الطوعية.',
  'Research Ethics: A Review of Relevant Research Literature':
    'أعدّت بتكليف من لجنة أخلاقيات البحث العلمي في جامعة بيرزيت عام 2012، مع تركيز على أخلاقيات البحث في الجنوب العالمي.',
}
for (const [title, noteAr] of Object.entries(notesAr)) {
  const { docs } = await payload.find({
    collection: 'readings',
    where: { title: { equals: title } },
    limit: 1,
    depth: 0,
  })
  const reading = docs[0]
  if (!reading || reading.noteAr) continue
  await retried(() =>
    payload.update({ collection: 'readings', id: reading.id, data: { noteAr }, depth: 0 }),
  )
  console.log(`  Arabic note added: ${title}`)
}

console.log('Done.')
process.exit(0)

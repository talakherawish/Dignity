import { readFile } from 'node:fs/promises'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * One-time import of the awareness material from the initiative's previous
 * website (dignity.birzeit.edu) into the Publications collection.
 *
 * Titles follow the convention already established by the entries added by
 * hand: a natural Title Case English rendering alongside the exact Arabic
 * wording used on the source site, with the stored filename a clean English
 * name (e.g. "Women Work.pdf").
 *
 * Descriptions are written from the actual content of each document rather
 * than from its title — the brochures are designed graphics with no text
 * layer, so their pages were read directly to summarise what each one covers.
 *
 * Runs inside a Next request context on purpose: creating a Media document
 * fires the PDF thumbnail hook, which schedules its work with `after()` and
 * therefore cannot run from a standalone script.
 *
 *   GET /api/import-publications?secret=<BACKFILL_SECRET>&dryRun=1   preview
 *   GET /api/import-publications?secret=<BACKFILL_SECRET>            apply
 *
 * Safe to re-run: an item whose English title already exists is skipped.
 */
export const maxDuration = 300

const SOURCE = 'https://dignity.birzeit.edu'

type ImportItem = {
  /** Which publications collection the item belongs in. */
  type: 'brochures' | 'reports' | 'audiovisual'
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  author?: string
  authorAr?: string
  date?: string
  /** Path on the source site, downloaded and attached as the item's file. */
  sourcePath?: string
  /** Absolute path on this machine, for files supplied directly rather than
   *  fetched from the old website. */
  localPath?: string
  /** Filename to store it under, following the existing naming convention. */
  filename?: string
  /** For items that live elsewhere (YouTube) rather than as an upload. */
  link?: string
}

const ITEMS: ImportItem[] = [
  {
    type: 'brochures',
    title: "Women's Work",
    titleAr: 'عمل النساء',
    description:
      'A guide to the rights of women workers under Palestinian labour law: equal pay for work of equal value, working conditions and hours, occupational safety protections during pregnancy and after childbirth, and the leaves a woman worker is entitled to — annual, sick, bereavement, pilgrimage, and religious and national holidays.',
    descriptionAr:
      'دليل حول حقوق العاملات في قانون العمل الفلسطيني: المساواة في الأجر عن العمل المتساوي، وبيئة العمل وظروفه وساعاته، وإجراءات السلامة المهنية والحماية أثناء الحمل وبعد الولادة، والإجازات التي تستحقها العاملة — السنوية والمرضية وإجازة الوفاة والحج والأعياد الدينية والأيام الوطنية.',
    sourcePath: '/sites/default/files/downloads/2021-12/Unionawareness-Brochure-Women%20Work.pdf',
    filename: 'Women Work.pdf',
  },
  {
    type: 'brochures',
    title: 'Work in the Unregulated Sector',
    titleAr: 'العمل في القطاع غير المنظم',
    description:
      'An overview of informal employment in Palestine — work in establishments that are not officially registered and so fall outside state regulation, tax oversight, inspection, social protection and occupational safety requirements. Informal work accounted for 62.1% of total employment in 2020; the brochure sets out the sectors where women are concentrated and the violations they face, including the absence of contracts, wages below the legal minimum, and denial of maternity and sick leave.',
    descriptionAr:
      'نظرة عامة على العمل غير المنظم في فلسطين — العمل في منشآت غير مسجّلة رسمياً، خارج رقابة الدولة والسلطات الضريبية والتفتيش والحماية الاجتماعية وشروط السلامة والصحة المهنية. شكّل العمل غير المنظم 62.1% من مجموع العمالة عام 2020، وتفصّل النشرة القطاعات التي تتركّز فيها النساء والانتهاكات التي يتعرضن لها، ومنها غياب العقود والأجور دون الحد الأدنى للأجور وحرمانهن من إجازات الأمومة والإجازات المرضية.',
    sourcePath: '/sites/default/files/downloads/2021-12/Unionawareness-Brochure-Unregulated%20Sector.pdf',
    filename: 'Unregulated Sector.pdf',
  },
  {
    type: 'brochures',
    title: 'Trade Union Organization',
    titleAr: 'العمل النقابي',
    description:
      'An introduction to trade union organizing: the principles it rests on, the components of a sound union — independence, inclusiveness, an elected leadership and democratic rotation of office — and why unions matter, from collective bargaining over wages, leave and working hours to their role in civil society and in shaping economic and social policy.',
    descriptionAr:
      'مقدمة في العمل النقابي: المبادئ التي يقوم عليها، ومقوّمات التنظيم النقابي السليم — استقلالية النقابة واستيعابها لكافة الشرائح والانتخاب الحر والتداول الديمقراطي للقيادة — وأهمية النقابات، من التفاوض الجماعي حول الأجور والإجازات وساعات العمل إلى دورها في المجتمع المدني وتأثيرها في السياسات الاقتصادية والاجتماعية.',
    sourcePath: '/sites/default/files/downloads/2021-12/Unionawareness-Brochure-Unionism.pdf',
    filename: 'Unionism.pdf',
  },
  {
    type: 'brochures',
    title: 'The Special Employment Contract',
    titleAr: 'عقد العمل الخاص',
    description:
      'An explanation of the employment contract under Palestinian Labour Law No. 7 of 2000: the types of contract — permanent, temporary, casual and seasonal — the three elements that must be present for labour law to apply, and the form a contract must take under Article 28. It also covers the two-year ceiling on fixed-term contracts with the same employer, after which the contract is treated as indefinite.',
    descriptionAr:
      'شرح لعقد العمل بحسب قانون العمل الفلسطيني رقم (7) لعام 2000: أنواع العقود — الدائم والمؤقت والعرضي والموسمي — والعناصر الثلاثة الواجب توافرها حتى ينطبق قانون العمل، وشكل العقد وفق نص المادة (28). كما يتناول الحد الأقصى لعقد العمل محدد المدة لدى نفس صاحب العمل وهو سنتان متتاليتان، وبعدهما يُعتبر العقد غير محدد المدة.',
    sourcePath: '/sites/default/files/downloads/2021-12/Unionawareness-Brochure-Special%20Contracts.pdf',
    filename: 'Special Contracts.pdf',
  },
  {
    type: 'brochures',
    title: 'Cases of Contract Termination',
    titleAr: 'حالات انتهاء التعاقد وما يتبعها',
    description:
      'A guide to how an employment contract ends under Palestinian labour law: the cases set out in Article 35, the circumstances in Articles 36 and 37 in which a contract does not end, the grounds in Article 40 on which a worker may terminate unilaterally while keeping full entitlements, and what counts as arbitrary dismissal together with the compensation owed under Article 47.',
    descriptionAr:
      'دليل حول انتهاء عقد العمل في قانون العمل الفلسطيني: الحالات الواردة في المادة (35)، والحالات التي لا ينتهي فيها العقد بحسب المادتين (36) و(37)، والأسباب التي تجيز للعامل إنهاء العقد من طرف واحد مع احتفاظه بكامل حقوقه وفق المادة (40)، وما يُعتبر فصلاً تعسفياً والتعويضات المستحقة بموجب المادة (47).',
    sourcePath: '/sites/default/files/downloads/2021-12/Unionawareness-Brochure-Contract%20Termination_0.pdf',
    filename: 'Contract Termination.pdf',
  },
  {
    type: 'reports',
    title: 'Text Messages',
    titleAr: 'رسائل نصية',
    description:
      'A set of short awareness messages, written in SMS format, summarising key points of Palestinian labour law for workers — among them that a contract which does not state its duration is treated as indefinite, that a fixed-term contract with the same employer may not exceed two consecutive years, and that dismissal for union involvement counts as arbitrary dismissal.',
    descriptionAr:
      'مجموعة من الرسائل التوعوية القصيرة، مصاغة بأسلوب الرسائل النصية، تلخّص أبرز أحكام قانون العمل الفلسطيني للعاملين والعاملات — ومنها أن العقد الذي لا ينص صراحة على مدته يُعتبر غير محدد المدة، وأن عقد العمل محدد المدة لدى نفس صاحب العمل لا يجوز أن يتجاوز سنتين متتاليتين، وأن الفصل بسبب الانخراط النقابي يُعدّ فصلاً تعسفياً.',
    sourcePath: '/sites/default/files/inline-files/text-messages-tweets.pdf',
    filename: 'Text Messages.pdf',
  },
  // The initiative's own flagship research output, supplied directly rather
  // than taken from the old site. The full report is in Arabic and the
  // executive summary in English, so they are two separate items — a single
  // entry can only carry one file.
  {
    type: 'reports',
    title: 'Decolonizing Knowledge Production',
    titleAr: 'نزع البنى الكولونيالية عن عملية إنتاج المعرفة',
    author: 'Mudar Kassis, Maher Al-Hashweh',
    authorAr: 'مضر قسيس، ماهر الحشوة',
    date: '2024-08-01T00:00:00.000Z',
    description:
      'The Dignity Initiative research team\'s study of the colonial structures shaping knowledge production in Arab universities, and of what makes decolonisation and emancipation possible. Built around a case study of Birzeit University — eighteen interviews across the university community — and tested against seven interviews with academics in Jordan, Tunisia, Lebanon and Egypt. It finds that decolonising knowledge holds no clear place in university programmes or visions, that decolonisation is often reduced to opposing its visible manifestations, that emancipatory knowledge is produced only through scattered individual effort, and that neoliberal policies, bibliometric evaluation and reliance on international funders shape what gets researched. Part of a wider project across five institutions, supported by the IDRC in Canada.',
    descriptionAr:
      'دراسة فريق مبادرة كرامة البحثي حول البنى الكولونيالية التي تحكم عملية إنتاج المعرفة في الجامعات العربية، وحول ما يتيح نزع الاستعمار والتحرر. تقوم الدراسة على حالة جامعة بيرزيت — ثمانية عشر مقابلة مع أعضاء من مجتمع الجامعة — واختُبرت نتائجها عبر سبع مقابلات مع أكاديميين من الأردن وتونس ولبنان ومصر. وتخلص إلى أن مسألة نزع الكولونيالية عن المعرفة لا تحتل موقعاً واضحاً في برامج الجامعات ورؤاها، وأن مقاومة الهيمنة كثيراً ما تُختزل في مواجهة مظاهرها، وأن إنتاج المعرفة التحررية يجري عبر جهود فردية متقطعة، وأن السياسات النيوليبرالية ومعايير التقييم الببليومترية والاعتماد على التمويل الدولي تؤثر في اختيار موضوعات البحث. وهي جزء من مشروع أوسع يضم خمس مؤسسات بدعم من مركز أبحاث التنمية الدولية (IDRC) في كندا.',
    localPath: 'C:/Users/tala/Downloads/Research Report - Decolonising Knowledge Production_0.pdf',
    filename: 'Decolonizing Knowledge Production Report.pdf',
  },
  {
    type: 'reports',
    title: 'Decolonizing Knowledge Production — Executive Summary',
    titleAr: 'نزع البنى الكولونيالية عن عملية إنتاج المعرفة — الملخص التنفيذي',
    author: 'Mudar Kassis, Maher Al-Hashweh',
    authorAr: 'مضر قسيس، ماهر الحشوة',
    date: '2024-08-01T00:00:00.000Z',
    description:
      'The English executive summary of the Decolonizing Knowledge Production report: the research questions the team set out to answer, how the Birzeit University case study and the wider Arab interviews were conducted, and the principal findings and conclusions in brief.',
    descriptionAr:
      'الملخص التنفيذي باللغة الإنجليزية لتقرير نزع البنى الكولونيالية عن عملية إنتاج المعرفة: أسئلة البحث التي سعى الفريق إلى الإجابة عنها، وكيفية إجراء دراسة حالة جامعة بيرزيت والمقابلات مع أكاديميين عرب، وأبرز النتائج والاستنتاجات بإيجاز.',
    localPath: 'C:/Users/tala/Downloads/Executive Summary_0.pdf',
    filename: 'Decolonizing Knowledge Production Executive Summary.pdf',
  },
  {
    type: 'audiovisual',
    title: 'Work in the Unregulated Sector (Video)',
    titleAr: 'العمل في القطاع الغير منظم (فيديو)',
    description:
      'A filmed discussion of informal employment in Palestine: who works in the unregulated sector, the conditions they work under, and the legal protections that do not reach them.',
    descriptionAr:
      'حوار مصوّر حول العمل غير المنظم في فلسطين: من يعمل في القطاع غير المنظم، وظروف العمل فيه، والحمايات القانونية التي لا تصل إليه.',
    link: 'https://www.youtube.com/watch?v=ECHcms1jLD4',
  },
  {
    type: 'audiovisual',
    title: 'Work Injuries (Video)',
    titleAr: 'إصابات العمل (فيديو)',
    description:
      'A filmed discussion of work-related injuries: the treatment and compensation a worker is entitled to, and the obligations that fall on the employer when an injury occurs.',
    descriptionAr:
      'حوار مصوّر حول إصابات العمل: العلاج والتعويض الذي يستحقه العامل، والالتزامات التي تقع على صاحب العمل عند وقوع الإصابة.',
    link: 'https://www.youtube.com/watch?v=Cpsi7VRjWTA',
  },
]

export async function GET(request: Request) {
  const url = new URL(request.url)
  const expected = process.env.BACKFILL_SECRET
  if (!expected) {
    return Response.json({ error: 'BACKFILL_SECRET is not set — refusing to run a data-writing route.' }, { status: 500 })
  }
  if (url.searchParams.get('secret') !== expected) {
    return Response.json({ error: 'Missing or incorrect secret.' }, { status: 401 })
  }
  const dryRun = url.searchParams.get('dryRun') === '1'

  const payload = await getPayload({ config: await config })
  const results: Record<string, unknown>[] = []

  for (const item of ITEMS) {
    try {
      const existing = await payload.find({
        collection: item.type,
        where: { title: { equals: item.title } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        // The collection has drafts enabled, so a document created without an
        // explicit `_status` is a draft — and the public API filters those out,
        // making an imported item invisible on the site. Publish it rather than
        // skipping, so re-running the route repairs that state.
        const doc = existing.docs[0]
        if (doc._status !== 'published') {
          if (!dryRun) {
            await payload.update({
              collection: item.type,
              id: doc.id,
              data: { _status: 'published' },
            })
          }
          results.push({ title: item.title, type: item.type, status: dryRun ? 'would publish' : 'published' })
        } else {
          results.push({ title: item.title, type: item.type, status: 'skipped', reason: 'already published' })
        }
        continue
      }

      if (dryRun) {
        results.push({
          title: item.title,
          titleAr: item.titleAr,
          type: item.type,
          status: 'would create',
          attachment: item.link ?? item.filename,
          source: item.localPath ? 'local file' : item.sourcePath ? 'old website' : 'link only',
          descriptionChars: item.description.length,
        })
        continue
      }

      // Mongo document ids are strings; the generated types narrow to that.
      let fileId: string | undefined
      if (item.filename && (item.sourcePath || item.localPath)) {
        let buffer: Buffer
        if (item.localPath) {
          buffer = await readFile(item.localPath)
        } else {
          const res = await fetch(SOURCE + item.sourcePath!)
          if (!res.ok) throw new Error(`downloading source returned ${res.status}`)
          buffer = Buffer.from(await res.arrayBuffer())
        }
        const media = await payload.create({
          collection: 'media',
          data: { alt: item.titleAr },
          file: { data: buffer, mimetype: 'application/pdf', name: item.filename, size: buffer.length },
        })
        fileId = String(media.id)
      }

      await payload.create({
        collection: item.type,
        data: {
          title: item.title,
          titleAr: item.titleAr,
          description: item.description,
          descriptionAr: item.descriptionAr,
          ...(item.author ? { author: item.author, authorAr: item.authorAr } : {}),
          ...(item.date ? { date: item.date } : {}),
          ...(fileId ? { file: fileId } : {}),
          ...(item.link ? { link: item.link } : {}),
          // Explicit: this collection has drafts enabled, and a draft is
          // filtered out of the public API, so an imported item would never
          // appear on the site.
          _status: 'published',
        },
      })

      results.push({ title: item.title, type: item.type, status: 'created', attachment: item.link ?? item.filename })
    } catch (error) {
      results.push({
        title: item.title,
        type: item.type,
        status: 'failed',
        detail: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return Response.json({ dryRun, total: ITEMS.length, results })
}

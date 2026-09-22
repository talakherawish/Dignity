/**
 * Creates the Disclaimer and Privacy Policy pages' single documents,
 * published, with the text the website was launched with -- so each entry
 * under Site opens already filled in.
 *
 * Each page is written as a list of blocks (a heading, a paragraph, a bullet
 * list) turned into the matching Lexical nodes. An email address in a
 * paragraph becomes a mailto link. A page that already has a document is
 * skipped, so this can never overwrite edits made in the admin.
 *
 *   npm run payload -- run scripts/seed-legal-pages.ts
 */
import { getPayload } from 'payload'
import config from '../src/payload.config'

type Block = { h: string } | { p: string } | { ul: string[] }
type Direction = 'ltr' | 'rtl'

const EMAIL = 'Dignity@birzeit.edu'

const DISCLAIMER_EN: Block[] = [
  { p: 'The Dignity Initiative makes every effort to ensure, to the best of its knowledge, the accuracy of the information provided on this website and its social media channels at the time of publication.' },
  { p: 'This website may also contain links to other websites operated by third parties. These links are provided for informational purposes and are not intended to imply that Dignity Initiative endorses such websites and/or their content. It is important to note that Dignity Initiative has no access to or control over the cookies and privacy policies used by external parties, including those associated with links to other websites.' },
  { p: 'The Dignity Initiative shall not be held responsible for any loss or damage resulting from the use of linked websites or from the use of information published on any pages of the linked websites.' },
  { p: 'While every effort is made to ensure that downloadable content is free from viruses, the Dignity Initiative cannot accept any responsibility for any damage resulting from virus infections.' },
  { p: 'Although the Dignity Initiative aims to keep the website available without interruption, it reserves the right to make changes to the information on the website as necessary from time to time, including removing or modifying any content on the website, as well as withdrawing or changing content without prior notice. Any such changes shall take effect from the date of publication on the website.' },
]

const DISCLAIMER_AR: Block[] = [
  { p: 'تبذل مبادرة كرامة قصارى جهدها للتأكد، على حد علمها، من صحة المعلومات المقدَّمة على هذا الموقع وقنوات التواصل الاجتماعي الخاصة بها في وقت النشر.' },
  { p: 'قد يحتوي هذا الموقع أيضاً على روابط لمواقع أخرى لأطراف أخرى. وتُستخدم هذه الروابط لتوفير مزيد من المعلومات ولا يُقصد بهذه الروابط الإشارة إلى أنَّ مبادرة كرامة تؤيد مثل هذه المواقع و/ أو محتوياتها. حيث من المهم ملاحظة أنَّ مبادرة كرامة ليس لديها وصول أو سيطرة على ملفات تعريف الارتباط وسياسات الخصوصيَّة التي تستخدمها الأطراف الخارجيَّة بما في ذلك الروابط إلى مواقع أخرى.' },
  { p: 'لا تتحمل مبادرة كرامة أيَّة مسؤوليَّة عن أيَّ خسارة أو ضرر يحدث نتيجة استخدام المواقع المرتبطة أو نتيجة استخدام المعلومات المنشورة على أي من صفحات المواقع المرتبطة.' },
  { p: 'وفي حين يُبذل كل جهد لضمان خلو المحتوى القابل للتنزيل من الفيروسات، لا يمكن لـمبادرة كرامة تحمل أيَّ مسؤوليَّة عن الأضرار الناتجة عن الإصابة بالفيروسات.' },
  { p: 'وعلى الرغم من أنَّ مبادرة كرامة تهدف إلى جعل الموقع متاحاً دون انقطاع، فإنها تحتفظ بالحق في إجراء بعض التغييرات على المعلومات الموجودة على الموقع الإلكتروني حسب الحاجة، من وقت لآخر، بما في ذلك إزالة أو تغيير أي محتوى على الموقع وكذلك الانسحاب أو التغيير دون إشعار مسبق. تسري أيَّة تغييرات اعتباراً من تاريخ النشر على الموقع.' },
]

const PRIVACY_EN: Block[] = [
  { p: `This Privacy Policy explains the practices of the Dignity Initiative website, where we prioritize protecting the privacy of our visitors. This document sets out the types of information that are collected and recorded by the website and how we use it. If you have any questions or require further information about our Privacy Policy, please do not hesitate to contact us by email at: ${EMAIL}` },
  { p: 'This Privacy Policy applies only to our online activities and is valid for visitors to our website with regard to the information they share and/or collect on this website. This policy does not automatically apply to any information collected offline or through channels other than this website.' },
  { p: 'By using our website, you agree to our Privacy Policy and its terms.' },
  { h: 'Information We Collect' },
  { p: 'The Dignity Initiative website follows a standard procedure for using Log Files. These files are recorded when visitors access the website. This is a standard practice that enables us to collect information necessary to analyze the website. The information collected through Log Files includes Internet Protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamps, referring/exit pages, and possibly the number of clicks.' },
  { p: 'None of this information is linked to personally identifiable information. The purpose of collecting this information is to analyze trends, administer the website, track users’ movement on the website, and gather demographic information. Some or all of this information is used solely to improve the website and visitors’ experience.' },
  { p: 'In addition, while using the website, you may be asked to voluntarily provide certain information, for example, when filling out forms, registering, or participating in activities. This information may include your name, email address, telephone number, the content of messages and/or attachments you may send to us, and any other information you may choose to provide. Providing this information is voluntary, and it will be used for the specific purpose stated at the time the information is requested.' },
  { h: 'How We Use Information' },
  { p: 'We use the information we collect in various ways, including:' },
  {
    ul: [
      'The primary purpose for requesting the information, which will be clear when it is requested, such as when registering for a mailing list, completing forms, and similar activities.',
      'Providing, operating, and maintaining our website.',
      'Improving, personalizing, and expanding our website.',
      'Understanding and analyzing how you use our website.',
      'Communicating with you, including providing you with updates and other information about the website.',
      'Sending you emails.',
      'Detecting and preventing fraud.',
    ],
  },
  { p: 'We will not share or exchange your information with any other parties.' },
  { h: 'How We Collect Information' },
  { p: 'Like other websites, this website uses "Cookies." These cookies are used to store information, including visitors’ preferences and the pages of the website that visitors accessed. This information is used to improve users’ experience by customizing website content based on the type of browser visitors use and/or other information.' },
  { p: 'For more information about Cookies, please read "What Are Cookies?"' },
  { p: 'Third-party servers or networks use technologies such as cookies, JavaScript, or web beacons, which are used in their advertisements and links. These technologies are sent directly to users’ browsers and automatically obtain your IP address when this occurs. These technologies are used to measure the effectiveness of advertising campaigns and/or to customize the advertising content you see on the websites you visit.' },
  { p: 'You may choose to disable cookies through your individual browser options. More detailed information about managing cookies for a specific browser can be found on the websites of the respective browsers.' },
  { h: 'Other Information' },
  { p: 'This Privacy Policy is effective as of 30 December 2026. It may be amended from time to time without prior notice.' },
]

const PRIVACY_AR: Block[] = [
  { p: `توضح سياسة الخصوصية هذه الممارسات التي يستخدمها موقع مبادرة كرامة، حيث نعطي الأولوية للحفاظ على خصوصية زوارنا. يحتوي هذا المستند على أنواع المعلومات التي يتم جمعها وتسجيلها بواسطة الموقع وكيفية استخدامنا لها. إذا كانت لديكم أية أسئلة أو تحتاجون إلى مزيد من المعلومات حول سياسة الخصوصية الخاصة بنا، لا تترددوا بالتواصل معنا عبر البريد الإلكتروني: ${EMAIL}` },
  { p: 'تنطبق سياسة الخصوصية هذه فقط على أنشطتنا عبر الإنترنت، وهي صالحة لزوار موقعنا الإلكتروني فيما يتعلق بالمعلومات التي يشاركونها و/أو يجمعونها في هذا الموقع. لا تنطبق هذه السياسة بشكل تلقائي على أي معلومات يتم جمعها في وضعية عدم الاتصال أو عبر قنوات أخرى غير هذا الموقع.' },
  { p: 'باستخدام موقعنا، فإنكم توافقون على سياسة الخصوصية الخاصة بنا وعلى شروطها.' },
  { h: 'المعلومات التي نجمعها' },
  { p: 'يتبع موقع مبادرة كرامة إجراءً معتمدًا لاستخدام ملفات التسجيل Log files. تُسجّل ملفات الزوار هذه عندما يزورون الموقع. وهذه ممارسة معتمدة تمكّننا من جمع المعلومات اللازمة لتحليل الموقع. وتتضمن المعلومات التي يتم جمعها بواسطة ملفات التسجيل عناوين بروتوكول الإنترنت (IP)، ونوع المتصفح، ومزوّد خدمات الإنترنت (ISP)، وختم التاريخ والوقت، وصفحات الإحالة/الخروج، وربما عدد النقرات.' },
  { p: 'جميع هذه المعلومات ليست مرتبطة بأي معلومات تعريف شخصية. والغرض من جمع المعلومات هو تحليل التوجهات، وإدارة الموقع، وتتبع حركة المستخدمين على الموقع، وجمع المعلومات الديموغرافية. ويتم استخدام بعض هذه المعلومات أو جميعها فقط لأغراض تحسين الموقع وتجربة الزوار عليه.' },
  { p: 'إضافة إلى ذلك، سيتم أثناء استخدامكم للموقع طلب تقديم بعض المعلومات الطوعية، مثلًا عند ملء النماذج، والتسجيل، والمشاركة في الأنشطة. وتتضمن هذه المعلومات الاسم، وعنوان البريد الإلكتروني، ورقم الهاتف، ومحتويات الرسالة و/أو المرفقات التي قد ترسلونها إلينا، وأية معلومات أخرى قد تختارون تقديمها. وسيكون تقديم هذه المعلومات طوعيًا، وستُستخدم للغرض المحدد المذكور عند طلب المعلومات.' },
  { h: 'كيفية استخدام المعلومات' },
  { p: 'نستخدم المعلومات التي نجمعها بطرق مختلفة، بما في ذلك:' },
  {
    ul: [
      'الغرض الرئيسي من طلب المعلومات، وهو ما يكون واضحًا عند طلبها، في حالات مثل التسجيل لقائمة بريدية، وتعبئة النماذج، وما شابه.',
      'توفير، وتشغيل، وصيانة موقعنا.',
      'تحسين موقعنا، وإضفاء الطابع الشخصي عليه، وتوسيعه.',
      'فهم وتحليل كيفية استخدامكم لموقعنا.',
      'التواصل معكم، بما في ذلك تزويدكم بتحديثات ومعلومات أخرى حول الموقع.',
      'إرسال بريد إلكتروني لكم.',
      'كشف الاحتيال ومنعه.',
    ],
  },
  { p: 'لن نشارك معلوماتكم أو نتبادلها مع أية أطراف أخرى.' },
  { h: 'كيفية جمع المعلومات' },
  { p: 'كالمواقع الأخرى، يستخدم هذا الموقع "ملفات تعريف الارتباط" (Cookies). وتُستخدم ملفات تعريف الارتباط هذه لتخزين المعلومات، بما في ذلك تفضيلات الزوار وصفحات الموقع التي وصل إليها الزوار. وتُستخدم هذه المعلومات لتحسين تجربة المستخدمين من خلال تخصيص محتوى الموقع بناءً على نوع المتصفح الذي يستخدمه الزوار و/أو معلومات أخرى.' },
  { p: 'لمزيد من المعلومات حول ملفات تعريف الارتباط (Cookies)، يُرجى قراءة "ما هي ملفات تعريف الارتباط (Cookies)".' },
  { p: 'تستخدم خوادم أو شبكات الجهات الخارجية تقنيات مثل ملفات تعريف الارتباط، أو JavaScript، أو منارات الويب، المستخدمة في الإعلانات والروابط الخاصة بكل منها. ويتم إرسال ملفات تعريف الارتباط هذه مباشرة إلى متصفح المستخدمين، وتحصل تلقائيًا على عنوان IP الخاص بكم عند حدوث ذلك. وتُستخدم هذه التقنيات لقياس فعالية الحملات الإعلانية و/أو لتخصيص محتوى الإعلان الذي ترونه على المواقع التي تزورونها.' },
  { p: 'يمكنكم اختيار تعطيل ملفات تعريف الارتباط (Cookies) من خلال خيارات المتصفح الخاصة بكم. ويمكن إيجاد المزيد من المعلومات التفصيلية حول إدارة ملفات تعريف الارتباط لمتصفح محدد في المواقع الخاصة بالمتصفحات.' },
  { h: 'معلومات أخرى' },
  { p: 'تسري سياسة الخصوصية هذه اعتباراً من 30 ديسمبر/كانون الأول 2026. ويمكن تعديلها من وقت لآخر دون إشعار مسبق.' },
]

const PAGES = [
  { slug: 'disclaimer', title: 'Disclaimer', titleAr: 'إخلاء المسؤولية', en: DISCLAIMER_EN, ar: DISCLAIMER_AR },
  { slug: 'privacy-policy', title: 'Privacy Policy', titleAr: 'سياسة الخصوصية', en: PRIVACY_EN, ar: PRIVACY_AR },
]

const base = (direction: Direction) => ({ format: '', indent: 0, version: 1, direction })

const text = (value: string) => ({
  type: 'text',
  text: value,
  format: 0,
  style: '',
  mode: 'normal',
  detail: 0,
  version: 1,
})

/** Text runs for one line, with the contact address turned into a mailto link. */
function inline(value: string, direction: Direction) {
  const at = value.indexOf(EMAIL)
  if (at === -1) return [text(value)]
  const runs: unknown[] = []
  if (at > 0) runs.push(text(value.slice(0, at)))
  runs.push({
    type: 'link',
    ...base(direction),
    fields: { linkType: 'custom', url: `mailto:${EMAIL}`, newTab: false },
    children: [text(EMAIL)],
  })
  const rest = value.slice(at + EMAIL.length).trim()
  if (rest) runs.push(text(' ' + rest))
  return runs
}

function node(block: Block, direction: Direction) {
  if ('h' in block) {
    return { type: 'heading', tag: 'h2', ...base(direction), children: [text(block.h)] }
  }
  if ('ul' in block) {
    return {
      type: 'list',
      listType: 'bullet',
      tag: 'ul',
      start: 1,
      ...base(direction),
      children: block.ul.map((item, i) => ({
        type: 'listitem',
        value: i + 1,
        ...base(direction),
        children: inline(item, direction),
      })),
    }
  }
  return { type: 'paragraph', textFormat: 0, textStyle: '', ...base(direction), children: inline(block.p, direction) }
}

const lexical = (blocks: Block[], direction: Direction) => ({
  root: { type: 'root', ...base(direction), children: blocks.map((b) => node(b, direction)) },
})

const payload = await getPayload({ config })

for (const page of PAGES) {
  const { totalDocs } = await payload.count({ collection: page.slug as any, overrideAccess: true })
  if (totalDocs > 0) {
    console.log(`${page.title}: a document already exists -- leaving it alone.`)
    continue
  }
  const doc = await payload.create({
    collection: page.slug as any,
    overrideAccess: true,
    data: {
      title: page.title,
      titleAr: page.titleAr,
      body: lexical(page.en, 'ltr'),
      bodyAr: lexical(page.ar, 'rtl'),
      _status: 'published',
    } as any,
  })
  console.log(`${page.title}: created`, doc.id)
}
process.exit(0)

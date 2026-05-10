import kantImg from "@/assets/kant.jpg";
import relpImg from "@/assets/relp.jpg";
import article3Img from "@/assets/article3.jpg";

export type ArticleLang = "en" | "ar" | "fr";

export type Article = {
  id: string;
  image: string;
  date: { en: string; ar: string; fr: string };
  title: { en: string; ar: string; fr: string };
  excerpt: { en: string; ar: string; fr: string };
  body: { en: string[]; ar: string[]; fr: string[] };
};

export const ARTICLES: Article[] = [
  {
    id: "kant-zreik",
    image: kantImg,
    date: {
      en: "January 14, 2023",
      ar: "١٤ كانون الثاني/يناير ٢٠٢٣",
      fr: "14 janvier 2023",
    },
    title: {
      en: 'Discussion of Raef Zreik\'s Book — "Kant\'s Struggle for Independence"',
      ar: 'نقاش كتاب رائف زريق / "كفاح كانط من أجل الاستقلالية"',
      fr: 'Discussion du livre de Raef Zreik — "La lutte de Kant pour l\'indépendance"',
    },
    excerpt: {
      en: "The Karama Research Initiative at Birzeit University hosted philosopher Raef Zreik to present and discuss his latest book, published by Lexington Publishing House.",
      ar: "استضافت مبادرة كرامة البحثية في جامعة بيرزيت رائف زريق لعرض ومناقشة كتابه الأخير الصادر عن دار نشر لكسنجتون.",
      fr: "L'Initiative Karama à l'Université Birzeit a accueilli le philosophe Raef Zreik pour présenter et discuter son dernier livre, publié par Lexington Publishing House.",
    },
    body: {
      en: [
        "The Karama Research Initiative at Birzeit University hosted philosopher Raef Zreik on Saturday, January 14, 2023, to present and discuss his latest book — published in mid-January by Lexington Publishing House — titled Kant's Struggle for Independence.",
        "The session was opened by Karama Initiative Director Mudhar Qassas, who welcomed the author and noted the significance of Zreik's work, not only because of Kant's stature, but because the questions of right, justice, ethics, and legitimacy addressed in the book are all pivotal in the current era of epochal transition the world is experiencing.",
        "Zreik opened with a general overview of the book, explaining that it is the result of sustained, intensive reading and keen observation of Kantian texts across different periods of Kant's life, in an attempt to understand the four worlds that occupy his writings: happiness, virtue (ethics), law, and justice. The book's central question engages these concepts and the nature of their interrelations: Does compliance with the law produce happiness? Does one become happy through moral dissolution?",
        "Zreik's thesis is that Kant's conferral of autonomy on each of these concepts — treating them as separate worlds — stems from the centrality of autonomy in Kant's overarching methodology, traceable across most of his writings. Kantian autonomy is what simultaneously unites and separates the subjective from the objective, freedom from necessity. Autonomy is a cognitive framework of regulative ideas enabling us to understand the world; human thought operates according to certain principles and laws, and from here Kant's idea of theoretical reason emerges. The moral impulse is autonomous and governed by principles. As for law: can the legal system answer the questions that arise within the legal domain solely by reference to elements internal to law? Or is there always a need to draw from other worlds?",
        "For Zreik, the summum bonum in Kant is when virtue meets happiness — when our degree of happiness is proportional to the good we perform in our lives. Ethics takes precedence over happiness in Kant, transforming the question \"What must a person do to attain happiness?\" into \"Does living in an ethical society mean living in a just society?\" Zreik explains that justice holds precedence over ethics in Kant's four worlds. It is good to live in an ethical society, but what matters more is that it be just. But what if achieving justice requires revolution? Kant's answer, Zreik tells us, comes from his preoccupation with the present rather than the future: justice can be achieved through reforming the system.",
        "Constitutional law professor and Dean of Graduate Studies Asem Khalil responded to Zreik's presentation, stressing the need to apply questions of ethics and law to the Palestinian context: when does disobeying the law become obligatory in order to achieve justice?",
        "Philosophy professor Mudhar Qassas argued for reading Kant more critically, contending that current issues cannot be addressed while maintaining the separation between theory and practice. Knowledge creates a position of responsibility, and in that position the ethical stance is not a choice but an obligation. Revolutionary action in the absence of freedom and justice is therefore obligatory, not optional.",
        "Zreik summarized the discussion by saying that the four worlds he addresses in the book can be interconnected through fully grasping them, for phenomena exist as wholes — these divisions do not exist in knowledge or in life; we see them only in the university.",
        "Raef Zreik is a specialist in philosophy of law and political philosophy, holding a doctorate in law from Harvard University.",
      ],
      ar: [
        "استضافت مبادرة كرامة البحثية في جامعة بيرزيت، يوم السبت ١٤ كانون الثاني ٢٠٢٣، رائف زريق لعرض ومناقشة كتابه الأخير الذي صدر في منتصف كانون الثاني (بعد اللقاء) عن دار نشر لكسنجتون (Lexington) بعنوان كفاح كانط من أجل الاستقلالية.",
        "افتتح اللقاء مدير مبادرة كرامة مضر قسيس، ورحب بالمؤلف، مشيرا إلى أهمية العمل الذي قام به زريق ليس فقط بسبب مكانة كانط، ولكن لأن قضايا الحق، والعدالة، والأخلاق، والشرعية التي يناقشها الكتاب كلها قضايا مفصلية في مرحلة الانتقال الحقبوي التي يعيشها العالم اليوم.",
        "قدم زريق في بداية مداخلته توصيفا عاما للكتاب، موضحا أن هذا العمل هو نتيجة قراءة متواصلة ومكثفة وملاحظة متوقدة لنصوص كانط بتفاصيلها وفي مراحل مختلفة من حياة كانط، في محاولة لفهم العوالم الأربعة التي تشغل كتابات كانط وهي: السعادة، الفضيلة (الأخلاق)، القانون، والعدالة. فالسؤال الأساسي للكتاب منشغل بهذه المفاهيم وبطبيعة علاقاتها بعضها ببعض، فهل الامتثال للقانون يحقق السعادة؟ أم هل يصبح الإنسان سعيدا إذا كان منحلا أخلاقيا؟",
        "تكمن مقولة زريق في هذا الكتاب بإن إضفاء كانط استقلالية (autonomy) لكل من هذه المفاهيم ومعاملتها على أنها عوالم منفصلة، يأتي من مركزية مفهوم الاستقلالية في منهجية كانط الناظمة لفكره، والتي يمكن تتبعها في معظم كتاباته. ويشير زريق إلى أن \"الاستقلالية الكانطية\" هي ما يجمع ويفصل بين الذاتي والموضوعي، وبين الحرية والضرورة. فأوضح زريق أن الاستقلالية هي نسق معرفي من الأفكار الناظمة التي تمكنّنا من فهم العالم، فالفكر البشري يعمل وفق مبادئ وقوانين معينة، ومن هنا تنطلق فكرة كانط عن العقل النظري.",
        "بالنسبة لزريق، الخير الأسمى عند كانط، هو عندما تلتقي الفضيلة بالسعادة، فتصبح درجة السعادة التي نحظى بها تتناسب مع كمية الخير الذي نقوم به في حياتنا. فالأخلاق عند كانط لها أسبقية على السعادة، فيتحول السؤال \"ما الذي يتوجب على الإنسان القيام به ليحظى بالسعادة؟\" إلى السؤال \"هل العيش في مجتمع أخلاقي يعني العيش في مجتمع عادل؟\" يوضح زريق أن للعدالة أسبقية على الأخلاق في عوالم كانط الأربعة.",
        "عقب أستاذ القانون الدستوري وعميد كلية الدراسات العليا والأبحاث، عاصم خليل، على مداخلة رائف وعلى مخطوطة الكتاب، بضرورة التفكير في الأسئلة التي طرحها زريق حول الأخلاق والقانون وتوظيفها في سياقنا الفلسطيني، فيتساءل خليل في هذا الصدد: متى يصبح عصيان القانون ملزما لتحقيق العدالة؟",
        "أما أستاذ الفلسفة مضر قسيس، فعقب بضرورة قراءة كانط قراءة أكثر نقدية من أجل جعله راهنا، لأنه لا يمكن معالجة القضايا الراهنة في ظل الفصل بين النظرية والممارسة. فيرى قسيس ضرورة قراءة كانط بصورة تجعل الفضيلة إلزامية على الشخص غير القاصر (بالمعنى الكانطي)، أي عندما يكون الفرد على دراية بتبعات الفعل. فالمعرفة تنشئ موقعا مسؤولا، وفي هذا الموقع لا يكون الموقف الأخلاقي خيارا، بل موقفا مُلزما.",
        "لخص زريق النقاش بالقول إنه بالإمكان تشبيك العوالم الأربعة التي تحدث عنها في كتابه، وذلك من خلال استيعابها بشكل كامل، فالظاهرة توجد ككل، ولا وجود لهذه التقسيمات في المعرفة أو الحياة، فنحن نراها في الجامعة فقط!",
        "رائف زريق مختص في فلسفة الحق والفلسفة السياسية ويحمل درجة الدكتوراه في القانون من جامعة هارفارد.",
      ],
      fr: [
        "L'Initiative Karama à l'Université Birzeit a accueilli le philosophe Raef Zreik le samedi 14 janvier 2023, pour présenter et discuter son dernier livre — publié à mi-janvier par Lexington Publishing House — intitulé La lutte de Kant pour l'indépendance.",
        "La séance a été ouverte par le directeur de l'Initiative Karama, Mudhar Qassas, qui a accueilli l'auteur et souligné l'importance du travail de Zreik, non seulement en raison du statut de Kant, mais parce que les questions de droit, de justice, d'éthique et de légitimité abordées dans le livre sont toutes cruciales dans l'ère de transition époquale que traverse le monde aujourd'hui.",
        "Zreik a commencé par une présentation générale du livre, expliquant qu'il est le résultat d'une lecture soutenue et intensive des textes kantiens à différentes périodes de la vie de Kant, dans une tentative de comprendre les quatre mondes qui occupent ses écrits: le bonheur, la vertu (l'éthique), la loi et la justice.",
        "La thèse de Zreik est que le fait que Kant confère l'autonomie à chacun de ces concepts — les traitant comme des mondes séparés — découle de la centralité de l'autonomie dans la méthodologie générale de Kant. L'autonomie kantienne est ce qui unit et sépare simultanément le subjectif de l'objectif, la liberté de la nécessité.",
        "Pour Zreik, le souverain bien chez Kant est lorsque la vertu rencontre le bonheur — lorsque notre degré de bonheur est proportionnel au bien que nous accomplissons dans nos vies. L'éthique a la priorité sur le bonheur chez Kant, transformant la question en: \"Est-ce que vivre dans une société éthique signifie vivre dans une société juste?\"",
        "Raef Zreik est spécialiste de la philosophie du droit et de la philosophie politique, titulaire d'un doctorat en droit de l'Université Harvard.",
      ],
    },
  },

  {
    id: "research-ethics-portal",
    image: relpImg,
    date: {
      en: "November 21, 2022",
      ar: "٢١ تشرين الثاني/نوفمبر ٢٠٢٢",
      fr: "21 novembre 2022",
    },
    title: {
      en: "Launch of the Exploratory Version of the Research Ethics Learning Portal",
      ar: "إطلاق النسخة الاستكشافية من بوابة تعلّم أخلاق البحث العلمي",
      fr: "Lancement de la version exploratoire du portail d'apprentissage de l'éthique de la recherche",
    },
    excerpt: {
      en: "The Karama Initiative has launched an interactive Arabic-language learning portal dedicated to research ethics — the first of its kind in the Arab world. We invite colleagues and friends to explore the platform.",
      ar: "أطلقت مبادرة كرامة بوابة تعلّم تفاعلية باللغة العربية مخصصة لأخلاق البحث العلمي، وهي الأولى من نوعها في العالم العربي.",
      fr: "L'Initiative Karama a lancé un portail d'apprentissage interactif en langue arabe dédié à l'éthique de la recherche — le premier du genre dans le monde arabe.",
    },
    body: {
      en: [
        "Dear colleagues and friends,",
        "We invite you to explore the exploratory version of the Research Ethics Learning Portal recently launched by the Karama Initiative. We need and greatly value your feedback and suggestions, and we hope you will find the time to engage with the interactive learning experience it offers.",
        "The exploratory version inevitably contains some errors and shortcomings. A feedback window has been placed at the bottom right of the site for comments on content, design, and technical aspects. For any general observations, do not hesitate to contact us via the contact page in the footer. We currently recommend browsing the portal on desktop computers.",
        "We are deeply grateful for your contribution to improving and developing this portal, which adopts distinctive approaches to research ethics — the first of their kind in Arabic — and which we hope will become a primary tool for learning research ethics in the Arab context.",
        "The portal offers an interactive course on the ethical principles governing scientific research, containing seven learning modules that address: the ethical principles governing scientific research, mechanisms for ensuring justice and equality in the research process, issues of confidentiality and privacy, and proposed mechanisms for evaluating the feasibility of scientific research. The seven modules draw on learning cases from multiple fields: the social sciences and humanities, engineering and technology, and the medical and natural sciences.",
        "The portal is currently available in Arabic; an English translation will be added in the near future.",
      ],
      ar: [
        "الزملاء والأصدقاء الأعزاء،",
        "هذا لدعوتكم لاستخدام النسخة الاستكشافية من بوابة تعلّم أخلاق البحث العلمي التي أطلقتها مبادرة كرامة مؤخرا. نحن بحاجة إلى ملاحظاتكم واقتراحاتكم، ونثمنها، ونأمل أن تجدوا لديكم الوقت لخوض تجربة التعلّم التفاعلي من خلال هذه البوابة.",
        "لم يكن ممكنا إطلاق النسخة الاستكشافية بدون أخطاء وهفوات، ولذلك فهي تحوي على نافذة في أسفل يمين الموقع مخصصة لوضع الملاحظات حول المضمون والشكل والجوانب التقنية، وفي حال كان عندكم/ن أية ملاحظات عامة لا تترددوا بالتواصل معنا عبر صفحة التواصل الموجودة في الشريط السفلي. ننصحكم/ن حاليا بتصفّح البوابة من خلال أجهزة الحاسوب.",
        "سنكون في غاية الامتنان لمساهمتكم في تحسين وتطوير هذه البوابة التي تتبنى مقاربات متميزة لقضايا أخلاق البحث العلمي والأولى من نوعها عربيا، والتي نأمل أن تصبح أداة رئيسية لتعلّم أخلاق البحث العلمي في السياق العربي وباللغة العربية.",
        "تقدّم البوابة مساقا تفاعليا حول المبادئ الأخلاقية الناظمة للبحث العلمي، وتحتوي على سبعة وحدات تعلّمية تعالج قضايا متنوعة، مثل عرض المبادئ الأخلاقية الناظمة للبحث العلمي، وآليات ضمان العدالة والمساواة في العملية البحثية، وقضايا السرية والخصوصية، وآليات مقترحة لتقييم جدوى البحث العلمي. توظّف البوابة في الوحدات السبعة مجموعة من الحالات التعلّمية من حقول معرفية متعددة: العلوم الاجتماعية والإنسانية، والهندسة والتكنولوجيا، والعلوم الطبية والطبيعية.",
        "البوابة متاحة حاليا باللغة العربية، وستتم إضافة الترجمة الإنجليزية إليها في المستقبل القريب.",
      ],
      fr: [
        "Chers collègues et amis,",
        "Nous vous invitons à explorer la version exploratoire du portail d'apprentissage de l'éthique de la recherche récemment lancé par l'Initiative Karama. Nous avons besoin de vos retours et suggestions, et nous espérons que vous trouverez le temps de vivre l'expérience d'apprentissage interactif qu'il offre.",
        "La version exploratoire contient inévitablement quelques erreurs. Une fenêtre de retour a été placée en bas à droite du site pour les commentaires sur le contenu, le design et les aspects techniques.",
        "Le portail propose un cours interactif sur les principes éthiques régissant la recherche scientifique, contenant sept modules d'apprentissage qui abordent: les principes éthiques régissant la recherche, les mécanismes d'équité, les questions de confidentialité et de vie privée, et les mécanismes d'évaluation de la faisabilité de la recherche.",
        "Le portail est actuellement disponible en arabe; une traduction en anglais sera ajoutée prochainement.",
      ],
    },
  },

  {
    id: "revolutionary-heritage",
    image: article3Img,
    date: {
      en: "March 12, 2022",
      ar: "١٢ آذار/مارس ٢٠٢٢",
      fr: "12 mars 2022",
    },
    title: {
      en: 'A Dialogue on the Future of Revolutionary Heritage After "The Atrocity"',
      ar: 'حوارية حول مستقبل التراث الثوري بعد "الفظاعة"',
      fr: 'Un dialogue sur l\'avenir du patrimoine révolutionnaire après "L\'Atrocité"',
    },
    excerpt: {
      en: "The Karama Initiative at Birzeit University organized a dialogue with Syrian writer Yassin al-Haj Saleh on the future of revolutionary heritage and the Arab world's experience of atrocity and resilience.",
      ar: "نظمت مبادرة كرامة في جامعة بيرزيت حوارية مع الكاتب السوري ياسين الحاج صالح حول مستقبل التراث الثوري في مواجهة الفظاعة.",
      fr: "L'Initiative Karama à l'Université Birzeit a organisé un dialogue avec l'écrivain syrien Yassin al-Haj Saleh sur l'avenir du patrimoine révolutionnaire face à l'atrocité.",
    },
    body: {
      en: [
        "The Karama Initiative at Birzeit University organized a dialogue titled \"The Future of Revolutionary Heritage After the Era of Atrocity\" with Syrian writer Yassin al-Haj Saleh, on the evening of Saturday, March 12, 2022, via digital space.",
        "The dialogue was opened by Karama Initiative Director Dr. Mudhar Qassas, who noted that it takes place at a time when wars, death, and repression are multiplying, and when hegemony takes on unprecedented forms and levels. He argued that combating the feeling of powerlessness and loss of hope — and insisting on refusing to surrender to oppression — requires the recovery and invocation of models that render hope supported by a clear vision, constituting a foundation for resisting ruin and humiliation. Thinking our way out of this crisis is the path toward reclaiming the human dignity stripped away in many parts of the world, especially the Arab world.",
        "In speaking about the era of atrocity, Yassin al-Haj Saleh referred to his latest book, Al-Faẓīʿ wa-Tamthīluh, in which he addressed the repercussions of atrocities occurring in prisons and beyond — the attendant humiliation, helplessness, and degradation of dignity — and touched on ways of addressing these atrocities in their effects on society and individuals.",
        "His intervention also addressed a range of issues related to the fundamental transformations the Arab region has undergone as a result of the revolutions that erupted over a decade ago: their outcomes, the ways they were distorted — becoming sectarian and serving the interests of competing international parties — and the atrocities that accompanied them, which made political participation the exclusive preserve of dominant forces and generated widespread indifference to political affairs.",
        "In the second part of the dialogue, discussion unfolded with participants around the horizons of revolutionary and emancipatory action opposing and resisting the current system, and solidarity politics that might restore esteem and luster to revolutionary movements at the universal level, in an attempt to resist all forms of tyranny, exploitation, and colonialism.",
        "The dialogue brought together an Arab audience interested in justice, liberation, dignity, hope, resistance, and captivity. Prison imposed itself forcefully on the discussion as a topic, a reality, and a bitter experience shared by Palestinians and Syrians alike. Yassin closed by responding to a comment from one of the participants: \"What brings us together is not just the cause of justice and liberation — we are fellow prisoners, 'graduates of prison' in Syrian parlance!\"",
        "Karama is a research initiative at Birzeit University aimed at promoting the production of knowledge around human dignity and what contributes to its preservation, using the approach of practical philosophy, and addressing events and issues through the lens of the concept of dignity.",
      ],
      ar: [
        "نظمت مبادرة كرامة في جامعة بيرزيت حوارية بعنوان مستقبل التراث الثوري بعد \"حقبة الفظاعة\"، مع الكاتب السوري ياسين الحاج صالح، وذلك مساء يوم السبت ١٢ آذار ٢٠٢٢ عبر الفضاء الرقمي.",
        "افتتح الحوارية مدير مبادرة كرامة د. مضر قسيس، مُشيرا إلى أن هذه الحوارية تأتي في زمن تكثر فيه الحروب، والموت، والقمع، وتأخذ فيه الهيمنة أنماطا ومستويات غير مسبوقة. وتشكل هذه الوقائع مساسا بظروف ومقومات الوجود الإنساني، وتنتهك الكرامة الإنسانية. وأضاف أن مكافحة الشعور بعدم القدرة على إحداث التغيير، وفقدان الأمل والإصرار على عدم الاستسلام للقهر تحتاج إلى استعادة وإنتاج واستحضار نماذج تجعل الأمل مدعما برؤية واضحة تشكل أساساً لمقاومة الخراب والقمع والذل.",
        "في حديثه عن حقبة الفظاعة، أشار ياسين الحاج صالح إلى كتابه الأخير الفظيع وتمثيله الذي عالج فيه تداعيات ما يجري في السجون وخارجها من فظاعات وأهوال، وما رافق ذلك من إذلال وعجز وامتهان للكرامة، وتطرق إلى طرق معالجة هذه الفظاعات في آثارها على المجتمع والأفراد.",
        "كما تطرق في مداخلته إلى مجموعة من القضايا المرتبطة بالتحولات الجوهرية التي شهدتها المنطقة العربية جراء الثورات التي اندلعت منذ عقد ونيف، وما آلت إليه، وما جرى لها من تحوير؛ لتصبح طائفية وتصب في مصالح أطراف دولية متنازعة، وما رافقها من فظاعات أصبح الحديث معها عن المستقبل السياسي والتفكير في الحيز العام والمشاركة فيه حكراً واستثناءً لفئة مهيمنة من القوى.",
        "في القسم الثاني من الحوارية دار حوار مع المشاركين حول آفاق الفعل الثوري والتحرري المناهض والمقاوم للنظام الحالي، وسياسات التضامن التي يمكن لها أن تعيد الاعتبار والألق للحركات الثورية على الصعيد الأممي في محاولة لمقاومة كافة أشكال الاستبداد والاستغلال والاستعمار.",
        "جمعت الحوارية حضورا عربيا مهتما بالعدالة والتحرر والكرامة والأمل والمقاومة والأسر، وفرض السجن نفسه بقوة في النقاش باعتباره موضوع وحقيقة، وتجربة مريرة، واشترك فيها الفلسطينيون والسوريون. وعقب ياسين نهاية اللقاء: \"نحنا ما بتجمعنا قضية العدالة والتحرر فقط، نحنا زملاء سجن، وبالتعبير السوري 'خريجين حبوس'!\"",
        "يشار إلى أن \"كرامة\" هي مبادرة بحثية في جامعة بيرزيت تهدف إلى تعزيز إنتاج المعرفة حول الكرامة الإنسانية وما يسهم في صونها، مستخدمة نهج فلسفة الممارسة.",
      ],
      fr: [
        "L'Initiative Karama à l'Université Birzeit a organisé un dialogue intitulé \"L'avenir du patrimoine révolutionnaire après l'ère de l'atrocité\" avec l'écrivain syrien Yassin al-Haj Saleh, le soir du samedi 12 mars 2022, via l'espace numérique.",
        "Le dialogue a été ouvert par le directeur de l'Initiative Karama, Dr. Mudhar Qassas, qui a noté qu'il se tient à une époque où les guerres, la mort et la répression se multiplient. Il a soutenu que combattre le sentiment d'impuissance et la perte d'espoir nécessite de retrouver des modèles qui rendent l'espoir soutenu par une vision claire, constituant un fondement pour résister à la ruine et à l'humiliation.",
        "En parlant de l'ère de l'atrocité, Yassin al-Haj Saleh a évoqué son dernier livre, dans lequel il aborde les répercussions des atrocités dans les prisons et au-delà — l'humiliation, l'impuissance et la dégradation de la dignité.",
        "Dans la deuxième partie du dialogue, une discussion s'est développée avec les participants autour des horizons de l'action révolutionnaire et émancipatrice, et des politiques de solidarité qui pourraient restaurer l'éclat des mouvements révolutionnaires à l'échelle universelle.",
        "Le dialogue a réuni un public arabe intéressé par la justice, la libération, la dignité et la résistance. La prison s'est imposée avec force dans la discussion comme réalité amère partagée par les Palestiniens et les Syriens.",
      ],
    },
  },
];

/** Pick the localized field; falls back to English for unsupported languages. */
export function getField(
  article: Article,
  field: "date" | "title" | "excerpt",
  lang: ArticleLang,
): string {
  return article[field][lang] ?? article[field].en;
}

export function getBody(article: Article, lang: ArticleLang): string[] {
  return article.body[lang] ?? article.body.en;
}

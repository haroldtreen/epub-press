const fs = require('fs');
const ContentExtractor = require('../../lib/content-extractor');
const Book = require('../../lib/book');

const articleFixtures = `${__dirname}/../fixtures/articles`;

describe('Article Extraction', () => {
    [
        {
            fixture: 'reddit-post-2019',
            title: 'r/podcasting',
            include: ["Here's where you can promote"],
        },
        {
            fixture: 'new-york-times',
            title: 'In Cramped and Costly Bay Area, Cries to Build, Baby, Build',
            include: ['The organization also inflamed Sierra Club'],
            notInclude: ['<script>'],
        },
        {
            fixture: 'blogspot',
            title: 'Sober Security: Software end of life matters!',
            include: [
                'End the life of the hardware (brick it)',
                'Anytime you work on a software project,',
            ],
        },
        {
            fixture: 'elastic-search',
            title: 'Cluster Health',
            include: [
                'which we can use to see how our cluster is doing',
                'Here, we can see our one node named',
            ],
        },
        {
            fixture: 'thestack',
            title: 'Sites that block adblockers seem to be suffering',
            include: [
                'For news publishers the world is constantly ending',
                'If one was willing to read the trends with a more paranoid eye',
            ],
        },
        {
            fixture: 'stripe-blog',
            title: 'BYOT',
            include: [
                'Do you know anyone who makes you incredibly better at what you do?',
                'This is an experiment and we’ll tweak it as we go.',
            ],
        },
        {
            fixture: 'medium-docker',
            title: 'Docker For Mac Beta Review',
            include: [
                'VirtualBox and its nasty kernel extensions',
                'When ever Mac laptop has a lightweight and reliable Linux container',
                'been following community efforts about running Docker',
                'My initial impressions are extremely positive.',
                '<img',
            ],
            notInclude: ['progressiveMedia-thumbnail'],
        },
        {
            fixture: 'historytoday',
            title: 'The Black Death: The Greatest Catastrophe Ever',
            include: [
                'disastrous mortal disease known as the Black Death spread across Europe in the years',
                'This dramatic fall in Europe',
            ],
        },
        {
            fixture: 'telegraph-uk',
            title:
                "Biologist who snatched eggs from nests of world's rarest bird wins the 'Nobel prize' of conservation", //eslint-disable-line
            include: [
                'Welsh biologist once criticised for stealing eggs from',
                'When the 61-year-old first travelled to the east African',
                'But the biologist, now chief scientist of the Durrell',
            ],
        },
        {
            fixture: 'buzzfeed',
            title: "Inside Palantir, Silicon Valley's Most Secretive Company",
            include: [
                '<b>A trove of internal</b> documents and insider interviews has pulled back the',
                'More than 100 Palantir employees, including several prominent managers',
                'Palantir, like other highly valued tech “unicorns,” has long avoided',
                'But they can also produce lucrative results',
                'definitely been a little bit of a shift from bookings to cash',
            ],
            notInclude: ['rel:buzz_num'],
        },
        {
            fixture: 'kayiprihtim',
            title: '', // Filled in by fallback title
            include: ['nice seneler diliyoruz', 'roman sitelerinden'],
            notInclude: ['Yorum', 'Kategoriler'],
        },
        {
            fixture: 'elektrek',
            title:
                'Spectacular Tesla Model S crash after flying 82+ft in the air shows importance of a large crumple zone [Gallery]', //eslint-disable-line
            include: [
                'Earlier this week, a 18-year old took her father',
                '<a href="http://electrek.co/2016/05/06/tesla-model-s-crash-large-crumple-zone-gallery',
                'http://electrek.co/2016/05/06/tesla-model-s-crash-large-crumple-zone-gallery/model-s',
                'Hopefully the 5 young adults recover quickly and can learn something from this accid',
            ],
            notInclude: ['9TO5MAC'],
        },
        {
            fixture: 'threatpost',
            title: 'Academics Make Theoretical Breakthrough in Random Number Generation',
            include: [
                'Two University of Texas academics have made what some experts believe is',
                'thrilled to have solved it',
                'You expect to see advances in steps',
            ],
            notInclude: [
                'Chrome Defaults to HTML5 over Adobe Flash Starting in Q4',
                'Leave A Comment',
            ],
        },
        {
            fixture: 'reddit-post',
            title: 'Inner Confidence Series: Introduction • /r/GetSuave',
            include: [
                'Thus far, just about everything you',
                'The World is More Malleable Than You Think',
                'Your mind shapes your experiences.',
                'techniques designed to circumvent your own fears and doubts were',
            ],
            notInclude: [
                'I am currently reading psycho-cybernetic',
                'all 2 comments',
                'Submit a new link',
            ],
        },
        {
            fixture: 'github-readme',
            title: 'intelsdi-x/snap',
            include: [
                'is an open telemetry framework designed to simplify the collection',
                'Your contribution, through code and participation, is incredibly important to us.',
            ],
            notInclude: ['Fix plugin path in README.md'],
        },
        {
            fixture: 'moneycontrol',
            title: 'Skipper bags orders worth Rs 135 cr from Power Grid',
            include: ['Looking to bag orders worth Rs 300', 'the filing added.'],
            notInclude: ['Mutual Funds', 'Defence stocks up'],
        },
        {
            fixture: 'sousetsuka',
            title: 'Death March kara Hajimaru Isekai Kyousoukyoku 13-1',
            include: [
                'In order to escape the predicament',
                'More than 1000 nobles are lined up in the great audience hall',
                'I put the golden helmet again',
                'I said more to hold back Lulu who had stood up.',
                'work vigorously again tomorrow!',
            ],
            notInclude: [
                'He can literally just sit back',
                'Join the discussion',
                'for me how she deboned an assassin while they',
            ],
        },
        {
            fixture: 'mediashift',
            title: "Columbia's Lede Program Aims to Go Beyond the Data Hype",
            include: [
                'This all began at Joe',
                'Big Data models and practices aren',
                'Data-driven journalism in larger contexts',
            ],
            notInclude: ['Self-Publishing Your Book: Where’s the Money', 'About EducationShift'],
        },
        {
            fixture: 'bloomberg',
            title: 'The 100-Year-Old Man Who Lives in the Future',
            include: [
                'To reach the Venus Project Research Center',
                'Fresco, now hard of hearing',
                'As for Fresco, he remains convinced his computer-governed city can become reality',
            ],
            notInclude: [
                'At least 53 other people were hospitalized',
                '50 Dead in Florida Nightclub Shooting',
            ],
        },
        {
            fixture: 'wedemain',
            title:
                'Pour prévenir des inondations et préserver sa baie, San Francisco taxera ses habitants', // eslint-disable-line
            include: ['Au niveau mondial', 'Relayée fin mai par', 'San Francisco sera donc la'],
            notInclude: ['Française et éco-construite'],
        },
        {
            fixture: 'program-think',
            title: '回顾六四系列[30]：发起绝食的过程 @ 编程随想的博客',
            include: ['又到了一', '当时这番话', '在学运初期'],
            notInclude: ['俺的招聘经验', '是避而不谈'],
        },
        {
            fixture: 'business-insider',
            title: "A top psychologist says there's only one way to become the best in your field", // eslint-disable-line
            include: [
                'As a teenager in Sweden,\n  Anders Ericsson used to play chess against one of his',
                "In the last few years,\n  however, Ericsson's findings on deliberate practice have",
                '"Partly because I am\n  Swedish," Ericsson said, "it took over 30 different drafts',
            ],
            notInclude: ['Orlando shooter'],
        },
        {
            fixture: 'engadget',
            title: 'Google is working on a kill switch to prevent an AI uprising',
            include: [
                "Humans don't like the idea of not being at the top of the food chain",
                'The latter is considered more important',
                'Sleep tight.',
            ],
            notInclude: ['The TTIP Has Missed Its Political Moment'],
        },
        {
            fixture: 'game-programming',
            title: 'Command · Design Patterns Revisited · Game Programming Patterns',
            include: [
                'Command is one of my favorite patterns',
                'Both terms mean taking some',
                'You may end up with a lot of different command classes',
            ],
            notInclude: ['You could make it a', 'About The Book'],
        },
        {
            fixture: 'npr',
            title: "Scientists Say They've Unearthed A Completely New Kind Of Meteorite",
            include: [
                'Scientists say that in a Swedish quarry',
                'Schmitz says that there are indications',
                'So he showed me the grains',
                'in addition to looking up at',
            ],
            notInclude: [
                'BBC Projects United Kingdom Votes To Leave The European Union',
                'Probably because of a geology',
                'Sign In',
            ],
        },
        {
            fixture: 'npr-org',
            title: 'Truckers Take The Wheel In Effort To Halt Sex Trafficking',
            include: [
                "Sex trafficking wasn't a major concern in the early 1980s",
                'Kimmel called the police',
                'and these people need a hero.',
            ],
            notInclude: ['ON AIR NOW'],
        },
        {
            fixture: 'wattpad',
            title: 'Oda Nobuna no Yabou: Volume 11',
            include: [
                'Will the conqueror of the next',
                'Shikanosuke? What suffering, * pant pant *',
                'This Shikanosuke will not be pleased by being tormented',
                'Your engagement with Juubei and your love',
            ],
        },
        {
            fixture: 'wired',
            title: 'The Weirdest Senses Animals Have That You Don’t',
            include: ['imagine that they’re the pinnacle'],
            notInclude: ['But ads help us keep the lights on.'],
        },
        {
            fixture: 'artofmanliness',
            title: 'Native American Maxims of Wabasha I',
            include: [
                'Editor’s Note: Wabasha',
                'Editor’s Note: Wabasha',
                'over again in a different manner.',
            ],
            notInclude: ['Related Articles', 'The Complete Guide to Giving a Great Handshake'],
        },
        {
            fixture: 'nationalgeographic',
            title: 'Inside the Daring Mission That Thwarted a Nazi Atomic Bomb',
            include: ['On February 27, 1942, nine saboteurs', 'who did equally patriotic work.'],
            notInclude: ['Comment on This Story'],
        },
        {
            fixture: 'quora-1',
            title: 'Can a tortoise walk around the Earth in its life time?',
            include: [
                'A Galapagos Tortoise can walk at a top speed',
                'Would probably be able to travel around the world',
                'This means that it would take it 6,184',
                'Harold Treen, Software Engineer',
                'Walid Mustafa',
            ],
            notInclude: [
                'What are your most common',
                "You've written an answer",
                'This page may be out of date.',
                'Question Stats',
                'k Views',
            ],
            url: 'https://www.quora.com/Can-a-tortoise-walk-around-the-Earth-in-its-life-time',
        },
        {
            fixture: 'quora-2',
            title: 'What are the highest compounding life habits?',
            include: [
                'I used to do StrongLift training.',
                'Dean Yeong',
                'There is something really powerful when',
                'Nela Canovic',
                'I have always broken through',
                'William Ranger',
            ],
            url: 'https://www.quora.com/What-are-the-highest-compounding-life-habits',
        },
        {
            fixture: 'fachords',
            title: 'How to practice guitar',
            include: [
                'Seems like a funny title right',
                'They say practice makes perfect, and of course they are right',
                'Sleep and rest are essential to the learning process',
                'Do you have some guitar practice tips that',
            ],
            notInclue: ["I'm Gianca, a guitar"],
        },
        {
            fixture: 'yahoo-jp',
            title: 'エアバス、Ａ３８０の生産大幅減へ　航空会社の戦略変化（朝日新聞デジタル）',
            include: ['欧州航空機最', 'ただ、エ'],
            notInclude: ['生き続け'],
        },
        {
            fixture: 'lifehacker-jp',
            title:
                '「PCが重い...」と感じているなら要チェック。ChromeがRAMを大量に使用する理由とその対応策',
            include: ['ズバリ、答え', 'また、自', 'もちろん、R', 'れませんね。'],
            notInclude: ['NISSAN GT-R 2017'],
        },
        {
            fixture: 'huffington-jp',
            title: '福島と、「知る」という技術',
            include: ['地球の反対側にいた', '土地の被害者と', 'United Nations: New York'],
            notInclude: ['黒人女性、機動隊の前に静かに立ちふさ'],
        },
        {
            fixture: 'good-is',
            title:
                'When A Racist Imagined ‘A World Without Muslims,’ He Got Owned In The Most Brilliant Way', //eslint-disable-line
            include: [
                'Recent terrorist attacks in France',
                'achievements throughout history.',
                'nothing to do with this incident!',
            ],
            notInclude: ['Dancing Badly', 'Netflix taught us to watch'],
        },
        {
            fixture: 'ibm-developer',
            title: 'Offline-first QR-code Badge Scanner',
            include: [
                'Offline-first web applications are websites',
                'END:VCARD',
                'In PouchDB, syncing',
                'Combining PouchDB with Cloudant makes',
            ],
            notInclude: ['Enter your email address to subscribe to this blog'],
        },
        {
            fixture: 'royal-road',
            title: 'chap 0. Prologue (re.vamped) - Re:sword',
            include: [
                'I was the best sword-smith in my kingdom',
                'At that moment the blade dissolved into dust and blew away',
                'As I fell forward, I took',
            ],
            notInclude: ['This user has no achievements'],
        },
        {
            fixture: 'psychology-today',
            title: 'Online Dating: Quit Bragging',
            include: [
                'dictates that presenting yourself in the best',
                'The key to successful online dating, then',
            ],
            notInclude: ['Most Recent Posts from Romantically Attached', 'You Might Also Like'],
        },
        {
            fixture: 'ux-milk',
            title: 'より良いCSSを書くための様々なCSS設計まとめ',
            include: [
                'CSSは誰でも簡単に自由に',
                'SMACSSでは、スタイル',
                'Scoped CSS自体は、CSS設',
                'どのCSS設',
            ],
            notInclude: [
                'Web制作の作業効率を格段にア',
                'ライフハック',
                '個人情報の取り扱いについて',
            ],
        },
        {
            fixture: 'journalism-uk',
            title: 'Google at 15: Tips and tools for journalists',
            include: [
                'Fifteen years ago yesterday, Google was first incorporated as a company',
                'Looking for information within specific',
                'yet to be fully understood.',
            ],
            notInclude: ['Jobs board', 'Tips for freelance', 'Manage vacancy postings'],
        },
        {
            fixture: 'airbnb',
            title: 'Experiment Reporting Framework',
            include: [
                'At Airbnb we are always trying to learn',
                'When designing this tool',
                'we’d love to hear from you.',
            ],
        },
        {
            fixture: 'edureka',
            title: 'What is DevOps and why learn DevOps- Edureka',
            include: [
                'DevOps can be termed as brothers',
                'In delivering valuable software to customers',
                'Machines are really good at doing',
                'Multihost SSH Wrapper',
            ],
        },
        {
            fixture: 'portal-nifty',
            title: 'ウナギが無いならナマズの蒲焼きを食べればいいのかしら',
            include: [
                'ナマズは蒲焼きにするとおい',
                'こんなにありふれた魚であ',
                'たくさんの人に両者を',
                'あの独特の食感を持つ',
                'src="/2014/08/12/b/img/pc/18.jpg',
                'ウナギはウナギ',
            ],
            notInclude: ['？なまずの刺身を食べる', 'ヘボコン直前！不器用な人が作ったロボ'],
        },
        {
            fixture: 'songmeanings',
            title: 'Gorillaz - Last Living Souls Lyrics',
            include: [
                'Are we the last living souls',
                'Or how you say',
                "We're the last living souls",
            ],
            notInclude: ['30 Comments'],
        },
        {
            fixture: 'spacemacs-docs',
            title: 'Spacemacs documentation',
            include: [
                ' Core Pillars',
                ' Highlighted feature',
                ' Binding keys',
                'It is also possible to search in a project',
                'It is possible to keep the server alive',
                'Thank you to all the contributors and the whole Emacs community',
            ],
        },
        {
            fixture: 'novinky',
            title: 'Parašutistovi se zamotal padák, k zemi se řítil rychlostí 85 km/h',
            include: ['Čtyřiadvacetiletého mladíka', 'prvním okamžiku si myslel'],
            notInclude: [
                'Slavnosti na jihu Čech nabídly zmrzlinu z ovčího mléka',
                'ANO v průzkumu výrazně vede, ODS dotahuje komunisty',
            ],
        },
        {
            fixture: 'salesbenchmarkindex',
            title: 'Sales Enablement: From Hire to Retire',
            include: [
                'Getting an increase in sales head count is difficult',
                'Kent oversees a varied sales operations',
                'which includes a strong sales enablement program.',
            ],
            notInclude: [
                'Every day, SBI delivers a proven best practice',
                'Chief Differentiators for Topgraded Sales Talent',
            ],
        },
        {
            fixture: 'geektimes',
            title: 'Взгляд изнутри: LCD и E-Ink дисплеи',
            include: [
                'Так начинается известная',
                'Осознавая свои смехотворные',
                'Когда мы нажимаем на такой',
                'После «аккуратной» отвёрточной разборки',
                'Конечно, такое происходит не часто',
                'В конце моего повествования',
            ],
            notInclude: [
                'Самое читаемое',
                'Спасибо, у вас замечательные научно-популярные статьи.',
            ],
        },
        {
            fixture: 'nrich',
            title: 'Disease Dilemmas : nrich.maths.org',
            include: [
                'This exercise raises ethical questions relating',
                'To understand that infectious disease',
                'Divide the class into small groups.',
                'Why do people participate in such research?',
                'Should we allow future generations to face a',
            ],
            notInclude: ['The NRICH Project aims to enrich the mathematical'],
        },
        {
            fixture: 'mentalfloss',
            title: '11 Misconceptions About Ancient Rome, Debunked',
            include: [
                'Released in 1959',
                'ROMANS DIDN’T',
                'At first, the toga emphasized function over form',
                'NOT ALL GLADIATORS WERE SLAVES',
                'Eventually, the government cracked down on freeborn combatants.',
            ],
        },
        {
            fixture: 'katehon',
            title: 'Ten Secret Organizers of Pro-American coup in Turkey',
            include: [
                'The list of Americans involved in the Turkish putsch arrangement was published.',
                'According to him, Graham Fuller',
                'Henri Barkey is one of the leaders',
                'The operational work of the Turkish secret services identified these CIA members',
            ],
            notInclude: ["NATO's fingerprints in Turkish coup", 'You can also include a comment.'],
        },
        {
            fixture: 'value-picks',
            title: 'VALUE PICK FROM INDIAN STOCK MARKETS: Basic Cocepts of Cash Flow',
            include: [
                'Cash flow analysis is a critical process',
                'Upgrading equipment and buying',
                'flow is a key element of a successful',
                'The Bottom Line',
            ],
            notInclude: ['37 Comments'],
        },
        {
            fixture: 'ilikebigbits',
            title: 'The Myth of RAM, part I',
            include: [
                'This article is the first of four in a series',
                'Intro',
                'If you have studied computing science',
                'Note that this is a log-log graph',
                '<img class="thumb-image loaded"',
                'be a theoretical limit to the latency of a memory access',
            ],
        },
        {
            fixture: 'w3-school',
            title: 'JavaScript DOM Elements',
            include: [
                'myElement = document.getElementById',
                'x.getElementsByTagName',
                'x = document.querySelectorAll',
                'The querySelectorAll() method does not work in Internet Explorer 8',
                'x = document.forms',
            ],
            notInclude: ['Try it Yourself'],
        },
        {
            fixture: 'the-verge',
            title: "Mark Zuckerberg defends Peter Thiel's Trump ties in internal memo",
            include: [
                "Peter Thiel's donation of $1.25 million to Donald",
                'Tech CEOs "are being insensitive to is the fact that for many people',
            ],
        },
        {
            fixture: 'landing-google',
            title: 'Google - Site Reliability Engineering', // TODO: Change to Distributed Periodic Scheduling with Cron
            include: ["This chapter describes Google's implementation"],
        },
        {
            fixture: 'bbc-persian',
            title: "ترامپ از توافق تجاری 'تاریخی' با کانادا استقبال کرد",
            include: ['dir="rtl"', 'تجارت آزاد آمریکای شمالی (نفتا) استقبال کرده است.'],
        },
        // {
        //     fixture: 'douban',
        //     title: '翻包记 之 随身行李和长途飞行小贴士',
        //     include: ['这次年假回国我也打算继续', '行李箱里，而且我的两样', '丝袜的确是'],
        //     notInclude: ['有什么作用啊'],
        // },
    ].forEach((testCase) => {
        it(`can extract ${testCase.fixture} articles`, (done) => {
            const html = fs.readFileSync(`${articleFixtures}/${testCase.fixture}.html`).toString();
            ContentExtractor.runUrlSpecificOperations(html, testCase.url)
                .then(newHtml => ContentExtractor.extract(newHtml))
                .then((article) => {
                    expect(Book.sanitizeTitle(article.title)).toEqual(testCase.title);
                    (testCase.include || []).forEach((content) => {
                        expect(article.content).toContain(content);
                    });
                    (testCase.notInclude || []).forEach((content) => {
                        expect(article.content).not.toContain(content);
                    });
                    done();
                })
                .catch(done);
        })
    });
});

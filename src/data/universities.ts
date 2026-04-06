export interface University {
	id: string;
	name: string;
	nameEn: string;
	city: string;
	type: "public" | "private" | "azad" | "elmi";
}

export interface Faculty {
	id: string;
	name: string;
	nameEn: string;
}

export const IRANIAN_UNIVERSITIES: University[] = [
	// Tehran - Major Public Universities
	{
		id: "ut",
		name: "دانشگاه تهران",
		nameEn: "University of Tehran",
		city: "تهران",
		type: "public",
	},
	{
		id: "sharif",
		name: "دانشگاه صنعتی شریف",
		nameEn: "Sharif University of Technology",
		city: "تهران",
		type: "public",
	},
	{
		id: "amirkabir",
		name: "دانشگاه صنعتی امیرکبیر",
		nameEn: "Amirkabir University of Technology",
		city: "تهران",
		type: "public",
	},
	{
		id: "sbu",
		name: "دانشگاه شهید بهشتی",
		nameEn: "Shahid Beheshti University",
		city: "تهران",
		type: "public",
	},
	{
		id: "kntu",
		name: "دانشگاه خوارزمی",
		nameEn: "Kharazmi University",
		city: "تهران",
		type: "public",
	},
	{
		id: "ut-ac",
		name: "دانشگاه هنر تهران",
		nameEn: "University of Tehran - Art Campus",
		city: "تهران",
		type: "public",
	},
	{
		id: "alzahra",
		name: "دانشگاه الزهرا",
		nameEn: "Alzahra University",
		city: "تهران",
		type: "public",
	},
	{
		id: "allameh",
		name: "دانشگاه علامه طباطبائی",
		nameEn: "Allameh Tabataba'i University",
		city: "تهران",
		type: "public",
	},
	{
		id: "sut",
		name: "دانشگاه شاهد",
		nameEn: "Shahed University",
		city: "تهران",
		type: "public",
	},
	{
		id: "iau-tehran",
		name: "دانشگاه آزاد اسلامی - واحد تهران",
		nameEn: "Islamic Azad University - Tehran Branch",
		city: "تهران",
		type: "azad",
	},
	{
		id: "iau-science",
		name: "دانشگاه آزاد اسلامی - واحد علوم و تحقیقات",
		nameEn: "Islamic Azad University - Science and Research Branch",
		city: "تهران",
		type: "azad",
	},
	{
		id: "iau-roodehen",
		name: "دانشگاه آزاد اسلامی - واحد رودهن",
		nameEn: "Islamic Azad University - Roodehen Branch",
		city: "تهران",
		type: "azad",
	},
	{
		id: "elmi-karbordi",
		name: "دانشگاه علم و فرهنگ",
		nameEn: "University of Science and Culture",
		city: "تهران",
		type: "elmi",
	},
	{
		id: "imam-hossein",
		name: "دانشگاه امام حسین",
		nameEn: "Imam Hossein University",
		city: "تهران",
		type: "public",
	},
	{
		id: "imam-sadeq",
		name: "دانشگاه امام صادق",
		nameEn: "Imam Sadeq University",
		city: "تهران",
		type: "public",
	},
	{
		id: "tarbiat-modares",
		name: "دانشگاه تربیت مدرس",
		nameEn: "Tarbiat Modares University",
		city: "تهران",
		type: "public",
	},
	{
		id: "sum",
		name: "دانشگاه علوم پزشکی ایران",
		nameEn: "Iran University of Medical Sciences",
		city: "تهران",
		type: "public",
	},
	{
		id: "tums",
		name: "دانشگاه علوم پزشکی تهران",
		nameEn: "Tehran University of Medical Sciences",
		city: "تهران",
		type: "public",
	},
	{
		id: "sbums",
		name: "دانشگاه علوم پزشکی شهید بهشتی",
		nameEn: "Shahid Beheshti University of Medical Sciences",
		city: "تهران",
		type: "public",
	},

	// Isfahan
	{
		id: "ui",
		name: "دانشگاه اصفهان",
		nameEn: "University of Isfahan",
		city: "اصفهان",
		type: "public",
	},
	{
		id: "iut",
		name: "دانشگاه صنعتی اصفهان",
		nameEn: "Isfahan University of Technology",
		city: "اصفهان",
		type: "public",
	},
	{
		id: "a-iut",
		name: "دانشگاه هنر اصفهان",
		nameEn: "Art University of Isfahan",
		city: "اصفهان",
		type: "public",
	},
	{
		id: "iau-isfahan",
		name: "دانشگاه آزاد اسلامی - واحد اصفهان",
		nameEn: "Islamic Azad University - Isfahan Branch",
		city: "اصفهان",
		type: "azad",
	},
	{
		id: "kashan",
		name: "دانشگاه کاشان",
		nameEn: "University of Kashan",
		city: "کاشان",
		type: "public",
	},

	// Shiraz
	{
		id: "shirazu",
		name: "دانشگاه شیراز",
		nameEn: "Shiraz University",
		city: "شیراز",
		type: "public",
	},
	{
		id: "sutech",
		name: "دانشگاه صنعتی شیراز",
		nameEn: "Shiraz University of Technology",
		city: "شیراز",
		type: "public",
	},
	{
		id: "sums",
		name: "دانشگاه علوم پزشکی شیراز",
		nameEn: "Shiraz University of Medical Sciences",
		city: "شیراز",
		type: "public",
	},
	{
		id: "iau-shiraz",
		name: "دانشگاه آزاد اسلامی - واحد شیراز",
		nameEn: "Islamic Azad University - Shiraz Branch",
		city: "شیراز",
		type: "azad",
	},

	// Mashhad
	{
		id: "ferdowsi",
		name: "دانشگاه فردوسی مشهد",
		nameEn: "Ferdowsi University of Mashhad",
		city: "مشهد",
		type: "public",
	},
	{
		id: "mums",
		name: "دانشگاه علوم پزشکی مشهد",
		nameEn: "Mashhad University of Medical Sciences",
		city: "مشهد",
		type: "public",
	},
	{
		id: "iau-mashhad",
		name: "دانشگاه آزاد اسلامی - واحد مشهد",
		nameEn: "Islamic Azad University - Mashhad Branch",
		city: "مشهد",
		type: "azad",
	},
	{
		id: "ferdowsi-m",
		name: "دانشگاه فردوسی",
		nameEn: "Ferdowsi University",
		city: "مشهد",
		type: "public",
	},

	// Tabriz
	{
		id: "tabrizu",
		name: "دانشگاه تبریز",
		nameEn: "University of Tabriz",
		city: "تبریز",
		type: "public",
	},
	{
		id: "sahand",
		name: "دانشگاه صنعتی سهند",
		nameEn: "Sahand University of Technology",
		city: "تبریز",
		type: "public",
	},
	{
		id: "iau-tabriz",
		name: "دانشگاه آزاد اسلامی - واحد تبریز",
		nameEn: "Islamic Azad University - Tabriz Branch",
		city: "تبریز",
		type: "azad",
	},
	{
		id: "tums-tabriz",
		name: "دانشگاه علوم پزشکی تبریز",
		nameEn: "Tabriz University of Medical Sciences",
		city: "تبریز",
		type: "public",
	},

	// Ahvaz
	{
		id: "jundi-shapur",
		name: "دانشگاه جندی‌شاپور اهواز",
		nameEn: "Jundishapur University of Ahvaz",
		city: "اهواز",
		type: "public",
	},
	{
		id: "shahid-chamran",
		name: "دانشگاه شهید چمران اهواز",
		nameEn: "Shahid Chamran University of Ahvaz",
		city: "اهواز",
		type: "public",
	},

	// Other Major Cities
	{
		id: "bu-ali",
		name: "دانشگاه بوعلی سینا همدان",
		nameEn: "Bu-Ali Sina University",
		city: "همدان",
		type: "public",
	},
	{
		id: "razi",
		name: "دانشگاه رازی کرمانشاه",
		nameEn: "Razi University",
		city: "کرمانشاه",
		type: "public",
	},
	{
		id: "kerman",
		name: "دانشگاه شهید باهنر کرمان",
		nameEn: "Shahid Bahonar University of Kerman",
		city: "کرمان",
		type: "public",
	},
	{
		id: "kerman-ut",
		name: "دانشگاه کرمان",
		nameEn: "University of Kerman",
		city: "کرمان",
		type: "public",
	},
	{
		id: "mazandaran",
		name: "دانشگاه مازندران بابل",
		nameEn: "University of Mazandaran",
		city: "بابلسر",
		type: "public",
	},
	{
		id: "babol-noshirvani",
		name: "دانشگاه صنعتی نوشیروانی بابل",
		nameEn: "Babol Noshirvani University of Technology",
		city: "بابل",
		type: "public",
	},
	{
		id: "guilan",
		name: "دانشگاه گیلان رشت",
		nameEn: "University of Guilan",
		city: "رشت",
		type: "public",
	},
	{
		id: "iasbs",
		name: "دانشگاه علوم و تحقیقات زنجان",
		nameEn: "Institute for Advanced Studies in Basic Sciences",
		city: "زنجان",
		type: "public",
	},
	{
		id: "zanjan",
		name: "دانشگاه زنجان",
		nameEn: "University of Zanjan",
		city: "زنجان",
		type: "public",
	},
	{
		id: "yasouj",
		name: "دانشگاه یاسوج",
		nameEn: "Yasouj University",
		city: "یاسوج",
		type: "public",
	},
	{
		id: "araz",
		name: "دانشگاه آران و بیدگل",
		nameEn: "Aran va Bidgol University",
		city: "آران و بیدگل",
		type: "public",
	},
	{
		id: "ardebil",
		name: "دانشگاه محقق اردبیلی",
		nameEn: "University of Mohaghegh Ardabili",
		city: "اردبیل",
		type: "public",
	},
	{
		id: "kish",
		name: "دانشگاه کیش",
		nameEn: "University of Kish",
		city: "کیش",
		type: "public",
	},
	{
		id: "qom",
		name: "دانشگاه قم",
		nameEn: "University of Qom",
		city: "قم",
		type: "public",
	},
	{
		id: "qom-azad",
		name: "دانشگاه آزاد اسلامی - واحد قم",
		nameEn: "Islamic Azad University - Qom Branch",
		city: "قم",
		type: "azad",
	},
	{
		id: "semnan",
		name: "دانشگاه سمنان",
		nameEn: "Semnan University",
		city: "سمنان",
		type: "public",
	},
	{
		id: "damghan",
		name: "دانشگاه دامغان",
		nameEn: "Damghan University",
		city: "دامغان",
		type: "public",
	},
	{
		id: "birjand",
		name: "دانشگاه بیرجند",
		nameEn: "University of Birjand",
		city: "بیرجند",
		type: "public",
	},
	{
		id: "bojnurd",
		name: "دانشگاه بجنورد",
		nameEn: "University of Bojnurd",
		city: "بجنورد",
		type: "public",
	},
	{
		id: "golestan",
		name: "دانشگاه گلستان گرگان",
		nameEn: "Golestan University",
		city: "گرگان",
		type: "public",
	},
	{
		id: "agha-soleiman",
		name: "دانشگاه آقاسلیمان",
		nameEn: "Agha Soleiman University",
		city: "تهران",
		type: "private",
	},
	{
		id: "iau-central",
		name: "دانشگاه آزاد اسلامی - واحد مرکزی",
		nameEn: "Islamic Azad University - Central Branch",
		city: "تهران",
		type: "azad",
	},
	{
		id: "iau-najafabad",
		name: "دانشگاه آزاد اسلامی - واحد نجف‌آباد",
		nameEn: "Islamic Azad University - Najafabad Branch",
		city: "نجف‌آباد",
		type: "azad",
	},
	{
		id: "iau-karaj",
		name: "دانشگاه آزاد اسلامی - واحد کرج",
		nameEn: "Islamic Azad University - Karaj Branch",
		city: "کرج",
		type: "azad",
	},
	{
		id: "iau-sari",
		name: "دانشگاه آزاد اسلامی - واحد ساری",
		nameEn: "Islamic Azad University - Sari Branch",
		city: "ساری",
		type: "azad",
	},
];

export const COMMON_FACULTIES: Faculty[] = [
	// Engineering
	{ id: "eng", name: "مهندسی", nameEn: "Engineering" },
	{ id: "eng-cs", name: "مهندسی کامپیوتر", nameEn: "Computer Engineering" },
	{
		id: "eng-it",
		name: "مهندسی فناوری اطلاعات",
		nameEn: "Information Technology",
	},
	{ id: "eng-ee", name: "مهندسی برق", nameEn: "Electrical Engineering" },
	{ id: "eng-ce", name: "مهندسی عمران", nameEn: "Civil Engineering" },
	{ id: "eng-me", name: "مهندسی مکانیک", nameEn: "Mechanical Engineering" },
	{ id: "eng-chem", name: "مهندسی شیمی", nameEn: "Chemical Engineering" },
	{ id: "eng-pet", name: "مهندسی نفت", nameEn: "Petroleum Engineering" },
	{ id: "eng-mining", name: "مهندسی معدن", nameEn: "Mining Engineering" },
	{ id: "eng-mat", name: "مهندسی مواد", nameEn: "Materials Engineering" },
	{ id: "eng-ind", name: "مهندسی صنایع", nameEn: "Industrial Engineering" },
	{
		id: "eng-agri",
		name: "مهندسی کشاورزی",
		nameEn: "Agricultural Engineering",
	},
	{ id: "eng-bio", name: "مهندسی زیستی", nameEn: "Bioengineering" },
	{
		id: "eng-arch",
		name: "مهندسی معماری",
		nameEn: "Architectural Engineering",
	},
	{ id: "eng-urban", name: "مهندسی شهرسازی", nameEn: "Urban Planning" },
	{ id: "eng-aero", name: "مهندسی هوافضا", nameEn: "Aerospace Engineering" },
	{
		id: "eng-env",
		name: "مهندسی محیط زیست",
		nameEn: "Environmental Engineering",
	},

	// Sciences
	{ id: "sci", name: "علوم پایه", nameEn: "Basic Sciences" },
	{ id: "sci-math", name: "ریاضیات", nameEn: "Mathematics" },
	{ id: "sci-phys", name: "فیزیک", nameEn: "Physics" },
	{ id: "sci-chem", name: "شیمی", nameEn: "Chemistry" },
	{ id: "sci-bio", name: "زیست‌شناسی", nameEn: "Biology" },
	{ id: "sci-geo", name: "زمین‌شناسی", nameEn: "Geology" },
	{ id: "sci-stat", name: "آمار", nameEn: "Statistics" },
	{ id: "sci-comp", name: "علوم کامپیوتر", nameEn: "Computer Science" },

	// Medical and Health
	{ id: "med", name: "پزشکی", nameEn: "Medicine" },
	{ id: "med-dent", name: "دندانپزشکی", nameEn: "Dentistry" },
	{ id: "med-pharm", name: "داروسازی", nameEn: "Pharmacy" },
	{ id: "med-nurs", name: "پرستاری", nameEn: "Nursing" },
	{ id: "med-rehab", name: "توانبخشی", nameEn: "Rehabilitation" },
	{ id: "med-paramed", name: "پیراپزشکی", nameEn: "Paramedical" },
	{ id: "med-health", name: "بهداشت", nameEn: "Public Health" },
	{ id: "med-nut", name: "تغذیه", nameEn: "Nutrition" },

	// Humanities
	{ id: "hum", name: "علوم انسانی", nameEn: "Humanities" },
	{
		id: "hum-lit",
		name: "ادبیات و علوم انسانی",
		nameEn: "Literature and Humanities",
	},
	{ id: "hum-lang", name: "زبان و ادبیات", nameEn: "Language and Literature" },
	{ id: "hum-eng", name: "زبان انگلیسی", nameEn: "English Language" },
	{
		id: "hum-arab",
		name: "زبان و ادبیات عرب",
		nameEn: "Arabic Language and Literature",
	},
	{ id: "hum-hist", name: "تاریخ", nameEn: "History" },
	{ id: "hum-phil", name: "فلسفه", nameEn: "Philosophy" },
	{ id: "hum-soc", name: "علوم اجتماعی", nameEn: "Social Sciences" },
	{ id: "hum-psych", name: "روانشناسی", nameEn: "Psychology" },
	{ id: "hum-econ", name: "اقتصاد", nameEn: "Economics" },
	{ id: "hum-law", name: "حقوق", nameEn: "Law" },
	{ id: "hum-pol", name: "علوم سیاسی", nameEn: "Political Science" },
	{ id: "hum-com", name: "ارتباطات", nameEn: "Communications" },
	{ id: "hum-jour", name: "روزنامه‌نگاری", nameEn: "Journalism" },
	{ id: "hum-lib", name: "کتابداری", nameEn: "Library Science" },
	{ id: "hum-arch", name: "باستان‌شناسی", nameEn: "Archaeology" },
	{ id: "hum-ir-stud", name: " مطالعات ایرانی", nameEn: "Iranian Studies" },
	{ id: "hum-islam", name: "معارف اسلامی", nameEn: "Islamic Studies" },
	{ id: "hum-theol", name: "الهیات", nameEn: "Theology" },

	// Arts
	{ id: "art", name: "هنر", nameEn: "Art" },
	{ id: "art-vis", name: "تجسمی", nameEn: "Visual Arts" },
	{ id: "art-mus", name: "موسیقی", nameEn: "Music" },
	{ id: "art-thea", name: "تئاتر", nameEn: "Theater" },
	{ id: "art-cinema", name: "سینما", nameEn: "Cinema" },
	{ id: "art-design", name: "طراحی", nameEn: "Design" },
	{ id: "art-arch", name: "معماری", nameEn: "Architecture" },
	{ id: "art-urband", name: "شهرسازی", nameEn: "Urban Design" },
	{ id: "art-hand", name: "صنایع دستی", nameEn: "Handicrafts" },

	// Agriculture and Natural Resources
	{ id: "agri", name: "کشاورزی", nameEn: "Agriculture" },
	{
		id: "agri-eng",
		name: "مهندسی کشاورزی",
		nameEn: "Agricultural Engineering",
	},
	{ id: "agri-plant", name: "گیاهپزشکی", nameEn: "Plant Pathology" },
	{ id: "agri-soil", name: "خاکشناسی", nameEn: "Soil Science" },
	{ id: "agri-hort", name: "باغبانی", nameEn: "Horticulture" },
	{ id: "agri-animal", name: "دامپزشکی", nameEn: "Veterinary Medicine" },
	{ id: "nat-res", name: "منابع طبیعی", nameEn: "Natural Resources" },
	{ id: "fish", name: "شیلات", nameEn: "Fisheries" },
	{ id: "forest", name: "جنگلداری", nameEn: "Forestry" },
	{ id: "rangeland", name: "مرتعداری", nameEn: "Rangeland Management" },

	// Management and Business
	{ id: "mgmt", name: "مدیریت", nameEn: "Management" },
	{ id: "mgmt-ba", name: "مدیریت بازرگانی", nameEn: "Business Administration" },
	{ id: "mgmt-mkt", name: "بازاریابی", nameEn: "Marketing" },
	{ id: "mgmt-fin", name: "مدیریت مالی", nameEn: "Financial Management" },
	{
		id: "mgmt-hr",
		name: "مدیریت منابع انسانی",
		nameEn: "Human Resource Management",
	},
	{ id: "mgmt-pub", name: "مدیریت دولتی", nameEn: "Public Administration" },
	{ id: "mgmt-ind", name: "مدیریت صنعتی", nameEn: "Industrial Management" },
	{ id: "acc", name: "حسابداری", nameEn: "Accounting" },
	{ id: "acc-audit", name: "حسابرسی", nameEn: "Auditing" },

	// Other
	{ id: "edu", name: "آموزش", nameEn: "Education" },
	{ id: "edu-elem", name: "آموزش ابتدایی", nameEn: "Elementary Education" },
	{ id: "edu-sec", name: "آموزش متوسطه", nameEn: "Secondary Education" },
	{ id: "edu-guid", name: "مشاوره", nameEn: "Counseling" },
	{ id: "other", name: "سایر", nameEn: "Other" },
];

export function searchUniversities(query: string): University[] {
	const normalized = query.trim().toLowerCase();
	if (!normalized || normalized === "سایر" || normalized === "other") {
		return IRANIAN_UNIVERSITIES;
	}
	return IRANIAN_UNIVERSITIES.filter(
		(u) =>
			u.name.includes(query) || u.nameEn.toLowerCase().includes(normalized),
	);
}

export function searchFaculties(query: string): Faculty[] {
	const normalized = query.trim().toLowerCase();
	if (!normalized || normalized === "سایر" || normalized === "other") {
		return COMMON_FACULTIES;
	}
	return COMMON_FACULTIES.filter(
		(f) =>
			f.name.includes(query) || f.nameEn.toLowerCase().includes(normalized),
	);
}

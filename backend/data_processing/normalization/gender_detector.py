"""Gender detection and normalization module for recruitment and hackathon applications.

Provides:
1. Canonical gender normalization for explicit/declared strings.
2. High-precision name-based gender detection fallback for South Asian (Indian), Western,
   and international names when gender is not explicitly provided in registration CSVs.
"""

import re
from typing import Any, Optional, Set


FEMALE_SYNONYMS: Set[str] = {
    "f",
    "female",
    "woman",
    "women",
    "girl",
    "girls",
    "lady",
    "w",
    "she",
    "her",
}

MALE_SYNONYMS: Set[str] = {
    "m",
    "male",
    "man",
    "men",
    "boy",
    "boys",
    "gentleman",
    "he",
    "him",
}

OTHER_SYNONYMS: Set[str] = {
    "o",
    "other",
    "others",
}

NON_BINARY_SYNONYMS: Set[str] = {
    "n",
    "non-binary",
    "nonbinary",
    "nb",
    "they",
    "them",
    "they/them",
}


def normalize_gender(val: Any) -> Optional[str]:
    """Normalizes an explicit gender declaration into canonical lowercase strings:
    'female', 'male', 'other', or 'non-binary'. Returns None if unparseable or missing.
    """
    if val is None:
        return None
    s = str(val).strip().lower()
    if not s or s in ("none", "null", "undefined", "n/a", "na", "-", "--"):
        return None

    if s in FEMALE_SYNONYMS or s.startswith("fem") or s.startswith("girl") or s.startswith("woman"):
        return "female"
    if s in MALE_SYNONYMS or (s.startswith("mal") and not s.startswith("mali")) or s.startswith("man"):
        return "male"
    if s in NON_BINARY_SYNONYMS or "non-binary" in s or "nonbinary" in s:
        return "non-binary"
    if s in OTHER_SYNONYMS:
        return "other"
    if s == "f":
        return "female"
    if s == "m":
        return "male"

    return s


# Comprehensive set of common female first names across Indian, South Asian, Western, and global registrations
FEMALE_FIRST_NAMES: Set[str] = {
    # Common Indian & South Asian female names
    "riya", "sana", "priya", "neha", "kavya", "tanvi", "ananya", "pooja", "puja", "jaya",
    "lavanya", "sneha", "yashvi", "anushka", "deepika", "shreya", "ishita", "swati", "aditi",
    "anjali", "meera", "mira", "divya", "shruti", "aarushi", "arushi", "akanksha", "simran",
    "tanya", "khushi", "muskan", "muskaan", "isha", "mansi", "vidhi", "riddhi", "siddhi",
    "palak", "diya", "dia", "mahak", "mehak", "komal", "sakshi", "srishti", "shrishti",
    "bhavya", "kriti", "kritika", "avani", "avantika", "niharika", "harini", "keerthi",
    "keerthana", "anupama", "malini", "sunita", "geeta", "gita", "anita", "rekha", "suman",
    "uma", "maya", "tara", "leela", "meenakshi", "kalyani", "saraswati", "rohini", "rashmi",
    "pratibha", "shweta", "preeti", "priti", "payal", "garima", "sonam", "shilpa", "shilpi",
    "raveena", "kajol", "katrina", "kareena", "priyanka", "sonakshi", "shraddha", "alia",
    "kiara", "janhvi", "sara", "disha", "samantha", "rashmika", "tamannaah", "tamanna",
    "nayanthara", "trisha", "bhavana", "nithya", "nazriya", "parvathy", "nimisha", "darshana",
    "aparna", "amala", "revathi", "suhasini", "shobana", "urvashi", "manju", "jyothika",
    "meena", "radha", "bhanupriya", "jayaprada", "sridevi", "madhuri", "juhi", "karisma",
    "urmila", "manisha", "twinkle", "sushmita", "aishwarya", "rani", "preity", "bipasha",
    "lara", "celina", "mallika", "kangana", "vidya", "konkona", "radhika", "kalki", "richa",
    "huma", "swara", "taapsee", "bhumi", "yami", "nushrratt", "fatima", "sanya", "mrunal",
    "wamiqa", "medha", "pallavi", "shikha", "vandana", "vandita", "mona", "sapna", "sheetal",
    "poonam", "chhavi", "kanika", "charu", "namrata", "archana", "alpana", "arpita", "ankita",
    "alisha", "anuradha", "barkha", "binita", "chetna", "damini", "dimple", "ekta", "gunjan",
    "heena", "hina", "hiral", "indira", "jagriti", "janki", "jasleen", "jhanvi", "jyoti",
    "kajal", "kalpana", "kamini", "kanchana", "kashish", "kiran", "latika", "madhu",
    "madhulika", "mahima", "mamta", "manpreet", "monika", "moumi", "nandini", "naina",
    "namita", "navya", "neelam", "nidhee", "nidhi", "nita", "nitika", "padma", "parul",
    "pranita", "prerna", "raagini", "ragini", "rakhi", "rashika", "reema", "rima", "ritu",
    "roopa", "rupa", "ruchika", "ruhi", "saumya", "somya", "seema", "shabana", "shalini",
    "shashi", "shivani", "shobha", "shuchi", "simi", "smita", "sonali", "sowmya", "spandana",
    "sukanya", "sunidhi", "supriya", "surabhi", "surbhi", "suvarna", "swarna", "tanu",
    "tanuja", "tejaswini", "urvi", "vaishali", "varsha", "vasudha", "vinita", "vrinda",
    "anushree", "ayushi", "bipasha", "chaitali", "deepali", "deepti", "dolly", "drasti",
    "drishti", "gayatri", "harshita", "hemali", "himani", "ishaani", "ishani", "ishwarya",
    "jagruti", "janhavi", "jaspreet", "juhee", "jyotsna", "kalyani", "kasturi", "kaveri",
    "khushboo", "krishnaa", "madhavi", "manjula", "manorama", "medhavi", "mithali", "mohini",
    "mridula", "mukta", "nandita", "natasha", "nayantara", "neeraja", "neetu", "nirmala",
    "nishita", "padmavati", "padmini", "parveen", "prabha", "prachi", "pragati", "pranali",
    "priti", "pushpa", "rachana", "rachna", "rajani", "rajeshwari", "rajni", "ramya",
    "ranjana", "renuka", "rhea", "richa", "rimzim", "rohita", "roshni", "ruchita", "rupa",
    "rupal", "rupali", "sabrina", "sadhana", "samiksha", "sandhya", "sangeeta", "sangita",
    "sanjana", "sanjoli", "santosh", "sarita", "saroj", "sarojini", "saumya", "savita",
    "savatri", "shailaja", "shaili", "shakuntala", "shanta", "sheela", "shikha", "shobhna",
    "shubha", "shubhangi", "smriti", "snigdha", "snehal", "sobia", "sona", "sonia",
    "sparsha", "sudha", "sujata", "sulekha", "sulochana", "sunanda", "sushila", "sushma",
    "swapan", "tannu", "tanushree", "tara", "trishna", "trupti", "tulsi", "ujwala",
    "upma", "upashna", "upasana", "usha", "utpala", "vaidehi", "vaishnavi", "vandita",
    "varnika", "vasundhara", "vedika", "veena", "vibha", "vidushi", "vijaya", "vijaylaxmi",
    "vinaya", "yasmin", "yashoda", "yukta", "zenab", "zoya",

    # Common Western & International female names
    "alice", "carol", "emma", "sarah", "sara", "elena", "jessica", "zainab", "aisha",
    "queen", "elizabeth", "mary", "patricia", "jennifer", "linda", "barbara", "susan",
    "margaret", "dorothy", "lisa", "nancy", "karen", "betty", "helen", "sandra", "donna",
    "carolyn", "ruth", "sharon", "michelle", "laura", "lauren", "emily", "kimberly",
    "deborah", "amy", "angela", "ashley", "brenda", "amanda", "anna", "olivia", "sophia",
    "charlotte", "amelia", "harper", "evelyn", "abigail", "sofia", "avery", "ella",
    "madison", "scarlett", "victoria", "aria", "grace", "chloe", "camila", "penelope",
    "riley", "layla", "lillian", "nora", "zoey", "zoe", "hannah", "hazel", "lily",
    "ellie", "violet", "stella", "aurora", "natalie", "emilia", "everly", "leah", "aubrey",
    "willow", "addison", "lucy", "audrey", "bella", "nova", "brooklyn", "paisley",
    "claire", "skylar", "isla", "genesis", "naomi", "caroline", "eliana", "valentina",
    "ruby", "kennedy", "ivy", "arianna", "aaliyah", "cora", "madelyn", "kinsley",
    "hailey", "gabriella", "allison", "gianna", "serenity", "autumn", "quinn", "eva",
    "piper", "sophie", "sadie", "delilah", "josephine", "adeline", "arya", "emery",
    "lydia", "clara", "vivian", "madeline", "peyton", "julia", "natalia", "jade",
    "athena", "maria", "leilani", "melanie", "mackenzie", "hadley", "kaylee", "rose",
    "katherine", "nicole", "rachel", "heather", "diane", "julie", "joyce", "kelly",
    "christina", "joan", "judith", "megan", "cheryl", "andrea", "martha", "jacqueline",
    "frances", "gloria", "ann", "teresa", "kathryn", "janice", "jean", "denise",
    "beverly", "amber", "doris", "marilyn", "danielle", "brittany", "diana", "jane",
    "lori", "tiffany", "kayla", "cathy", "tammy", "kathy", "monica", "charlene",
    "claudia", "lola", "vanessa", "wendy", "jill", "tina", "kristen", "katie",
    "kendra", "shannon", "erika", "erica", "brooke", "alicia", "paige", "chelsea",
    "beth", "veronica", "miranda", "courtney", "holly", "heidi", "alison", "melissa",
    "valerie", "jenna", "crystal", "cynthia", "debbie", "stacy", "stacey", "colleen",
    "brandy", "dawn", "carrie", "angie", "loretta", "yvonne", "carmen", "rosa",
    "gladys", "connie", "edna",
}

# Common male first names for contrast and verification
MALE_FIRST_NAMES: Set[str] = {
    "aarav", "rohan", "marcus", "vikram", "devansh", "arjun", "david", "mateo", "liam",
    "noah", "tariq", "siddharth", "bob", "farhan", "girish", "harsh", "ishan", "karan",
    "manish", "omkar", "pranav", "ravi", "tarun", "umesh", "varun", "waseem", "xavier",
    "alex", "john", "michael", "james", "robert", "william", "richard", "joseph", "thomas",
    "charles", "christopher", "daniel", "matthew", "anthony", "donald", "mark", "paul",
    "steven", "andrew", "kenneth", "joshua", "kevin", "brian", "george", "edward",
    "ronald", "timothy", "jason", "jeffrey", "ryan", "jacob", "gary", "nicholas",
    "eric", "jonathan", "stephen", "larry", "justin", "scott", "brandon", "benjamin",
    "samuel", "frank", "gregory", "raymond", "alexander", "patrick", "jack", "dennis",
    "jerry", "tyler", "aaron", "jose", "adam", "nathan", "henry", "douglas", "zachary",
    "peter", "kyle", "walter", "ethan", "jeremy", "harold", "keith", "christian",
    "roger", "gerald", "carl", "terry", "sean", "austin", "arthur", "lawrence", "jesse",
    "dylan", "bryan", "joe", "jordan", "billy", "bruce", "albert", "willie", "gabriel",
    "logan", "alan", "juan", "wayne", "roy", "ralph", "randy", "eugene", "vincent",
    "russell", "louis", "philip", "bobby", "johnny", "bradley", "aman", "abhishek",
    "aditya", "amit", "ankit", "anurag", "ayush", "deepak", "gaurav", "gourav",
    "harshit", "himanshu", "kartik", "mayank", "mohit", "nikhil", "pankaj", "prateek",
    "rahul", "rajat", "rishabh", "sachin", "saurabh", "shivam", "shubham", "sourabh",
    "sumit", "sunil", "suraj", "utkarsh", "vaibhav", "vikas", "vishal", "vivek",
}


def detect_gender_from_name(name: Optional[str]) -> Optional[str]:
    """Detects gender from full name or candidate name string when undisclosed in registration.

    Returns:
        'female', 'male', or None if uncertain.
    """
    if not name or not isinstance(name, str):
        return None

    clean = name.strip()
    if not clean:
        return None

    # Check honorifics / titles
    lower = clean.lower()
    if lower.startswith(("ms.", "ms ", "mrs.", "mrs ", "miss ", "smt.", "smt ")):
        return "female"
    if lower.startswith(("mr.", "mr ", "shri ", "master ", "sir ")):
        return "male"

    # Extract first name token, ignoring professional prefixes
    tokens = re.findall(r"[A-Za-z]+", clean)
    if not tokens:
        return None

    first = tokens[0].lower()
    if first in ("dr", "prof", "er", "engr") and len(tokens) > 1:
        first = tokens[1].lower()

    if first in FEMALE_FIRST_NAMES:
        return "female"
    if first in MALE_FIRST_NAMES:
        return "male"

    return None

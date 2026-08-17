"""Shared title / location filters for Product Management, TPM, Project Management, and Operations watchers.

The target profile includes:
- Product Management (PM, APM, Product Manager, Product Ops, Product Analyst, Product Strategy)
- Technical Program Management (TPM, Technical Program Manager, Program Manager)
- Project Management (Project Manager, Project Coordinator, Project Lead)
- Operations (Business Operations, BizOps, TechOps, Strategy & Operations, Operations Analyst, People/Sales/Revenue/Supply Chain Ops)

Pure Software Engineering, developer, hardware, and data science roles are excluded unless they are PM/TPM/Project Management roles.
"""

import re

INTERN_RE = re.compile(
    r"\bintern(ship)?\b|\bco[- ]?op\b|\bstudent\b|\bfellow(ship)?\b|\bapprentice(ship)?\b",
    re.I,
)

# PM, TPM, and Project Management roles
PM_TPM_PROJECT_RE = re.compile(
    r"\bproduct manage|\bproduct manager\b|\bproduct management\b|\bapm\b|"
    r"\bproduct intern\b|\bproduct ops\b|\bproduct operations\b|\bproduct strategy\b|\bproduct analyst\b|"
    r"\btechnical program\b|\btpm\b|\bprogram manage|\bprogram manager\b|\bprogram management\b|"
    r"\bproject manage|\bproject manager\b|\bproject management\b|\bproject coordinator\b|\bproject lead\b|"
    r"\bproject analyst\b|\bproject specialist\b|\bprogram coordinator\b",
    re.I,
)

# Operations roles
OPERATIONS_RE = re.compile(
    r"\boperations\b|\bbizops\b|\bbusiness operations\b|\btechops\b|\btechnical operations\b|"
    r"\bstrategy & operations\b|\bstrategy and operations\b|\boperations analyst\b|\boperations intern\b|"
    r"\bpeople operations\b|\bsales operations\b|\bmarketing operations\b|\brevenue operations\b|\brevops\b|"
    r"\bsupply chain operations\b|\bclinical operations\b|\bfield operations\b|\boperations associate\b|"
    r"\boperations specialist\b|\boperations coordinator\b|\boperations lead\b|\boperations management\b|"
    r"\boperations program\b",
    re.I,
)

# Pure SWE / Hardware / Developer keywords to exclude when NOT part of PM/TPM/Project Management
EXCLUDE_DEV_RE = re.compile(
    r"\bsoftware\b|\bdeveloper\b|\bdevelopment\b|\bswe\b|"
    r"\bhardware\b|\belectrical\b|\bmechanical\b|\bfirmware\b|\bsilicon\b|"
    r"\bsdet\b|\bqa\b|\btest engineer\b|\bquality assurance\b|"
    r"full[- ]?stack|front[- ]?end|back[- ]?end|"
    r"machine learning|data scien",
    re.I,
)

US_HINT_RE = re.compile(
    r"united states|\busa?\b|u\.s\.|remote.*(us|america)|"
    r"alabama|alaska|arizona|arkansas|california|colorado|connecticut|"
    r"delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|"
    r"kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|"
    r"mississippi|missouri|montana|nebraska|nevada|new hampshire|"
    r"new jersey|new mexico|new york|north carolina|north dakota|ohio|"
    r"oklahoma|oregon|pennsylvania|rhode island|south carolina|"
    r"south dakota|tennessee|texas|utah|vermont|virginia|washington|"
    r"west virginia|wisconsin|wyoming|"
    r"san francisco|\bnyc\b|seattle|austin|boston|chicago|denver|atlanta|"
    r"los angeles|mountain view|palo alto|sunnyvale|san jose|menlo park|"
    r"bellevue|redmond|\bd\.?c\.?\b|miami|dallas|houston|philadelphia|"
    r"pittsburgh|portland|san diego|santa clara|cupertino|irvine|"
    r"nashville|charlotte|phoenix|salt lake|"
    r",\s?(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|"
    r"MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|"
    r"TN|TX|UT|VT|VA|WA|WV|WI|WY)\b",
    re.I,
)

NON_US_RE = re.compile(
    r"canada|ontario|toronto|vancouver|montr[eé]al|quebec|calgary|ottawa|"
    r"waterloo|british columbia|united kingdom|\buk\b|london|ireland|"
    r"dublin|germany|berlin|munich|france|paris|netherlands|amsterdam|"
    r"belgium|spain|madrid|barcelona|portugal|lisbon|italy|milan|"
    r"switzerland|zurich|geneva|austria|vienna|poland|warsaw|krakow|"
    r"czech|prague|sweden|stockholm|norway|oslo|denmark|copenhagen|"
    r"finland|helsinki|estonia|tallinn|romania|bucharest|hungary|"
    r"budapest|israel|tel aviv|\buae\b|dubai|abu dhabi|saudi|riyadh|"
    r"india|bangalore|bengaluru|hyderabad|mumbai|delhi|gurgaon|gurugram|"
    r"chennai|pune|noida|singapore|malaysia|kuala lumpur|indonesia|"
    r"jakarta|vietnam|thailand|bangkok|philippines|manila|china|beijing|"
    r"shanghai|shenzhen|hangzhou|hong kong|taiwan|taipei|japan|tokyo|"
    r"osaka|korea|seoul|australia|sydney|melbourne|brisbane|new zealand|"
    r"auckland|brazil|paulo|mexico|guadalajara|argentina|buenos aires|"
    r"colombia|bogot|chile|santiago|nigeria|lagos|egypt|cairo|kenya|"
    r"nairobi|south africa|turkey|istanbul|ukraine|kyiv|serbia|belgrade|"
    r"bulgaria|sofia|croatia|zagreb|lithuania|vilnius|latvia|riga|"
    r"armenia|yerevan|cyprus|malta|luxembourg|emea|apac|latam|"
    r",\s?(?-i:ON|QC|BC|AB|MB|SK|NS|NB|NL|PE|YT)\b",
    re.I,
)


FULLTIME_EXCLUDE_RE = re.compile(
    r"\bsenior\b|\bsr\.?\b|\bstaff\b|\bprincipal\b|\bdirector\b|\bvp\b|\bhead of\b|\bvice president\b",
    re.I,
)


def wanted_title(title: str) -> bool:
    """True for an in-profile PM, TPM, Project Management, or Operations internship."""
    # MUST contain an internship/co-op/student keyword
    if not INTERN_RE.search(title):
        return False
    # Exclude senior full-time indicators
    if FULLTIME_EXCLUDE_RE.search(title):
        return False
    # PM, TPM, and Project Management roles are always matched
    if PM_TPM_PROJECT_RE.search(title):
        return True
    # Pure software / hardware / dev roles without PM/TPM/Project are excluded
    if EXCLUDE_DEV_RE.search(title):
        return False
    # Operations roles
    if OPERATIONS_RE.search(title):
        return True
    return False


def is_us(location: str) -> bool:
    """US hint wins, then a clearly-foreign hint loses; ambiguous strings
    (bare "Remote", city-only names) are kept rather than dropped.

    Multi-location rows ("Toronto, ON · New York, NY") keep on the US hit,
    so a role that is US-available anywhere still gets through.
    """
    if not location:
        return True
    if US_HINT_RE.search(location):
        return True
    if NON_US_RE.search(location):
        return False
    return True

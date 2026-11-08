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
    r"\bintern(?:s|ships?|ing)?\b|"
    r"\bco[- ]?ops?\b|\bcoops?\b|\bco[- ]?operatives?\b|"
    r"\bstudents?\b|\bundergrad(?:uate)?s?\b|\bpostgrad(?:uate)?s?\b|"
    r"\btrainees?(?:hips?)?\b|\bapprentices?(?:hips?)?\b|\bfellows?(?:hips?)?\b|"
    r"\bplacements?\b|\bindustrial placement\b|\bwork[- ]?study\b|"
    r"\bpracticum\b|\bstagiaires?\b",
    re.I,
)

# PM, TPM, and Project Management roles
PM_TPM_PROJECT_RE = re.compile(
    r"\bproduct manage|\bproduct manager\b|\bproduct management\b|\bapm\b|"
    r"\bproduct\s+(?:intern(?:s|ships?|ing)?|co[- ]?ops?|coops?|students?|trainees?|fellows?|placements?)\b|"
    r"\bproduct ops\b|\bproduct operations\b|\bproduct strategy\b|\bproduct analyst\b|"
    r"\btechnical program\b|\btpm\b|\bprogram manage|\bprogram manager\b|\bprogram management\b|"
    r"\bprogram\s+(?:intern(?:s|ships?|ing)?|co[- ]?ops?|coops?|students?|trainees?|fellows?|placements?)\b|"
    r"\bproject manage|\bproject manager\b|\bproject management\b|\bproject coordinator\b|\bproject lead\b|"
    r"\bproject\s+(?:intern(?:s|ships?|ing)?|co[- ]?ops?|coops?|students?|trainees?|fellows?|placements?)\b|"
    r"\bproject analyst\b|\bproject specialist\b|\bprogram coordinator\b|"
    r"\bgestion de (?:projet|produit)\b",
    re.I,
)

# Operations roles
OPERATIONS_RE = re.compile(
    r"\bop[eé]rations?\b|\bbiz[- ]?ops\b|\bbusiness op[eé]rations?\b|\btech[- ]?ops\b|\btechnical op[eé]rations?\b|"
    r"\bstrategy\s*(?:&|and)\s*op[eé]rations?\b|\bstrategy\s+ops\b|\bop[eé]rations?\s+analyst\b|"
    r"\bop[eé]rations?\s+intern(?:s|ships?|ing)?\b|\bops\s+intern(?:s|ships?|ing)?\b|\bops\s+co[- ]?ops?\b|"
    r"\b(?:people|sales|marketing|revenue|strategy|business|supply chain|field|clinical|commercial)\s+ops\b|"
    r"\b(?:people|sales|marketing|revenue|supply chain|clinical|field|commercial)\s+op[eé]rations?\b|"
    r"\brev[- ]?ops\b|\bop[eé]rations?\s+associate\b|\bop[eé]rations?\s+specialist\b|\bop[eé]rations?\s+coordinator\b|"
    r"\bop[eé]rations?\s+lead\b|\bop[eé]rations?\s+management\b|\bop[eé]rations?\s+program\b",
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

CANADA_HINT_RE = re.compile(
    r"canada|\bcan\b|ontario|quebec|qu[eé]bec|british columbia|alberta|"
    r"manitoba|saskatchewan|nova scotia|new brunswick|newfoundland|"
    r"prince edward island|yukon|northwest territories|nunavut|"
    r"toronto|vancouver|montr[eé]al|calgary|ottawa|waterloo|kitchener|"
    r"edmonton|winnipeg|halifax|mississauga|markham|burnaby|gatineau|"
    r"hamilton,\s?on|london,\s?on|victoria,\s?bc|regina|saskatoon|"
    r",\s?(?-i:ON|QC|BC|AB|MB|SK|NS|NB|NL|PE|YT|NT|NU)\b",
    re.I,
)

NON_US_RE = re.compile(
    r"united kingdom|\buk\b|london|ireland|"
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
    r"armenia|yerevan|cyprus|malta|luxembourg|emea|apac|latam",
    re.I,
)


FULLTIME_EXCLUDE_RE = re.compile(
    r"\bsenior\b|\bsr\.?\b|\bstaff\b|\bprincipal\b|\bdirector\b|\bvp\b|\bhead of\b|\bvice president\b|\bchancellor\b|\bassociate vice\b",
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


def is_us_or_canada(location: str) -> bool:
    """A US or Canada hint wins, then a clearly-foreign hint loses; ambiguous
    strings (bare "Remote", city-only names) are kept rather than dropped.

    Multi-location rows ("London, UK · Toronto, ON") keep on the US/Canada
    hit, so a role that is available in either country anywhere gets through.
    """
    if not location:
        return True
    if US_HINT_RE.search(location) or CANADA_HINT_RE.search(location):
        return True
    if NON_US_RE.search(location):
        return False
    return True


# Backward-compatibility alias
is_us = is_us_or_canada

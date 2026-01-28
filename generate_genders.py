import json
import re
import krcg.vtes
import gender_guesser.detector as gender

# Inicializamos KRCG y el Detector
krcg.vtes.VTES.load()
d = gender.Detector()

# --- DICCIONARIO MANUAL DE EXCEPCIONES (Hardcoded) ---
# Agrega aquí los vampiros que el detector falle.
# M = Male, F = Female
MANUAL_OVERRIDES = {
    # Original overrides
    "Enkidu": "M", "Lodin": "M", "Maldavis": "F", "Xipe Totec": "M",
    "The Dracon": "M", "Vasilisa": "F", "Baba Yaga": "F", "Lambach": "M",
    "Kemintiri": "F", "Mitrash": "M", "Tegyrius": "M", "Hela": "F",
    "Nergal": "M", "Lazverinus": "M", "Appolonius": "M", "Vitel": "M",
    "Qadir": "M", "Al-Ashrad": "M", "Anson": "M", "Arika": "F",
    "Paramekkala": "F", "Unmada": "M", "Anatole": "M", "Moncada": "M",
    "Sascha Vykos": "M",  # Lore-wise es complejo, pero visualmente suele ser M/Andrógino
    "Dr. Saba": "F", "Zelios": "M", "Stansha": "F", "Dorian Strack": "M",
    # --- Expanded overrides (well-known VTES vampires) ---
    # Methuselahs / Famous
    "Beckett": "M", "Lucita": "F", "Cybele": "F", "Lazarus": "M",
    "Hecate": "F", "Icarus": "M", "Carna": "F", "Critias": "M",
    "Jaroslav Pascek": "M", "Gratiano": "M", "Goratrix": "M",
    "Velya": "F", "Brunhilde": "F", "Djanela": "F", "Genina": "F",
    "Ambrogino Giovanni": "M", "Horrock": "M", "Tariq": "M",
    "Navaja": "M", "Pisha": "F", "Ecaterina the Wise": "F",
    "Ecaterina": "F", "Dmitra Ilyanova": "F", "Dmitra": "F",
    "Neighbor John": "M", "Neighbor": "M",
    # Sabbat
    "Tzimisce": "M", "Thetmes": "M", "Melinda Galbraith": "F",
    "Radu Bistri": "M", "Borges": "M", "Xaviar": "M",
    # Camarilla
    "Hardestadt": "M", "Petrodon": "M", "Schrekt": "M",
    "Saulot": "M", "Tremere": "M", "Etrius": "M",
    # Giovanni / Hecata
    "Ambrogino": "M", "Pochtli": "M", "Khazar's Diary": "M",
    # Assamite / Banu Haqim
    "Ur-Shulgi": "M", "Izhim abd Azrael": "M", "Izhim": "M",
    # Followers of Set / Ministry
    "Nefertiti": "F", "Qufur am Hansen": "M", "Qufur": "M",
    # Ravnos
    "Hazimel": "M", "Ravnos": "M",
    # Gangrel
    "Angus the Unruled": "M", "Angus": "M",
    # Nosferatu
    "Calebros": "M", "Cock Robin": "M",
    # Malkavian
    "Lutz von Hohenzollern": "M", "Lutz": "M", "Unmada": "M",
    # Toreador
    "Francois Villon": "M", "Francois": "M",
    # Ventrue
    "Jan Pieterzoon": "M", "Democritus": "M",
    # Brujah
    "Theo Bell": "M", "Theo": "M",
    # Imbued
    "Jennie Orne": "F", "Travis Miller": "M",
    # Laibon
    "Ayo Igbon": "F", "Ayo": "F", "Kamiri wa Itherero": "M",
    # Various
    "Beetleman": "M", "Tupdog": "M", "Matthias": "M",
    "Nakhthorheb": "M", "Nana Buruku": "F", "Ambrosius": "M",
    "Gitane St. Claire": "F", "Gitane": "F",
    "Saqqaf": "M", "Suhailah": "F", "Djuhah": "M",
    "Ghiyath": "M", "Yazid Tamari": "M", "Yazid": "M",
    "Nehemiah": "M", "Elimelech": "M", "Esau": "M",
    "Shabah": "M", "Rutor": "M", "Darvag": "M",
    "Nuriel": "M", "Bulscu": "M", "Korah": "M",
    "Cailean": "M", "Obediah": "M", "Sela": "F",
    "Abebe": "M", "Nkule Galadima": "M", "Nkule": "M",
    "Isouda de Blaise": "F", "Isouda": "F",
    "Sha-Ennu": "M", "Adana de Sforza": "F", "Adana": "F",
    # --- Round 2: From remaining unknowns list ---
    # Clearly male names
    "Abaddon": "M", "Abdelsobek": "M", "Adrino Manauara": "M",
    "Agaitas": "M", "Ahmose Chambers": "M", "Alcoan": "M",
    "Aleister Crowley": "M", "Alek König": "M", "Allonzo Montoya": "M",
    "Almodo Giovanni": "M", "Amenophobis": "M", "Appius Claudius Corvus": "M",
    "Ardan Lane": "M", "Aristotle de Laurent": "M", "Asguresh": "M",
    "Ash Harrison": "M", "Ashur-uballit": "M", "Babalawo Alafin": "M",
    "Banjoko": "M", "Baron Dieudonne": "M", "Barth": "M",
    "Beauregard Krueller": "M", "Bindusara": "M", "Borges": "M",
    "Bothwell": "M", "Brachah": "M", "Calebos": "M", "Caliban": "M",
    "Cardano": "M", "Casey Snyder": "M", "Castellan": "M",
    "Cesewayo": "M", "Christanius Lionel": "M", "Cicatriz": "M",
    "Claven": "M", "Cohn Rose": "M", "Count Germaine": "M",
    "Count Jocalo": "M", "Count Ormonde": "M", "Cristobal Ghiberti": "M",
    "Cristofero Giovanni": "M", "Cristos Mantigo": "M", "Cyscek": "M",
    "De Sade": "M", "DeSalle": "M", "Dedefra": "M", "Demdemeh": "M",
    "Devyn": "M", "Doctor Morocco": "M", "Doctor Streck": "M",
    "Dodd": "M", "Don Caravelli": "M", "Don Cerro": "M",
    "Don Cruez": "M", "Dr. Jest": "M", "Dr. Morrow": "M",
    "Dr. Sutton Gassaway": "M", "Droescher One-Eye": "M", "Drozodny": "M",
    "Dúnal O'Connor": "M", "Ebanezer Roush": "M", "Egothha": "M",
    "Ehrich Weiss": "M", "Eliott Sinclair": "M", "Ellison Humboldt": "M",
    "Enam": "M", "Erebus": "M", "Faruq": "M", "Faruq Abd al-Qadir": "M",
    "Father Juan Carlos": "M", "Feo Ramos": "M", "Ferox": "M",
    "Fida'i": "M", "Fidus": "M", "Fode Kourouma": "M", "Foureyes": "M",
    "Frondator": "M", "Frère Marc": "M", "Fustuk": "M", "Ganhuru": "M",
    "Gatjil Munyarryun": "M", "Gavrylo": "M", "Gebeyehu Abdu": "M",
    "Gharston Roland": "M", "Ghivran Dalaal": "M", "Gillespi Giovanni": "M",
    "Glycon": "M", "Gnaeus Aemilius Augustinus": "M", "Gold Pan Dan": "M",
    "Gracetius": "M", "Gracis Nostinus": "M", "Grendel the Worm-Eaten": "M",
    "Grimgroth": "M", "Guedado": "M", "Guggenheim": "M",
    "Gustaphe Brunnelle": "M", "Handsome Dan": "M", "Hannigan": "M",
    "Harrod": "M", "Hasani": "M", "Heinrick Schlempt": "M",
    "Hesha Ruhadze": "M", "Honest Abe": "M", "Hrothulf": "M",
    "Huang": "M", "Huitzilopochtli": "M", "Hukros": "M",
    "Igo the Hungry": "M", "Itzahk Levine": "M",
    "J. Oswald \"Ozzy\" Hyde-White": "M", "Jacko": "M", "Jaggedy Andy": "M",
    "Jayakumar": "M", "Jephta Hester": "M", "Jubal": "M", "Juggler": "M",
    "Kabede Maru": "M", "Kamaluddin": "M", "Kamau Jafari": "M",
    "Karif al Numair": "M", "Kashan": "M", "Kassiym Malikhair": "M",
    "Keller Thiel": "M", "Kenyatta": "M", "Kephamos": "M", "Kervos": "M",
    "Khalu": "M", "Khay'tall": "M", "Kij Dansky": "M", "Kiradin": "M",
    "Kostantin": "M", "Krid": "M", "Ladislas Toth": "M",
    "Lazarus James": "M", "Lernean": "M", "Lithrac": "M",
    "Little Tailor of Prague": "M", "Little Willie": "M",
    "Lord Ashton": "M", "Lord Fianna": "M", "Lord Tremere": "M",
    "Lord Vauxhall": "M", "Lumumba": "M", "MacAlister Marshall": "M",
    "Macoute": "M", "Malachai": "M", "Marconius": "M",
    "Matata": "M", "Mazz": "M", "Menele": "M", "Midget": "M",
    "Miller Delmardigan": "M", "Mimir": "M", "Mister Schwartz": "M",
    "Modius": "M", "Montecalme": "M", "Morel": "M", "Morlock": "M",
    "Morrow the Sage": "M", "Mosfair": "M", "Mowgli": "M", "Mr. Noir": "M",
    "Muhandis": "M", "Nails": "M", "Navar McClaren": "M", "Neferu": "M",
    "Nehsi": "M", "Nichodemus": "M", "Nickolai": "M", "Nizzam al-Latif": "M",
    "Nostoket": "M", "Nu": "M", "Ogwon": "M", "Okulos": "M",
    "Old Neddacka": "M", "Osric Vladislav": "M", "Otieno": "M",
    "Ox": "M", "Ozmo": "M", "Panagos Levidis": "M", "Papa Legba": "M",
    "Parnassus": "M", "Pedrag Hasek": "M", "Phagian": "M", "Phaibun": "M",
    "Porphyrion": "M", "Porphyry": "M", "Prentis Derby": "M",
    "Pug Jackson": "M", "Pugfar": "M", "Rafaele Giovanni": "M",
    "Raful al-Zarqa": "M", "Rake": "M", "Ramiel DuPre": "M",
    "Ransam": "M", "Rashiel": "M", "Rathmere": "M", "Redbone McCray": "M",
    "Regilio": "M", "Remilliard": "M", "Reverend Adams": "M",
    "Reverend Blackwood": "M", "Reverend Djoser Jones": "M",
    "Rexton \"Savage\" Abernathy": "M", "Richter": "M", "Rigby": "M",
    "Rudolfo Giovanni": "M", "Rurik Rakoczy": "M", "Rusticus": "M",
    "Saiz": "M", "Sakhar": "M", "Salbatore Bokkengro": "M",
    "Salinger": "M", "Sanjo": "M", "Sargon": "M", "Saxum": "M",
    "Sennadurek": "M", "Servius Marius Pustula": "M",
    "Sir Henry Johnson": "M", "Sir Marriot D'Urban": "M",
    "Sir Ralph Hamilton": "M", "Sir Walter Nash": "M",
    "Sisocharis": "M", "Skidmark": "M", "Spiridonas": "M",
    "Stravinsky": "M", "Strohmann": "M", "Styles Margs": "M",
    "Sutekh": "M", "Synesios": "M", "Talley": "M", "Tamoszius": "M",
    "Tansu Bekir": "M", "Tarautas": "M", "Tarbaby Jack": "M",
    "Tarrence Moore": "M", "Tayshawn Kearns": "M", "The Ankou": "M",
    "The Arcadian": "M", "The Colonel": "M", "Thelonius": "M",
    "Themistocles": "M", "Thomasso Ghiberti": "M", "Tock": "M",
    "Tomaine": "M", "Torvus Bloodbeard": "M", "Troius": "M",
    "Tusk": "M", "Ubende": "M", "Ulugh Beg": "M",
    "Uncle George": "M", "Vaclav Petalengro": "M",
    "Valois Sang": "M", "Vardar Vardarian": "M", "Vedel Esbreno": "M",
    "Veejay Vinod": "M", "Verbruch": "M", "Verrix": "M", "Vestgeir": "M",
    "Vliam Andor": "M", "Volo": "M", "Wah Chun-Yuen": "M",
    "Wamukota": "M", "Warmaksan": "M", "Weirich Waldburg": "M",
    "Xendil Charmer": "M", "Yitzak": "M", "Yorik": "M",
    "Ysador the Foul": "M", "Zebulon": "M", "Étienne Fauberge": "M",
    "Hiram \"Hide\" DeVries": "M", "Holliday \"Burgundy\" Hall": "M",
    "Saku Pihlajamäki": "M", "Jean-François": "M",
    # Clearly female names
    "Aaradhya": "F", "Adhiambo": "F", "Aelswith": "F",
    "Aisata Swanou": "F", "Aksinya Daclau": "F", "Amisa": "F",
    "Anjalika Underwood": "F", "Anousha": "F", "Ariadne": "F",
    "Arishat": "F", "Atiena": "F", "Aunt Linda": "F",
    "Ayelea": "F", "Ayelech": "F", "Belinde": "F", "Berenguela": "F",
    "Bituin": "F", "Bloody Mary": "F", "Bupe Kuila": "F",
    "Celine Chevalier": "F", "Chalcedony": "F", "Charice Fontaigne": "F",
    "Chrysanthemum": "F", "Clea Auguste d'Holford": "F", "Concordia": "F",
    "Creamy Jade": "F", "Daliyah": "F", "Dame Hollerton": "F",
    "Dancin' Dana": "F", "Dark Selina": "F", "Darva Felispa": "F",
    "Delizbieta of the Dark Eyes": "F", "Denette Stensen": "F",
    "Dhita Choudhair": "F", "Doc Martina": "F", "Dolie": "F", "Dorka": "F",
    "Dovey Ebfwe": "F", "Epikasta Rigatos": "F", "Erichtho": "F",
    "Erinyi": "F", "Esoara": "F", "Eurayle Gelasia Mylonas": "F",
    "Frau Schödel": "F", "Gelasia Fotiou": "F", "Gentha Shale": "F",
    "Gitane St. Claire": "F", "Greer Worder": "F",
    "Isouda de Blaise": "F", "Ismitta": "F", "Inyanga": "F",
    "Jezebelle": "F", "Kahina the Sorceress": "F", "Kalila": "F",
    "Kalinda": "F", "Kallista": "F", "Kamaria": "F",
    "Karmenita Yoryari": "F", "Kestrelle Hayes": "F", "Khin Aye": "F",
    "La Viuda Blanca": "F", "Laika": "F", "Lailah": "F",
    "Lenelle": "F", "Lisé": "F", "Luccia Paciola": "F",
    "Lucinde": "F", "Ludmijla Rakoczy": "F", "Madame Guil": "F",
    "Magdelena Schaefer": "F", "Malgorzata": "F", "Maman Boumba": "F",
    "Mambo Jeanne": "F", "Marchesa Liliana": "F", "Masika": "F",
    "Masika St. John": "F", "Matasuntha": "F", "Mercy": "F",
    "Meshenka": "F", "Mirembe Kabbada": "F", "Mistress Fanchon": "F",
    "Muricia": "F", "Nadima": "F", "Nakova": "F", "Nangila Were": "F",
    "Nayarana": "F", "Nepata": "F", "Neserian": "F", "Ohanna": "F",
    "Oluwafunmilayo": "F", "Omaya": "F", "Onaedo": "F",
    "Panya": "F", "Persephone Tar-Anis": "F", "Persia": "F",
    "Phaedyme": "F", "Pherydima": "F", "Qawiyya el-Ghaduba": "F",
    "Quira": "F", "Radeyah": "F", "Raziya Samater": "F",
    "Renenet": "F", "Roreca Quaid": "F", "Sahana": "F",
    "Sarisha Veliku": "F", "Sarrasine": "F", "Scarlet Carson O'Toole": "F",
    "Sennuwy": "F", "Seraphina": "F", "Shahara al-Rashwa": "F",
    "Shawnda Dorrit": "F", "Sister Evelyn": "F", "Skryta Zyleta": "F",
    "Smallpox Griet": "F", "Sobayifa": "F", "Sreelekha": "F",
    "Sri Sansa": "F", "Suhailah": "F", "Sukainah": "F",
    "Suwira": "F", "Thucimia": "F", "Troglodytia": "F",
    "Tryphosa": "F", "Tsunda": "F", "Tura Vaughn": "F",
    "Undele": "F", "Urenna Bunu": "F", "Urraca": "F",
    "Valkyrie": "F", "Vasantasena": "F", "Virstania": "F",
    "White Lily": "F", "Yewon Ong": "F", "Yurena": "F",
    "Zhara": "F", "Zubeida": "F", "Zoé": "F",
    "Ashlesha": "F", "Amaravati": "F", "Ankh-sen-Sutekh": "F",
    "Lectora": "F", "Leumeah": "F", "Dominique": "F",
    "Dominique Santo Paulo": "F", "Min-seo": "F", "Kuyén": "F",
    # Gender-neutral / animal / monster names → keep as "?" or assign contextually
    "Tupdog": "M", "Beetleman": "M", "Anvil": "M", "Badger": "M",
    "Bear Paw": "M", "Black Wallace": "M", "Blackhorse Tanner": "M",
    "Blister": "M", "Boss Callihan": "M", "Brazil": "M", "Crow": "M",
    "Crusher": "M", "Duck": "M", "Fish": "M", "Kite": "M",
    "Mouse": "M", "Soldat": "M", "Spider": "M", "Spider-Killer": "M",
    "Stick": "M", "Sundown": "M", "Vulture": "M", "Whisper": "M",
    "Zip": "M", "Apache Jones": "M", "Ember Wright": "F",
    "Jazz Wentworth": "F", "Jing Wei": "F", "Bijou": "F",
    "Dollface": "F", "Echo": "F", "Muse": "F", "Topaz": "F",
    "Juniper": "F", "Greensleeves": "M",
    # Coach/nicknames
    "\"Coach\" Tyrone Soros": "M",
    "Leaf \"Potter116\" Pankowski": "M",
    # Titles that indicate gender
    "The Dowager": "F", "The Guardian": "M", "The Medic": "M",
    # Imbued
    "Righteous Endeavor": "M",
    "Lodin (Olaf Holte)": "M",
}


def strip_group_notation(name):
    """Strip (G1), (G2), (ADV), etc. from card names."""
    name = re.sub(r'\s*\([Gg]\d+\)\s*$', '', name)
    name = re.sub(r'\s*\(.*[Aa][Dd][Vv].*\)\s*$', '', name)
    return name.strip()


def get_clean_name(full_name):
    """Clean name for gender detection: strip group notation, titles, suffixes."""
    name = strip_group_notation(full_name)

    # "Enkidu, The Noah" -> "Enkidu"
    name = name.split(",")[0].strip()

    # Strip titles
    for prefix in ["The ", "Dr. ", "Lord ", "Lady ", "Prince ", "Baron ", "Don ", "Doña "]:
        if name.startswith(prefix):
            rest = name[len(prefix):]
            if rest:
                name = rest
            break

    return name


def detect_gender_from_pronouns(card_text):
    """Detect gender by counting gendered pronouns in card text.
    Returns 'M', 'F', or None if inconclusive."""
    if not card_text:
        return None

    text = card_text.lower()

    # Male pronouns/possessives (word boundaries to avoid false matches)
    male_patterns = [r'\bhe\b', r'\bhis\b', r'\bhim\b', r'\bhimself\b']
    # Female pronouns/possessives
    female_patterns = [r'\bshe\b', r'\bher\b', r'\bhers\b', r'\bherself\b']

    male_count = sum(len(re.findall(p, text)) for p in male_patterns)
    female_count = sum(len(re.findall(p, text)) for p in female_patterns)

    # Only decide if there's a clear signal (at least 1 match, and not conflicting)
    if male_count > 0 and female_count == 0:
        return "M"
    elif female_count > 0 and male_count == 0:
        return "F"
    elif male_count > female_count and male_count >= 2:
        return "M"
    elif female_count > male_count and female_count >= 2:
        return "F"

    return None  # Ambiguous or no pronouns


def detect_gender(card_name, card_text=None):
    # Strip group notation for override lookup
    base_name = strip_group_notation(card_name)

    # 1. Check manual overrides (try full name, then first part before comma)
    if base_name in MANUAL_OVERRIDES:
        return MANUAL_OVERRIDES[base_name]
    short_name = base_name.split(",")[0].strip()
    if short_name in MANUAL_OVERRIDES:
        return MANUAL_OVERRIDES[short_name]

    # 2. Clean name for detector
    clean_name = get_clean_name(card_name)

    # 3. Try full clean name first
    guess = d.get_gender(clean_name)
    if "female" in guess:
        return "F"
    elif "male" in guess:
        return "M"

    # 4. Try just the first word (first name)
    first_word = clean_name.split()[0] if clean_name.split() else clean_name
    if first_word != clean_name:
        guess = d.get_gender(first_word)
        if "female" in guess:
            return "F"
        elif "male" in guess:
            return "M"

    # 5. Try pronoun detection from card text
    pronoun_result = detect_gender_from_pronouns(card_text)
    if pronoun_result:
        return pronoun_result

    return "?"  # Desconocido/Monstruo/Nombre raro


# --- PROCESO PRINCIPAL ---
print("Generando base de datos de géneros...")
gender_map = {}
unknowns = []
crypt_cards = [c for c in krcg.vtes.VTES if c.types and ("Vampire" in c.types or "Imbued" in c.types)]

count_m = 0
count_f = 0
count_x = 0
count_by_pronoun = 0

for card in crypt_cards:
    card_text = getattr(card, 'card_text', '') or ''
    g = detect_gender(card.name, card_text)
    gender_map[card.id] = g

    if g == "M":
        count_m += 1
    elif g == "F":
        count_f += 1
    else:
        count_x += 1
        unknowns.append(card.name)

    # Track how many were resolved by pronoun detection
    # (i.e., name-based detection failed but pronouns worked)
    base_name = strip_group_notation(card.name)
    short_name = base_name.split(",")[0].strip()
    if base_name not in MANUAL_OVERRIDES and short_name not in MANUAL_OVERRIDES:
        clean = get_clean_name(card.name)
        name_guess = d.get_gender(clean)
        first_word = clean.split()[0] if clean.split() else clean
        first_guess = d.get_gender(first_word) if first_word != clean else "unknown"
        if "male" not in name_guess and "female" not in name_guess and \
           "male" not in first_guess and "female" not in first_guess:
            pronoun_r = detect_gender_from_pronouns(card_text)
            if pronoun_r:
                count_by_pronoun += 1

# Guardar JSON
with open("vtes_gender.json", "w", encoding="utf-8") as f:
    json.dump(gender_map, f, indent=2)

print(f"¡Listo! Archivo 'vtes_gender.json' creado.")
print(f"Total crypt cards: {len(crypt_cards)}")
print(f"Estadísticas: Masc: {count_m} | Fem: {count_f} | Desconocido (?): {count_x}")
print(f"Detectados por pronombres en card_text: {count_by_pronoun}")
print(f"\n--- Desconocidos ({count_x}) ---")
for name in sorted(unknowns):
    print(f"  {name}")
print("\nNOTA: Revisa los '?' y agrégalos a MANUAL_OVERRIDES si son importantes.")

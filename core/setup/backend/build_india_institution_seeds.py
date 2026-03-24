"""One-off generator: writes india_institutions_engineering_100.json and india_institutions_bschools.json."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "data" / "seeds" / "directory"


def slug(s: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")
    return (s or "x")[:60]


def fav(domain: str) -> str:
    d = domain.replace("www.", "").split("/")[0].strip()
    return f"https://www.google.com/s2/favicons?domain={d}&sz=256"


def inst_row(
    name: str,
    short: str,
    city: str,
    state: str,
    fy: int,
    itype: str,
    domain: str,
    wiki: str,
    extra: str = "",
) -> dict:
    desc = (
        f"{short} is a campus in {city}, {state}, India, chartered in {fy}. "
        f"{extra} "
        f"It offers accredited degree programmes, graduate research, and industry partnerships."
    ).strip()
    return {
        "name": name,
        "slug": slug(name),
        "short_name": short,
        "institution_type": itype,
        "founded_year": fy,
        "country": "India",
        "state": state,
        "city": city,
        "campus_type": "Urban",
        "website": f"https://www.{domain}",
        "wikipedia_url": wiki,
        "description": desc,
        "logo_url": fav(domain),
    }


def build_engineering() -> list[dict]:
    iits = [
        ("Indian Institute of Technology Madras", "IIT Madras", "Chennai", "Tamil Nadu", 1959, "iitm.ac.in", "https://en.wikipedia.org/wiki/IIT_Madras"),
        ("Indian Institute of Technology Bombay", "IIT Bombay", "Mumbai", "Maharashtra", 1958, "iitb.ac.in", "https://en.wikipedia.org/wiki/IIT_Bombay"),
        ("Indian Institute of Technology Kharagpur", "IIT Kharagpur", "Kharagpur", "West Bengal", 1951, "iitkgp.ac.in", "https://en.wikipedia.org/wiki/IIT_Kharagpur"),
        ("Indian Institute of Technology Delhi", "IIT Delhi", "New Delhi", "Delhi", 1961, "iitd.ac.in", "https://en.wikipedia.org/wiki/IIT_Delhi"),
        ("Indian Institute of Technology Kanpur", "IIT Kanpur", "Kanpur", "Uttar Pradesh", 1959, "iitk.ac.in", "https://en.wikipedia.org/wiki/IIT_Kanpur"),
        ("Indian Institute of Technology Roorkee", "IIT Roorkee", "Roorkee", "Uttarakhand", 1847, "iitr.ac.in", "https://en.wikipedia.org/wiki/IIT_Roorkee"),
        ("Indian Institute of Technology Guwahati", "IIT Guwahati", "Guwahati", "Assam", 1994, "iitg.ac.in", "https://en.wikipedia.org/wiki/IIT_Guwahati"),
        ("Indian Institute of Technology Hyderabad", "IIT Hyderabad", "Sangareddy", "Telangana", 2008, "iith.ac.in", "https://en.wikipedia.org/wiki/IIT_Hyderabad"),
        ("Indian Institute of Technology Indore", "IIT Indore", "Indore", "Madhya Pradesh", 2009, "iiti.ac.in", "https://en.wikipedia.org/wiki/IIT_Indore"),
        ("Indian Institute of Technology Ropar", "IIT Ropar", "Rupnagar", "Punjab", 2008, "iitrpr.ac.in", "https://en.wikipedia.org/wiki/IIT_Ropar"),
        ("Indian Institute of Technology Bhubaneswar", "IIT Bhubaneswar", "Bhubaneswar", "Odisha", 2008, "iitbbs.ac.in", "https://en.wikipedia.org/wiki/IIT_Bhubaneswar"),
        ("Indian Institute of Technology Gandhinagar", "IIT Gandhinagar", "Gandhinagar", "Gujarat", 2008, "iitgn.ac.in", "https://en.wikipedia.org/wiki/IIT_Gandhinagar"),
        ("Indian Institute of Technology Patna", "IIT Patna", "Patna", "Bihar", 2008, "iitp.ac.in", "https://en.wikipedia.org/wiki/IIT_Patna"),
        ("Indian Institute of Technology Jodhpur", "IIT Jodhpur", "Jodhpur", "Rajasthan", 2008, "iitj.ac.in", "https://en.wikipedia.org/wiki/IIT_Jodhpur"),
        ("Indian Institute of Technology Mandi", "IIT Mandi", "Mandi", "Himachal Pradesh", 2009, "iitmandi.ac.in", "https://en.wikipedia.org/wiki/IIT_Mandi"),
        ("Indian Institute of Technology (BHU) Varanasi", "IIT BHU", "Varanasi", "Uttar Pradesh", 1919, "iitbhu.ac.in", "https://en.wikipedia.org/wiki/IIT_BHU"),
        ("Indian Institute of Technology Palakkad", "IIT Palakkad", "Palakkad", "Kerala", 2015, "iitpkd.ac.in", "https://en.wikipedia.org/wiki/IIT_Palakkad"),
        ("Indian Institute of Technology Tirupati", "IIT Tirupati", "Tirupati", "Andhra Pradesh", 2015, "iittp.ac.in", "https://en.wikipedia.org/wiki/IIT_Tirupati"),
        ("Indian Institute of Technology Jammu", "IIT Jammu", "Jammu", "Jammu and Kashmir", 2016, "iitjammu.ac.in", "https://en.wikipedia.org/wiki/IIT_Jammu"),
        ("Indian Institute of Technology Dharwad", "IIT Dharwad", "Dharwad", "Karnataka", 2016, "iitdh.ac.in", "https://en.wikipedia.org/wiki/IIT_Dharwad"),
        ("Indian Institute of Technology Bhilai", "IIT Bhilai", "Bhilai", "Chhattisgarh", 2016, "iitbhilai.ac.in", "https://en.wikipedia.org/wiki/IIT_Bhilai"),
        ("Indian Institute of Technology Goa", "IIT Goa", "Goa", "Goa", 2016, "iitgoa.ac.in", "https://en.wikipedia.org/wiki/IIT_Goa"),
        ("Indian Institute of Technology (ISM) Dhanbad", "IIT ISM", "Dhanbad", "Jharkhand", 1926, "iitism.ac.in", "https://en.wikipedia.org/wiki/IIT_(ISM)_Dhanbad"),
    ]
    nits_lines = """
NIT Tiruchirappalli|NIT Trichy|Tiruchirappalli|Tamil Nadu|1964|nitt.edu
National Institute of Technology Karnataka|NITK|Surathkal|Karnataka|1960|nitk.edu.in
National Institute of Technology Warangal|NITW|Warangal|Telangana|1959|nitw.ac.in
National Institute of Technology Calicut|NITC|Calicut|Kerala|1961|nitc.ac.in
National Institute of Technology Rourkela|NITR|Rourkela|Odisha|1961|nitrkl.ac.in
Visvesvaraya National Institute of Technology|VNIT|Nagpur|Maharashtra|1960|vnit.ac.in
Malaviya National Institute of Technology|MNIT|Jaipur|Rajasthan|1963|mnit.ac.in
National Institute of Technology Silchar|NIT Silchar|Silchar|Assam|1967|nits.ac.in
National Institute of Technology Durgapur|NIT Durgapur|Durgapur|West Bengal|1960|nitdgp.ac.in
National Institute of Technology Hamirpur|NIT Hamirpur|Hamirpur|Himachal Pradesh|1986|nith.ac.in
Dr. B R Ambedkar National Institute of Technology Jalandhar|NIT Jalandhar|Jalandhar|Punjab|1987|nitj.ac.in
National Institute of Technology Raipur|NIT Raipur|Raipur|Chhattisgarh|1963|nitrr.ac.in
National Institute of Technology Kurukshetra|NIT Kurukshetra|Kurukshetra|Haryana|1963|nitkkr.ac.in
National Institute of Technology Patna|NIT Patna|Patna|Bihar|1924|nitp.ac.in
National Institute of Technology Srinagar|NIT Srinagar|Srinagar|Jammu and Kashmir|1960|nitsri.ac.in
Motilal Nehru National Institute of Technology|MNNIT|Prayagraj|Uttar Pradesh|1961|mnnit.ac.in
National Institute of Technology Agartala|NIT Agartala|Agartala|Tripura|1965|nita.ac.in
National Institute of Technology Meghalaya|NIT Meghalaya|Shillong|Meghalaya|2010|nitmeghalaya.in
National Institute of Technology Puducherry|NIT Puducherry|Karaikal|Puducherry|2010|nitpy.ac.in
National Institute of Technology Sikkim|NIT Sikkim|Ravangla|Sikkim|2010|nitsikkim.ac.in
National Institute of Technology Arunachal Pradesh|NIT Arunachal|Yupia|Arunachal Pradesh|2010|nitap.in
National Institute of Technology Goa|NIT Goa|Ponda|Goa|2010|nitgoa.ac.in
National Institute of Technology Manipur|NIT Manipur|Imphal|Manipur|2010|nitmanipur.ac.in
National Institute of Technology Nagaland|NIT Nagaland|Chumukedima|Nagaland|2010|nitnagaland.ac.in
National Institute of Technology Mizoram|NIT Mizoram|Aizawl|Mizoram|2010|nitmz.ac.in
National Institute of Technology Delhi|NIT Delhi|New Delhi|Delhi|2010|nitdelhi.ac.in
National Institute of Technology Uttarakhand|NIT Uttarakhand|Srinagar Garhwal|Uttarakhand|2010|nituk.ac.in
National Institute of Technology Andhra Pradesh|NIT Andhra Pradesh|Tadepalligudem|Andhra Pradesh|2015|nitandhra.ac.in
Maulana Azad National Institute of Technology Bhopal|MANIT Bhopal|Bhopal|Madhya Pradesh|1960|manit.ac.in
Sardar Vallabhbhai National Institute of Technology|SVNIT|Surat|Gujarat|1961|svnit.ac.in
""".strip().splitlines()
    iiits = [
        ("Indian Institute of Information Technology Allahabad", "IIIT Allahabad", "Prayagraj", "Uttar Pradesh", 1999, "iiita.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Information_Technology,_Allahabad"),
        ("International Institute of Information Technology Bangalore", "IIIT Bangalore", "Bengaluru", "Karnataka", 1999, "iiitb.ac.in", "https://en.wikipedia.org/wiki/International_Institute_of_Information_Technology_Bangalore"),
        ("Indraprastha Institute of Information Technology Delhi", "IIIT Delhi", "New Delhi", "Delhi", 2008, "iiitd.ac.in", "https://en.wikipedia.org/wiki/Indraprastha_Institute_of_Information_Technology_Delhi"),
        ("Indian Institute of Information Technology Design and Manufacturing Jabalpur", "IIITDM Jabalpur", "Jabalpur", "Madhya Pradesh", 2005, "iiitdmj.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Information_Technology,_Design_and_Manufacturing,_Jabalpur"),
        ("Indian Institute of Information Technology Design and Manufacturing Kancheepuram", "IIITDM Kancheepuram", "Chennai", "Tamil Nadu", 2007, "iiitdm.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Information_Technology,_Design_and_Manufacturing,_Kancheepuram"),
    ]
    others = [
        ("Birla Institute of Technology and Science Pilani", "BITS Pilani", "Pilani", "Rajasthan", 1964, "bits-pilani.ac.in", "https://en.wikipedia.org/wiki/BITS_Pilani", "Known for the dual-degree system and strong recruiter relationships."),
        ("International Institute of Information Technology Hyderabad", "IIIT Hyderabad", "Hyderabad", "Telangana", 1998, "iiit.ac.in", "https://en.wikipedia.org/wiki/IIIT_Hyderabad", "Research-intensive in CS and electronics."),
        ("Vellore Institute of Technology", "VIT", "Vellore", "Tamil Nadu", 1984, "vit.ac.in", "https://en.wikipedia.org/wiki/Vellore_Institute_of_Technology", "Large multi-campus private technical university."),
        ("SRM Institute of Science and Technology", "SRMIST", "Chennai", "Tamil Nadu", 1985, "srmist.edu.in", "https://en.wikipedia.org/wiki/SRM_Institute_of_Science_and_Technology", "Broad engineering and health sciences portfolio."),
        ("Manipal Institute of Technology", "MIT Manipal", "Manipal", "Karnataka", 1957, "manipal.edu", "https://en.wikipedia.org/wiki/Manipal_Institute_of_Technology", "Part of Manipal Academy of Higher Education."),
        ("Delhi Technological University", "DTU", "New Delhi", "Delhi", 1941, "dtu.ac.in", "https://en.wikipedia.org/wiki/Delhi_Technological_University", "Former Delhi College of Engineering."),
        ("Netaji Subhas University of Technology", "NSUT", "New Delhi", "Delhi", 1983, "nsut.ac.in", "https://en.wikipedia.org/wiki/Netaji_Subhas_University_of_Technology", "Delhi state technical university."),
        ("Jadavpur University", "Jadavpur Univ", "Kolkata", "West Bengal", 1955, "jadavpuruniversity.in", "https://en.wikipedia.org/wiki/Jadavpur_University", "Flagship engineering faculty with deep research roots."),
        ("Anna University", "Anna University", "Chennai", "Tamil Nadu", 1978, "annauniv.edu", "https://en.wikipedia.org/wiki/Anna_University", "Major affiliating technical university in Tamil Nadu."),
        ("Punjab Engineering College", "PEC", "Chandigarh", "Chandigarh", 1921, "pec.ac.in", "https://en.wikipedia.org/wiki/Punjab_Engineering_College", "Historic government engineering institution."),
        ("Thapar Institute of Engineering and Technology", "TIET", "Patiala", "Punjab", 1956, "thapar.edu", "https://en.wikipedia.org/wiki/Thapar_Institute_of_Engineering_and_Technology", "Private deemed university."),
        ("RV College of Engineering", "RVCE", "Bengaluru", "Karnataka", 1963, "rvce.edu.in", "https://en.wikipedia.org/wiki/R.V._College_of_Engineering", "Autonomous college under VTU."),
        ("BMS College of Engineering", "BMSCE", "Bengaluru", "Karnataka", 1946, "bmsce.ac.in", "https://en.wikipedia.org/wiki/B.M.S._College_of_Engineering", "Long-standing Bengaluru engineering college."),
        ("PSG College of Technology", "PSG Tech", "Coimbatore", "Tamil Nadu", 1951, "psgtech.edu", "https://en.wikipedia.org/wiki/PSG_College_of_Technology", "Autonomous institution with industry links."),
    ]
    extras = [
        ("Indian Institute of Information Technology Sri City", "IIIT Sri City", "Chittoor", "Andhra Pradesh", 2013, "iiitsricity.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Information_Technology,_Sri_City", "PPP-mode IIIT."),
        ("Indian Institute of Information Technology Kalyani", "IIIT Kalyani", "Kalyani", "West Bengal", 2014, "iiitkalyani.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Information_Technology,_Kalyani", "PPP-mode IIIT."),
        ("Indian Institute of Information Technology Lucknow", "IIIT Lucknow", "Lucknow", "Uttar Pradesh", 2015, "iiitl.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Information_Technology,_Lucknow", "Mentored IIIT ecosystem."),
        ("Indian Institute of Information Technology Bhopal", "IIIT Bhopal", "Bhopal", "Madhya Pradesh", 2017, "iiitbhopal.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Information_Technology_Bhopal", "PPP-mode IIIT."),
        ("Indian Institute of Information Technology Surat", "IIIT Surat", "Surat", "Gujarat", 2017, "iiitsurat.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Information_Technology_Surat", "PPP-mode IIIT."),
        ("Indian Institute of Information Technology Bhagalpur", "IIIT Bhagalpur", "Bhagalpur", "Bihar", 2017, "iiitbhagalpur.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Information_Technology,_Bhagalpur", "PPP-mode IIIT."),
        ("Indian Institute of Information Technology Ranchi", "IIIT Ranchi", "Ranchi", "Jharkhand", 2016, "iiitranchi.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Information_Technology,_Ranchi", "PPP-mode IIIT."),
        ("Indian Institute of Information Technology Raichur", "IIIT Raichur", "Raichur", "Karnataka", 2019, "iiitr.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Information_Technology,_Raichur", "PPP-mode IIIT."),
        ("Indian Institute of Information Technology Nagpur", "IIIT Nagpur", "Nagpur", "Maharashtra", 2016, "iiitn.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Information_Technology,_Nagpur", "PPP-mode IIIT."),
        ("Indian Institute of Information Technology Pune", "IIIT Pune", "Pune", "Maharashtra", 2017, "iiitp.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Information_Technology,_Pune", "PPP-mode IIIT."),
        ("Indian Institute of Information Technology Kota", "IIIT Kota", "Kota", "Rajasthan", 2017, "iiitkota.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Information_Technology,_Kota", "PPP-mode IIIT."),
        ("Indian Institute of Information Technology Vadodara", "IIIT Vadodara", "Vadodara", "Gujarat", 2013, "iiitvadodara.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Information_Technology_Vadodara", "PPP-mode IIIT."),
        ("Indian Institute of Information Technology Dharwad", "IIIT Dharwad", "Dharwad", "Karnataka", 2015, "iiitdwd.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Information_Technology,_Dharwad", "PPP-mode IIIT."),
        ("Indian Institute of Information Technology Design and Manufacturing Kurnool", "IIITDM Kurnool", "Kurnool", "Andhra Pradesh", 2015, "iiitk.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Information_Technology,_Design_and_Manufacturing,_Kurnool", "Design & manufacturing focus."),
        ("Visvesvaraya Technological University", "VTU", "Belagavi", "Karnataka", 1998, "vtu.ac.in", "https://en.wikipedia.org/wiki/Visvesvaraya_Technological_University", "Major affiliating technical university in Karnataka."),
        ("College of Engineering Pune", "COEP", "Pune", "Maharashtra", 1854, "coep.org.in", "https://en.wikipedia.org/wiki/College_of_Engineering,_Pune", "Autonomous college, historic engineering institution."),
        ("Veermata Jijabai Technological Institute", "VJTI", "Mumbai", "Maharashtra", 1887, "vjti.ac.in", "https://en.wikipedia.org/wiki/Veermata_Jijabai_Technological_Institute", "Mumbai public engineering college."),
        ("National Institute of Advanced Studies", "NIAS", "Bengaluru", "Karnataka", 1988, "nias.res.in", "https://en.wikipedia.org/wiki/National_Institute_of_Advanced_Studies", "Interdisciplinary research institute (included for Bengaluru ecosystem)."),
        ("Institute of Chemical Technology Mumbai", "ICT Mumbai", "Mumbai", "Maharashtra", 1933, "ictmumbai.edu.in", "https://en.wikipedia.org/wiki/Institute_of_Chemical_Technology", "Deemed university focused on chemical engineering."),
        ("National Institute of Industrial Engineering", "NITIE", "Mumbai", "Maharashtra", 1963, "nitie.edu", "https://en.wikipedia.org/wiki/National_Institute_of_Industrial_Engineering", "Now part of IIM Mumbai transition context."),
        ("Indian Statistical Institute", "ISI", "Kolkata", "West Bengal", 1931, "isical.ac.in", "https://en.wikipedia.org/wiki/Indian_Statistical_Institute", "Statistics, mathematics, and computer science."),
        ("International Institute of Information Technology Naya Raipur", "IIIT NR", "Naya Raipur", "Chhattisgarh", 2015, "iiitnr.ac.in", "https://en.wikipedia.org/wiki/International_Institute_of_Information_Technology,_Naya_Raipur", "IIIT in Chhattisgarh capital."),
        ("Shiv Nadar University", "SNU", "Greater Noida", "Uttar Pradesh", 2011, "snu.edu.in", "https://en.wikipedia.org/wiki/Shiv_Nadar_University", "Private research university with engineering school."),
        ("Ashoka University", "Ashoka", "Sonipat", "Haryana", 2014, "ashoka.edu.in", "https://en.wikipedia.org/wiki/Ashoka_University", "Liberal arts and sciences including CS programmes."),
        ("O.P. Jindal Global University", "JGU", "Sonipat", "Haryana", 2009, "jgu.edu.in", "https://en.wikipedia.org/wiki/O.P._Jindal_Global_University", "Private research university with law and business."),
        ("Kalinga Institute of Industrial Technology", "KIIT", "Bhubaneswar", "Odisha", 1992, "kiit.ac.in", "https://en.wikipedia.org/wiki/Kalinga_Institute_of_Industrial_Technology", "Large private deemed university."),
        ("Amrita Vishwa Vidyapeetham", "Amrita", "Coimbatore", "Tamil Nadu", 2003, "amrita.edu", "https://en.wikipedia.org/wiki/Amrita_Vishwa_Vidyapeetham", "Multi-campus private deemed university."),
        ("SASTRA Deemed University", "SASTRA", "Thanjavur", "Tamil Nadu", 1984, "sastra.edu", "https://en.wikipedia.org/wiki/SASTRA_University", "Deemed university with engineering strength."),
        ("National Institute of Technology Calicut", "NIT Calicut", "Calicut", "Kerala", 1961, "nitc.ac.in", "https://en.wikipedia.org/wiki/National_Institute_of_Technology_Calicut", "Duplicate check — skip if slug exists"),
    ]
    # Remove intentional duplicate NIT Calicut placeholder
    extras = [e for e in extras if e[0] != "National Institute of Technology Calicut"]
    rows: list[dict] = []
    for t in iits:
        name, short, city, st, fy, dom, wiki = t
        rows.append(
            inst_row(
                name,
                short,
                city,
                st,
                fy,
                "Indian Institute of Technology",
                dom,
                wiki,
                "National IIT system — Institute of National Importance.",
            )
        )
    wiki_nit = "https://en.wikipedia.org/wiki/National_Institute_of_Technology"
    for line in nits_lines:
        p = line.split("|")
        rows.append(
            inst_row(p[0], p[1], p[2], p[3], int(p[4]), "National Institute of Technology", p[5], wiki_nit, "Admissions via JEE Main; INI status.")
        )
    for t in iiits:
        name, short, city, st, fy, dom, wiki = t
        rows.append(
            inst_row(
                name,
                short,
                city,
                st,
                fy,
                "Indian Institute of Information Technology",
                dom,
                wiki,
                "IIIT / IIITDM ecosystem.",
            )
        )
    for t in others:
        rows.append(inst_row(t[0], t[1], t[2], t[3], t[4], "Engineering & Technology", t[5], t[6], t[7]))
    for t in extras:
        rows.append(inst_row(t[0], t[1], t[2], t[3], t[4], "Engineering & Technology", t[5], t[6], t[7]))

    seen: dict[str, int] = {}
    out: list[dict] = []
    for r in rows:
        s = r["slug"]
        if s in seen:
            seen[s] += 1
            r = {**r, "slug": f"{s}-{seen[s]}"}
        else:
            seen[s] = 0
        out.append(r)
    return out[:100]


def build_bschools() -> list[dict]:
    data = [
        ("Indian Institute of Management Ahmedabad", "IIM A", "Ahmedabad", "Gujarat", 1961, "iima.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Ahmedabad", "Flagship IIM; case-method pedagogy and deep industry links."),
        ("Indian Institute of Management Bangalore", "IIM B", "Bengaluru", "Karnataka", 1973, "iimb.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Bangalore", "Research-strong IIM in India’s tech capital."),
        ("Indian Institute of Management Calcutta", "IIM C", "Kolkata", "West Bengal", 1961, "iimcal.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Calcutta", "India’s oldest IIM, strong in analytics and finance; widely called IIM Calcutta or IIMC, with its main campus at Joka, Kolkata."),
        ("Indian Institute of Management Lucknow", "IIM L", "Lucknow", "Uttar Pradesh", 1984, "iiml.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Lucknow", "Known for agribusiness and executive education."),
        ("Indian Institute of Management Kozhikode", "IIM K", "Kozhikode", "Kerala", 1996, "iimk.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Kozhikode", "Hill-campus IIM with strong sustainability focus."),
        ("Indian Institute of Management Indore", "IIM I", "Indore", "Madhya Pradesh", 1996, "iimidr.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Indore", "Integrated programmes and rural immersion."),
        ("Indian Institute of Management Shillong", "IIM S", "Shillong", "Meghalaya", 2007, "iimshillong.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Shillong", "Northeast India focus; sustainability leadership."),
        ("Indian Institute of Management Raipur", "IIM Raipur", "Raipur", "Chhattisgarh", 2010, "iimraipur.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Raipur", "Young IIM with growing research output."),
        ("Indian Institute of Management Rohtak", "IIM Rohtak", "Rohtak", "Haryana", 2010, "iimrohtak.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Rohtak", "IPM and MBA pathways."),
        ("Indian Institute of Management Ranchi", "IIM Ranchi", "Ranchi", "Jharkhand", 2010, "iimranchi.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Ranchi", "HR and general management programmes."),
        ("Indian Institute of Management Tiruchirappalli", "IIM Trichy", "Tiruchirappalli", "Tamil Nadu", 2011, "iimtrichy.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Tiruchirappalli", "South India hub for management education."),
        ("Indian Institute of Management Udaipur", "IIM Udaipur", "Udaipur", "Rajasthan", 2011, "iimu.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Udaipur", "Entrepreneurship and global collaborations."),
        ("Indian Institute of Management Kashipur", "IIM Kashipur", "Kashipur", "Uttarakhand", 2011, "iimkashipur.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Kashipur", "Analytics and operations focus."),
        ("Indian Institute of Management Nagpur", "IIM Nagpur", "Nagpur", "Maharashtra", 2015, "iimnagpur.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Nagpur", "New-generation IIM in central India."),
        ("Indian Institute of Management Visakhapatnam", "IIM Vizag", "Visakhapatnam", "Andhra Pradesh", 2015, "iimv.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Visakhapatnam", "Coastal campus; maritime and infrastructure ties."),
        ("Indian Institute of Management Amritsar", "IIM Amritsar", "Amritsar", "Punjab", 2015, "iimamritsar.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Amritsar", "Punjab region management school."),
        ("Indian Institute of Management Bodh Gaya", "IIM Bodh Gaya", "Bodh Gaya", "Bihar", 2015, "iimbg.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Bodh_Gaya", "Young IIM with heritage-town setting."),
        ("Indian Institute of Management Sirmaur", "IIM Sirmaur", "Sirmaur", "Himachal Pradesh", 2015, "iimsirmaur.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Sirmaur", "Himalayan campus."),
        ("Indian Institute of Management Sambalpur", "IIM Sambalpur", "Sambalpur", "Odisha", 2015, "iimsambalpur.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Sambalpur", "Eastern India industrial corridor context."),
        ("Indian Institute of Management Jammu", "IIM Jammu", "Jammu", "Jammu and Kashmir", 2016, "iimjammu.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Jammu", "Jammu & Kashmir management education."),
        ("Indian School of Business", "ISB", "Hyderabad", "Telangana", 2001, "isb.edu", "https://en.wikipedia.org/wiki/Indian_School_of_Business", "Top-ranked private B-school; Hyderabad and Mohali campuses."),
        ("XLRI Xavier School of Management", "XLRI", "Jamshedpur", "Jharkhand", 1949, "xlri.ac.in", "https://en.wikipedia.org/wiki/XLRI-Xavier_School_of_Management", "Jesuit-rooted; HR and BM flagship programmes."),
        ("Faculty of Management Studies Delhi", "FMS Delhi", "New Delhi", "Delhi", 1954, "fms.du.ac.in", "https://en.wikipedia.org/wiki/Faculty_of_Management_Studies,_University_of_Delhi", "University of Delhi faculty; low-fee high-ROI MBA."),
        ("SP Jain Institute of Management and Research", "SPJIMR", "Mumbai", "Maharashtra", 1981, "spjimr.org", "https://en.wikipedia.org/wiki/SP_Jain_Institute_of_Management_and_Research", "Mumbai B-school with global modules."),
        ("Institute of Management Technology Ghaziabad", "IMT GZB", "Ghaziabad", "Uttar Pradesh", 1980, "imt.edu", "https://en.wikipedia.org/wiki/Institute_of_Management_Technology,_Ghaziabad", "Private AACSB-accredited management school."),
        ("Management Development Institute", "MDI", "Gurugram", "Haryana", 1973, "mdi.ac.in", "https://en.wikipedia.org/wiki/Management_Development_Institute", "Corporate HR and consulting feeder school."),
        ("Symbiosis Institute of Business Management Pune", "SIBM Pune", "Pune", "Maharashtra", 1978, "siu.edu.in", "https://en.wikipedia.org/wiki/Symbiosis_Institute_of_Business_Management", "Flagship Symbiosis B-school."),
        ("Narsee Monjee Institute of Management Studies", "NMIMS", "Mumbai", "Maharashtra", 1981, "nmims.edu", "https://en.wikipedia.org/wiki/NMIMS_University", "Deemed university with strong Mumbai MBA."),
        ("Indian Institute of Foreign Trade", "IIFT", "New Delhi", "Delhi", 1963, "iift.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Foreign_Trade", "International business and trade focus."),
        ("Jamnalal Bajaj Institute of Management Studies", "JBIMS", "Mumbai", "Maharashtra", 1965, "jbims.edu", "https://en.wikipedia.org/wiki/Jamnalal_Bajaj_Institute_of_Management_Studies", "University of Mumbai finance stronghold."),
        ("Tata Institute of Social Sciences", "TISS", "Mumbai", "Maharashtra", 1936, "tiss.edu", "https://en.wikipedia.org/wiki/Tata_Institute_of_Social_Sciences", "Social sciences and HRM programmes."),
        ("Indian Institute of Management Mumbai", "IIM Mumbai", "Mumbai", "Maharashtra", 2023, "iimmumbai.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Management_Mumbai", "Evolved from NITIE; supply chain and operations heritage."),
    ]
    data.extend(
        [
            ("T. A. Pai Management Institute", "TAPMI", "Manipal", "Karnataka", 1984, "tapmi.edu.in", "https://en.wikipedia.org/wiki/T.A._Pai_Management_Institute", "Premier private B-school; strong finance and HR."),
            ("Institute of Rural Management Anand", "IRMA", "Anand", "Gujarat", 1979, "irma.ac.in", "https://en.wikipedia.org/wiki/Institute_of_Rural_Management_Anand", "Rural and agri-business management focus."),
            ("Xavier Institute of Management Bhubaneswar", "XIMB", "Bhubaneswar", "Odisha", 1987, "xim.edu.in", "https://en.wikipedia.org/wiki/Xavier_Institute_of_Management,_Bhubaneswar", "Jesuit B-school; analytics and sustainability."),
            ("Institute of Management Technology Hyderabad", "IMT Hyderabad", "Hyderabad", "Telangana", 2011, "imthyderabad.edu.in", "https://en.wikipedia.org/wiki/Institute_of_Management_Technology,_Hyderabad", "IMT off-campus with corporate proximity."),
            ("Institute of Management Technology Nagpur", "IMT Nagpur", "Nagpur", "Maharashtra", 2004, "imtnagpur.ac.in", "https://en.wikipedia.org/wiki/Institute_of_Management_Technology,_Nagpur", "IMT campus in central India."),
            ("Birla Institute of Management Technology", "BIMTECH", "Greater Noida", "Uttar Pradesh", 1988, "bimtech.ac.in", "https://en.wikipedia.org/wiki/Birla_Institute_of_Management_Technology", "Private B-school in NCR."),
            ("FORE School of Management", "FORE", "New Delhi", "Delhi", 1981, "fsm.ac.in", "https://en.wikipedia.org/wiki/FORE_School_of_Management", "Delhi private management institute."),
            ("Lal Bahadur Shastri Institute of Management", "LBSIM", "New Delhi", "Delhi", 1995, "lbsim.ac.in", "https://en.wikipedia.org/wiki/Lal_Bahadur_Shastri_Institute_of_Management", "Delhi PGDM programmes."),
            ("International Management Institute New Delhi", "IMI Delhi", "New Delhi", "Delhi", 1981, "imi.edu", "https://en.wikipedia.org/wiki/International_Management_Institute,_New_Delhi", "Private institute with global exchange."),
            ("International Management Institute Kolkata", "IMI Kolkata", "Kolkata", "West Bengal", 2010, "imik.edu.in", "https://en.wikipedia.org/wiki/International_Management_Institute_Kolkata", "Eastern India campus of IMI."),
            ("Goa Institute of Management", "GIM", "Sanquelim", "Goa", 1993, "gim.ac.in", "https://en.wikipedia.org/wiki/Goa_Institute_of_Management", "Coastal B-school with ethics focus."),
            ("Prin. L. N. Welingkar Institute of Management Development and Research", "WeSchool", "Mumbai", "Maharashtra", 1977, "welingkar.org", "https://en.wikipedia.org/wiki/Prin._L._N._Welingkar_Institute_of_Management_Development_and_Research", "Design thinking and innovation emphasis."),
            ("K. J. Somaiya Institute of Management", "KJSIMSR", "Mumbai", "Maharashtra", 1981, "somaiya.edu", "https://en.wikipedia.org/wiki/K._J._Somaiya_Institute_of_Management", "Somaiya Vidyavihar management school."),
            ("National Institute of Bank Management", "NIBM", "Pune", "Maharashtra", 1969, "nibmindia.org", "https://en.wikipedia.org/wiki/National_Institute_of_Bank_Management", "Banking and finance training institute."),
            ("IFIM Business School", "IFIM", "Bengaluru", "Karnataka", 1995, "ifimbschool.com", "https://en.wikipedia.org/wiki/IFIM_Business_School", "Bengaluru PGDM with fintech focus."),
            ("Christ University School of Business", "CUSB", "Bengaluru", "Karnataka", 1994, "christuniversity.in", "https://en.wikipedia.org/wiki/Christ_University", "Deemed-university business programmes."),
            ("Alliance School of Business", "Alliance", "Bengaluru", "Karnataka", 2010, "alliance.edu.in", "https://en.wikipedia.org/wiki/Alliance_University", "Private university B-school."),
            ("CMS Business School Jain University", "CMS B-School", "Bengaluru", "Karnataka", 1990, "jainuniversity.ac.in", "https://en.wikipedia.org/wiki/Jain_University", "CMS Jain management programmes."),
            ("Woxsen School of Business", "Woxsen", "Hyderabad", "Telangana", 2014, "woxsen.edu.in", "https://en.wikipedia.org/wiki/Woxsen_University", "Private Hyderabad management school."),
            ("SRM School of Management", "SRM SoM", "Chennai", "Tamil Nadu", 2009, "srmap.edu.in", "https://en.wikipedia.org/wiki/SRM_Institute_of_Science_and_Technology", "SRM management vertical."),
            ("Great Lakes Institute of Management", "Great Lakes", "Chennai", "Tamil Nadu", 2004, "greatlakes.edu.in", "https://en.wikipedia.org/wiki/Great_Lakes_Institute_of_Management", "One-year MBA and analytics strengths."),
            ("Bharathidasan Institute of Management", "BIM Trichy", "Tiruchirappalli", "Tamil Nadu", 1984, "bim.edu", "https://en.wikipedia.org/wiki/Bharathidasan_Institute_of_Management", "Manufacturing and operations context."),
            ("Institute for Financial Management and Research", "IFMR", "Sri City", "Andhra Pradesh", 1970, "ifmr.ac.in", "https://en.wikipedia.org/wiki/Institute_for_Financial_Management_and_Research", "Krea University affiliate; finance research."),
            ("University of Hyderabad School of Management Studies", "UoH SOMS", "Hyderabad", "Telangana", 1999, "uohyd.ac.in", "https://en.wikipedia.org/wiki/University_of_Hyderabad", "Public university MBA programmes."),
            ("Department of Management Studies IIT Delhi", "DMS IITD", "New Delhi", "Delhi", 1993, "dms.iitd.ac.in", "https://en.wikipedia.org/wiki/Department_of_Management_Studies,_IIT_Delhi", "IIT Delhi management department."),
            ("Vinod Gupta School of Management IIT Kharagpur", "VGSOM", "Kharagpur", "West Bengal", 1997, "som.iitkgp.ac.in", "https://en.wikipedia.org/wiki/Vinod_Gupta_School_of_Management", "IIT Kharagpur MBA school."),
            ("Department of Management Studies IIT Madras", "DoMS IITM", "Chennai", "Tamil Nadu", 2004, "doms.iitm.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Technology_Madras", "IIT Madras management programmes."),
            ("Shailesh J. Mehta School of Management IIT Bombay", "SJMSOM", "Mumbai", "Maharashtra", 1995, "som.iitb.ac.in", "https://en.wikipedia.org/wiki/Shailesh_J._Mehta_School_of_Management", "IIT Bombay management school."),
            ("Department of Management Studies Indian Institute of Science", "DOMS IISc", "Bengaluru", "Karnataka", 1909, "iisc.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Science", "Doctoral and executive management at IISc."),
            ("National Institute of Securities Markets", "NISM", "Navi Mumbai", "Maharashtra", 2006, "nism.ac.in", "https://en.wikipedia.org/wiki/National_Institute_of_Securities_Markets", "SEBI education arm; capital markets focus."),
            ("Xavier Institute of Social Service", "XISS", "Ranchi", "Jharkhand", 1955, "xiss.ac.in", "https://en.wikipedia.org/wiki/Xavier_Institute_of_Social_Service", "HR and rural management programmes."),
            ("Institute of Public Enterprise", "IPE", "Hyderabad", "Telangana", 1964, "ipeindia.org", "https://en.wikipedia.org/wiki/Institute_of_Public_Enterprise", "Public enterprise and policy management."),
            ("Administrative Staff College of India", "ASCI", "Hyderabad", "Telangana", 1956, "asci.org.in", "https://en.wikipedia.org/wiki/Administrative_Staff_College_of_India", "Executive development for government and industry."),
            ("Indian Institute of Plantation Management", "IIPM", "Bengaluru", "Karnataka", 1993, "iipmb.edu.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Plantation_Management", "Agri-business and plantation management."),
            ("Symbiosis Centre for Management and Human Resource Development", "SCMHRD", "Pune", "Maharashtra", 1993, "scmhrd.edu", "https://en.wikipedia.org/wiki/Symbiosis_Centre_for_Management_and_Human_Resource_Development", "Symbiosis HR-focused school."),
            ("Symbiosis Institute of Operations Management", "SIOM", "Nashik", "Maharashtra", 2013, "siom.in", "https://en.wikipedia.org/wiki/Symbiosis_International_University", "Operations and supply chain programmes."),
            ("Symbiosis Institute of Media and Communication", "SIMC", "Pune", "Maharashtra", 2000, "simc.edu", "https://en.wikipedia.org/wiki/Symbiosis_Institute_of_Media_and_Communication", "Media and communication management."),
            ("NMIMS School of Business Management", "SBM NMIMS", "Mumbai", "Maharashtra", 1981, "nmims.edu", "https://en.wikipedia.org/wiki/NMIMS_University", "NMIMS flagship MBA vertical."),
            ("MIT School of Management MIT ADT University", "MIT SoM", "Pune", "Maharashtra", 1987, "mituniversity.edu.in", "https://en.wikipedia.org/wiki/MIT_ADT_University", "MIT World Peace University management."),
            ("Balaji Institute of Modern Management", "BIMM", "Pune", "Maharashtra", 1999, "bimm.edu", "https://en.wikipedia.org/wiki/Sri_Balaji_University,_Pune", "Private Pune PGDM cluster representative."),
            ("Institute of Management Development and Research", "IMDR", "Pune", "Maharashtra", 1974, "imdr.edu", "https://en.wikipedia.org/wiki/Institute_of_Management_Development_and_Research", "Pune autonomous management institute."),
            ("Department of Business Economics University of Delhi", "DBE DU", "New Delhi", "Delhi", 1973, "dbe-du.org", "https://en.wikipedia.org/wiki/University_of_Delhi", "Masters in business economics at DU."),
            ("Delhi School of Economics", "DSE", "New Delhi", "Delhi", 1949, "dse.ac.in", "https://en.wikipedia.org/wiki/Delhi_School_of_Economics", "Premier economics and social sciences hub."),
            ("Mudra Institute of Communications Ahmedabad", "MICA", "Ahmedabad", "Gujarat", 1991, "mica.ac.in", "https://en.wikipedia.org/wiki/MICA_(institute)", "Strategic marketing and communications management."),
            ("Entrepreneurship Development Institute of India", "EDI", "Ahmedabad", "Gujarat", 1983, "edindia.org", "https://en.wikipedia.org/wiki/Entrepreneurship_Development_Institute_of_India", "Entrepreneurship training and incubation."),
            ("Institute of Management Nirma University", "IMNU", "Ahmedabad", "Gujarat", 1996, "nirmauni.ac.in", "https://en.wikipedia.org/wiki/Nirma_University", "Private Ahmedabad management school."),
            ("ICFAI Business School Hyderabad", "IBS Hyderabad", "Hyderabad", "Telangana", 1995, "ibsindia.org", "https://en.wikipedia.org/wiki/ICFAI_Business_School", "ICFAI group B-school network hub."),
            ("ICFAI Business School Mumbai", "IBS Mumbai", "Mumbai", "Maharashtra", 2000, "ibsindia.org", "https://en.wikipedia.org/wiki/ICFAI_Business_School", "Mumbai campus of ICFAI B-schools."),
            ("Bennett University School of Management", "Bennett SoM", "Greater Noida", "Uttar Pradesh", 2016, "bennett.edu.in", "https://en.wikipedia.org/wiki/Bennett_University", "Times Group private university MBA."),
            ("Shiv Nadar University School of Management", "SNU SoM", "Greater Noida", "Uttar Pradesh", 2011, "snu.edu.in", "https://en.wikipedia.org/wiki/Shiv_Nadar_University", "Management programmes at Shiv Nadar."),
            ("FLAME University School of Business", "FLAME SoB", "Pune", "Maharashtra", 2015, "flame.edu.in", "https://en.wikipedia.org/wiki/FLAME_University", "Liberal education–aligned management school."),
            ("SP Jain School of Global Management", "SP Jain Global", "Mumbai", "Maharashtra", 2004, "spjain.org", "https://en.wikipedia.org/wiki/SP_Jain_School_of_Global_Management", "Multi-city global MBA programmes."),
            ("University Business School Panjab University", "UBS PU", "Chandigarh", "Chandigarh", 1995, "ubs.puchd.ac.in", "https://en.wikipedia.org/wiki/University_Business_School,_Chandigarh", "Public university MBA at Panjab University."),
            ("University School of Management Studies GGSIPU", "USMS IPU", "New Delhi", "Delhi", 1987, "ipu.ac.in", "https://en.wikipedia.org/wiki/Guru_Gobind_Singh_Indraprastha_University", "GGSIPU management school."),
            ("Faculty of Management Studies Banaras Hindu University", "FMS BHU", "Varanasi", "Uttar Pradesh", 1966, "bhu.ac.in", "https://en.wikipedia.org/wiki/Banaras_Hindu_University", "BHU management faculty."),
            ("Faculty of Management Studies and Research Aligarh Muslim University", "FMS AMU", "Aligarh", "Uttar Pradesh", 1981, "amu.ac.in", "https://en.wikipedia.org/wiki/Aligarh_Muslim_University", "AMU management studies."),
            ("Faculty of Management Studies Jamia Millia Islamia", "FMS JMI", "New Delhi", "Delhi", 2008, "jmi.ac.in", "https://en.wikipedia.org/wiki/Jamia_Millia_Islamia", "Central university MBA programmes."),
            ("Indian Institute of Forest Management", "IIFM", "Bhopal", "Madhya Pradesh", 1982, "iifm.ac.in", "https://en.wikipedia.org/wiki/Indian_Institute_of_Forest_Management", "Forest and environment management education."),
            ("Symbiosis Institute of Business Management Bengaluru", "SIBM Bengaluru", "Bengaluru", "Karnataka", 2008, "sibm.edu", "https://en.wikipedia.org/wiki/Symbiosis_Institute_of_Business_Management", "Symbiosis B-school in Bengaluru."),
            ("Symbiosis Institute of Business Management Hyderabad", "SIBM Hyderabad", "Hyderabad", "Telangana", 2014, "sibmhyd.edu.in", "https://en.wikipedia.org/wiki/Symbiosis_International_University", "Symbiosis B-school in Hyderabad."),
            ("Symbiosis Institute of Business Management Nagpur", "SIBM Nagpur", "Nagpur", "Maharashtra", 2019, "sibmnagpur.edu.in", "https://en.wikipedia.org/wiki/Symbiosis_International_University", "Symbiosis B-school in Nagpur."),
            ("Praxis Business School", "Praxis", "Kolkata", "West Bengal", 2007, "praxis.ac.in", "https://en.wikipedia.org/wiki/Praxis_Business_School", "Analytics- and data-driven PGDM in eastern India."),
            ("School of Inspired Leadership", "SOIL", "Gurugram", "Haryana", 2008, "soilindia.net", "https://en.wikipedia.org/wiki/School_of_Inspired_Leadership", "One-year MBA and leadership programmes."),
            ("Asia-Pacific Institute of Management", "APIM", "New Delhi", "Delhi", 1993, "apim.edu.in", "https://en.wikipedia.org/wiki/Asia-Pacific_Institute_of_Management", "Delhi PGDM with international immersion."),
            ("New Delhi Institute of Management", "NDIM", "New Delhi", "Delhi", 1992, "ndimdelhi.org", "https://en.wikipedia.org/wiki/New_Delhi_Institute_of_Management", "Private Delhi management institute."),
            ("Indian Institute of Health Management Research Jaipur", "IIHMR Jaipur", "Jaipur", "Rajasthan", 1984, "iihmr.org", "https://en.wikipedia.org/wiki/Indian_Institute_of_Health_Management_Research", "Healthcare and hospital management focus."),
            ("KIIT School of Management", "KSOM", "Bhubaneswar", "Odisha", 1997, "ksom.ac.in", "https://en.wikipedia.org/wiki/KIIT_School_of_Management", "KIIT deemed-university management school."),
            ("International Management Institute Bhubaneswar", "IMI Bhubaneswar", "Bhubaneswar", "Odisha", 2011, "imibh.edu.in", "https://en.wikipedia.org/wiki/International_Management_Institute", "IMI eastern India campus."),
        ]
    )
    out = []
    for t in data:
        name, short, city, st, fy, dom, wiki, blurb = t
        desc = (
            f"{short} is a leading Indian business school based in {city}, {st}, founded in {fy}. "
            f"{blurb} "
            f"It delivers postgraduate management programmes, executive education, and research."
        ).strip()
        out.append(
            {
                "name": name,
                "slug": slug(name),
                "short_name": short,
                "institution_type": "Business School",
                "founded_year": fy,
                "country": "India",
                "state": st,
                "city": city,
                "campus_type": "Urban",
                "website": f"https://{dom.lstrip('www.')}",
                "wikipedia_url": wiki,
                "description": desc,
                "logo_url": fav(dom),
            }
        )
    # Dedupe slugs
    seen: dict[str, int] = {}
    fixed = []
    for r in out:
        s = r["slug"]
        if s in seen:
            seen[s] += 1
            r = {**r, "slug": f"{s}-{seen[s]}"}
        else:
            seen[s] = 0
        fixed.append(r)
    return fixed[:100]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    eng = build_engineering()
    (OUT / "india_institutions_engineering_100.json").write_text(json.dumps(eng, ensure_ascii=False, indent=2), encoding="utf-8")
    bs = build_bschools()
    (OUT / "india_institutions_bschools.json").write_text(json.dumps(bs, ensure_ascii=False, indent=2), encoding="utf-8")
    print("engineering", len(eng), "bschools", len(bs))


if __name__ == "__main__":
    main()

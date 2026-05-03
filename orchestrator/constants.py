PRODUCTS = {
    "dairy": 0.5,
    "meat": 0.3,
    "seafood": 0.4,
    "frozen_meals": 0.2,
    "medicine": 0.1,
    "ice_cream": 0.15,
    "beverages": 0.6,
    "vegetables": 0.4,
    "eggs": 0.3,
    "bakery": 0.25
}

HEADQUARTERS = {
    "HQ_DELHI":     {"state": "Delhi", "city": "Delhi", "trucks": 6, "stock_mult": 1.2},
    "HQ_MUMBAI":    {"state": "Maharashtra", "city": "Mumbai", "trucks": 8, "stock_mult": 1.4},
    "HQ_BANGALORE": {"state": "Karnataka", "city": "Bengaluru", "trucks": 7, "stock_mult": 1.1},
    "HQ_KOLKATA":   {"state": "West Bengal", "city": "Kolkata", "trucks": 5, "stock_mult": 0.9}
}

COLD_STORES = [
    {"id": "CS_JAIPUR",       "name": "Jaipur",       "state": "Rajasthan",      "primary_hq": "HQ_DELHI"},
    {"id": "CS_LUCKNOW",      "name": "Lucknow",       "state": "Uttar Pradesh",  "primary_hq": "HQ_DELHI"},
    {"id": "CS_CHANDIGARH",   "name": "Chandigarh",    "state": "Punjab",         "primary_hq": "HQ_DELHI"},
    {"id": "CS_INDORE",       "name": "Indore",        "state": "Madhya Pradesh", "primary_hq": "HQ_MUMBAI"},
    {"id": "CS_AHMEDABAD",    "name": "Ahmedabad",     "state": "Gujarat",        "primary_hq": "HQ_MUMBAI"},
    {"id": "CS_PUNE",         "name": "Pune",          "state": "Maharashtra",    "primary_hq": "HQ_MUMBAI"},
    {"id": "CS_NAGPUR",       "name": "Nagpur",        "state": "Maharashtra",    "primary_hq": "HQ_MUMBAI"},
    {"id": "CS_BHOPAL",       "name": "Bhopal",        "state": "Madhya Pradesh", "primary_hq": "HQ_MUMBAI"},
    {"id": "CS_CHENNAI",      "name": "Chennai",       "state": "Tamil Nadu",     "primary_hq": "HQ_BANGALORE"},
    {"id": "CS_HYDERABAD",    "name": "Hyderabad",     "state": "Telangana",      "primary_hq": "HQ_BANGALORE"},
    {"id": "CS_KOCHI",        "name": "Kochi",         "state": "Kerala",         "primary_hq": "HQ_BANGALORE"},
    {"id": "CS_PATNA",        "name": "Patna",         "state": "Bihar",          "primary_hq": "HQ_KOLKATA"},
    {"id": "CS_RANCHI",       "name": "Ranchi",        "state": "Jharkhand",      "primary_hq": "HQ_KOLKATA"},
    {"id": "CS_BHUBANESHWAR", "name": "Bhubaneswar",   "state": "Odisha",         "primary_hq": "HQ_KOLKATA"},
    {"id": "CS_GUWAHATI",     "name": "Guwahati",      "state": "Assam",          "primary_hq": "HQ_KOLKATA"}
]
# Per-city demand multipliers (1.0 = baseline)
CITY_DEMAND_PROFILES = {
    "CS_JAIPUR":       {"dairy": 1.0, "meat": 0.9, "seafood": 0.3, "frozen_meals": 1.1, "medicine": 1.2, "ice_cream": 0.8, "beverages": 1.1, "vegetables": 1.0, "eggs": 1.0, "bakery": 1.0},
    "CS_LUCKNOW":      {"dairy": 1.2, "meat": 1.0, "seafood": 0.4, "frozen_meals": 1.0, "medicine": 1.1, "ice_cream": 0.9, "beverages": 1.0, "vegetables": 1.1, "eggs": 1.0, "bakery": 1.1},
    "CS_CHANDIGARH":   {"dairy": 1.1, "meat": 0.9, "seafood": 0.3, "frozen_meals": 1.0, "medicine": 1.3, "ice_cream": 1.0, "beverages": 1.2, "vegetables": 1.0, "eggs": 1.1, "bakery": 1.0},
    "CS_INDORE":       {"dairy": 1.0, "meat": 1.0, "seafood": 0.5, "frozen_meals": 1.1, "medicine": 1.0, "ice_cream": 1.1, "beverages": 1.0, "vegetables": 1.0, "eggs": 1.0, "bakery": 1.0},
    "CS_AHMEDABAD":    {"dairy": 1.3, "meat": 0.8, "seafood": 0.4, "frozen_meals": 1.0, "medicine": 1.2, "ice_cream": 1.2, "beverages": 1.1, "vegetables": 1.1, "eggs": 1.0, "bakery": 1.1},
    "CS_PUNE":         {"dairy": 1.1, "meat": 1.1, "seafood": 0.6, "frozen_meals": 1.2, "medicine": 1.1, "ice_cream": 1.0, "beverages": 1.2, "vegetables": 1.2, "eggs": 1.1, "bakery": 1.2},
    "CS_NAGPUR":       {"dairy": 1.0, "meat": 1.0, "seafood": 0.3, "frozen_meals": 1.0, "medicine": 1.1, "ice_cream": 1.1, "beverages": 1.0, "vegetables": 1.0, "eggs": 1.0, "bakery": 1.0},
    "CS_BHOPAL":       {"dairy": 1.0, "meat": 1.0, "seafood": 0.4, "frozen_meals": 1.0, "medicine": 1.2, "ice_cream": 1.0, "beverages": 1.0, "vegetables": 1.0, "eggs": 1.0, "bakery": 1.0},
    "CS_CHENNAI":      {"dairy": 0.9, "meat": 0.8, "seafood": 1.5, "frozen_meals": 1.0, "medicine": 1.1, "ice_cream": 1.3, "beverages": 1.3, "vegetables": 1.2, "eggs": 1.1, "bakery": 1.0},
    "CS_HYDERABAD":    {"dairy": 1.0, "meat": 1.2, "seafood": 0.7, "frozen_meals": 1.1, "medicine": 1.2, "ice_cream": 1.1, "beverages": 1.1, "vegetables": 1.1, "eggs": 1.0, "bakery": 1.1},
    "CS_KOCHI":        {"dairy": 0.9, "meat": 0.9, "seafood": 2.0, "frozen_meals": 1.0, "medicine": 1.0, "ice_cream": 1.5, "beverages": 1.4, "vegetables": 1.3, "eggs": 1.0, "bakery": 1.0},
    "CS_PATNA":        {"dairy": 1.1, "meat": 1.0, "seafood": 0.5, "frozen_meals": 1.0, "medicine": 1.1, "ice_cream": 0.9, "beverages": 1.0, "vegetables": 1.0, "eggs": 1.0, "bakery": 1.0},
    "CS_RANCHI":       {"dairy": 1.0, "meat": 1.0, "seafood": 0.3, "frozen_meals": 1.0, "medicine": 1.2, "ice_cream": 0.9, "beverages": 1.0, "vegetables": 1.0, "eggs": 1.0, "bakery": 1.0},
    "CS_BHUBANESHWAR": {"dairy": 1.0, "meat": 1.0, "seafood": 0.8, "frozen_meals": 1.0, "medicine": 1.1, "ice_cream": 1.2, "beverages": 1.1, "vegetables": 1.1, "eggs": 1.0, "bakery": 1.0},
    "CS_GUWAHATI":     {"dairy": 1.0, "meat": 1.2, "seafood": 0.7, "frozen_meals": 1.0, "medicine": 1.0, "ice_cream": 0.8, "beverages": 1.0, "vegetables": 1.0, "eggs": 1.0, "bakery": 1.0},
}
# Roads: every HQ->CS pair has at least 3 named routes
ROADS = [
    # ------ Delhi to Jaipur ------
    {"from": "HQ_DELHI", "to": "CS_JAIPUR", "route_name": "NH-48",      "distance": 280, "risk": 0.2, "time": 4.5},
    {"from": "HQ_DELHI", "to": "CS_JAIPUR", "route_name": "SH-12",      "distance": 310, "risk": 0.3, "time": 5.0},
    {"from": "HQ_DELHI", "to": "CS_JAIPUR", "route_name": "Link Road",  "distance": 350, "risk": 0.4, "time": 5.8},
    # ------ Delhi to Lucknow ------
    {"from": "HQ_DELHI", "to": "CS_LUCKNOW", "route_name": "NH-48",     "distance": 450, "risk": 0.3, "time": 7.0},
    {"from": "HQ_DELHI", "to": "CS_LUCKNOW", "route_name": "NH-30",     "distance": 480, "risk": 0.35, "time": 7.5},
    {"from": "HQ_DELHI", "to": "CS_LUCKNOW", "route_name": "SH-25",     "distance": 520, "risk": 0.4, "time": 8.2},
    # ------ Delhi to Chandigarh ------
    {"from": "HQ_DELHI", "to": "CS_CHANDIGARH", "route_name": "NH-44",  "distance": 250, "risk": 0.1, "time": 3.8},
    {"from": "HQ_DELHI", "to": "CS_CHANDIGARH", "route_name": "SH-7",   "distance": 270, "risk": 0.25, "time": 4.2},
    {"from": "HQ_DELHI", "to": "CS_CHANDIGARH", "route_name": "Link Road","distance": 300, "risk": 0.35, "time": 5.0},
    # ------ Mumbai to Ahmedabad ------
    {"from": "HQ_MUMBAI", "to": "CS_AHMEDABAD", "route_name": "NH-48",      "distance": 540, "risk": 0.3, "time": 8.5},
    {"from": "HQ_MUMBAI", "to": "CS_AHMEDABAD", "route_name": "NH-8 Express","distance": 500, "risk": 0.25, "time": 7.8},
    {"from": "HQ_MUMBAI", "to": "CS_AHMEDABAD", "route_name": "SH-50",      "distance": 580, "risk": 0.4, "time": 9.2},
    # ------ Mumbai to Indore ------
    {"from": "HQ_MUMBAI", "to": "CS_INDORE", "route_name": "NH-52",    "distance": 580, "risk": 0.35, "time": 9.0},
    {"from": "HQ_MUMBAI", "to": "CS_INDORE", "route_name": "SH-31",    "distance": 620, "risk": 0.4, "time": 9.8},
    {"from": "HQ_MUMBAI", "to": "CS_INDORE", "route_name": "Link Route","distance": 660, "risk": 0.45, "time": 10.5},
    # ------ Mumbai to Pune ------
    {"from": "HQ_MUMBAI", "to": "CS_PUNE", "route_name": "Expressway","distance": 150, "risk": 0.15, "time": 2.5},
    {"from": "HQ_MUMBAI", "to": "CS_PUNE", "route_name": "NH-48",     "distance": 160, "risk": 0.2, "time": 2.8},
    {"from": "HQ_MUMBAI", "to": "CS_PUNE", "route_name": "Old Pass",  "distance": 190, "risk": 0.4, "time": 3.5},
    # ------ Mumbai to Nagpur ------
    {"from": "HQ_MUMBAI", "to": "CS_NAGPUR", "route_name": "NH-44",      "distance": 840, "risk": 0.3, "time": 12.5},
    {"from": "HQ_MUMBAI", "to": "CS_NAGPUR", "route_name": "SH-266",     "distance": 880, "risk": 0.45, "time": 13.2},
    {"from": "HQ_MUMBAI", "to": "CS_NAGPUR", "route_name": "Via Aurangabad","distance": 920, "risk": 0.5, "time": 14.0},
    # ------ Mumbai to Bhopal ------
    {"from": "HQ_MUMBAI", "to": "CS_BHOPAL", "route_name": "NH-46",     "distance": 780, "risk": 0.4, "time": 11.0},
    {"from": "HQ_MUMBAI", "to": "CS_BHOPAL", "route_name": "SH-18",     "distance": 810, "risk": 0.45, "time": 11.8},
    {"from": "HQ_MUMBAI", "to": "CS_BHOPAL", "route_name": "Link Corridor","distance": 840, "risk": 0.5, "time": 12.5},
    # ------ Bangalore to Chennai ------
    {"from": "HQ_BANGALORE", "to": "CS_CHENNAI", "route_name": "NH-48",    "distance": 350, "risk": 0.2, "time": 5.5},
    {"from": "HQ_BANGALORE", "to": "CS_CHENNAI", "route_name": "SH-4",     "distance": 380, "risk": 0.3, "time": 6.0},
    {"from": "HQ_BANGALORE", "to": "CS_CHENNAI", "route_name": "Express Route","distance": 330, "risk": 0.25, "time": 5.0},
    # ------ Bangalore to Hyderabad ------
    {"from": "HQ_BANGALORE", "to": "CS_HYDERABAD", "route_name": "NH-44",    "distance": 570, "risk": 0.3, "time": 8.0},
    {"from": "HQ_BANGALORE", "to": "CS_HYDERABAD", "route_name": "SH-20",    "distance": 600, "risk": 0.35, "time": 8.5},
    {"from": "HQ_BANGALORE", "to": "CS_HYDERABAD", "route_name": "Link Road","distance": 630, "risk": 0.45, "time": 9.2},
    # ------ Bangalore to Kochi ------
    {"from": "HQ_BANGALORE", "to": "CS_KOCHI", "route_name": "NH-66",     "distance": 540, "risk": 0.4, "time": 9.0},
    {"from": "HQ_BANGALORE", "to": "CS_KOCHI", "route_name": "SH-17",     "distance": 580, "risk": 0.45, "time": 9.8},
    {"from": "HQ_BANGALORE", "to": "CS_KOCHI", "route_name": "Coastal Route","distance": 620, "risk": 0.5, "time": 10.5},
    # ------ Kolkata to Patna ------
    {"from": "HQ_KOLKATA", "to": "CS_PATNA", "route_name": "NH-19",     "distance": 580, "risk": 0.35, "time": 9.0},
    {"from": "HQ_KOLKATA", "to": "CS_PATNA", "route_name": "SH-78",     "distance": 610, "risk": 0.4, "time": 9.5},
    {"from": "HQ_KOLKATA", "to": "CS_PATNA", "route_name": "Alternate NH","distance": 640, "risk": 0.5, "time": 10.0},
    # ------ Kolkata to Ranchi ------
    {"from": "HQ_KOLKATA", "to": "CS_RANCHI", "route_name": "NH-33",     "distance": 420, "risk": 0.3, "time": 6.5},
    {"from": "HQ_KOLKATA", "to": "CS_RANCHI", "route_name": "SH-5",      "distance": 450, "risk": 0.4, "time": 7.0},
    {"from": "HQ_KOLKATA", "to": "CS_RANCHI", "route_name": "Link Road", "distance": 480, "risk": 0.45, "time": 7.5},
    # ------ Kolkata to Bhubaneswar ------
    {"from": "HQ_KOLKATA", "to": "CS_BHUBANESHWAR", "route_name": "NH-16",   "distance": 450, "risk": 0.3, "time": 7.0},
    {"from": "HQ_KOLKATA", "to": "CS_BHUBANESHWAR", "route_name": "SH-60",   "distance": 480, "risk": 0.4, "time": 7.5},
    {"from": "HQ_KOLKATA", "to": "CS_BHUBANESHWAR", "route_name": "Coastal Road","distance": 510, "risk": 0.45, "time": 8.0},
    # ------ Kolkata to Guwahati ------
    {"from": "HQ_KOLKATA", "to": "CS_GUWAHATI", "route_name": "NH-27",      "distance": 1030, "risk": 0.5, "time": 16.0},
    {"from": "HQ_KOLKATA", "to": "CS_GUWAHATI", "route_name": "NH-17",      "distance": 1080, "risk": 0.55, "time": 17.0},
    {"from": "HQ_KOLKATA", "to": "CS_GUWAHATI", "route_name": "Siliguri Pass","distance": 1120, "risk": 0.6, "time": 18.5}
]

# Inter-cold-store roads (for lateral transfers) — properly added to ROADS list
ROADS += [
    {"from": "CS_CHENNAI",   "to": "CS_HYDERABAD",    "route_name": "NH-65",   "distance": 625, "risk": 0.40, "time": 9.5},
    {"from": "CS_KOCHI",     "to": "CS_CHENNAI",      "route_name": "NH-66",   "distance": 700, "risk": 0.50, "time": 11.0},
    {"from": "CS_JAIPUR",    "to": "CS_AHMEDABAD",    "route_name": "NH-48",   "distance": 670, "risk": 0.30, "time": 10.0},
    {"from": "CS_LUCKNOW",   "to": "CS_PATNA",        "route_name": "NH-30",   "distance": 380, "risk": 0.40, "time": 6.0},
    {"from": "CS_RANCHI",    "to": "CS_BHUBANESHWAR", "route_name": "SH-9",    "distance": 600, "risk": 0.50, "time": 10.0},
    {"from": "CS_NAGPUR",    "to": "CS_BHOPAL",       "route_name": "NH-46",   "distance": 350, "risk": 0.30, "time": 5.5},
    {"from": "CS_NAGPUR",    "to": "CS_BHOPAL",       "route_name": "SH-20",   "distance": 380, "risk": 0.35, "time": 6.0},
    {"from": "CS_PUNE",      "to": "CS_NAGPUR",       "route_name": "NH-44",   "distance": 500, "risk": 0.35, "time": 8.0},
    {"from": "CS_PUNE",      "to": "CS_NAGPUR",       "route_name": "SH-5",    "distance": 540, "risk": 0.40, "time": 8.5},
    {"from": "CS_AHMEDABAD", "to": "CS_INDORE",       "route_name": "NH-52",   "distance": 380, "risk": 0.30, "time": 6.0},
]
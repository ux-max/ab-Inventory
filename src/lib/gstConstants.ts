export interface GstState {
  code: string
  name: string
}

export const INDIAN_STATES: GstState[] = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory" }
]

export function getPlaceOfSupplyOptions(businessStateCode: string = "27") {
  return INDIAN_STATES.map(s => {
    const isInter = s.code !== businessStateCode
    return {
      value: s.code,
      label: `${s.code} - ${s.name} (${isInter ? "Inter-state: IGST" : "Intra-state: CGST+SGST"})`,
      description: isInter ? "Inter-State (IGST applies)" : "Intra-State (CGST + SGST apply)"
    }
  })
}

export function isInterStateTransaction(supplyCode?: string, businessStateCode: string = "27"): boolean {
  if (!supplyCode) return false
  // Normalize code if it has name attached, e.g. "27-Maharashtra" -> "27"
  const cleanCode = supplyCode.split("-")[0].trim()
  const cleanBiz = businessStateCode.split("-")[0].trim()
  return cleanCode !== cleanBiz
}

export function getStateNameFromCode(code?: string): string {
  if (!code) return ""
  const cleanCode = code.split("-")[0].trim()
  const found = INDIAN_STATES.find(s => s.code === cleanCode)
  return found ? found.name : code
}

export interface TaxRateItem {
  id: string
  name: string
  rate: number
  type?: "igst" | "cgst" | "sgst" | "cess" | "gst"
  description?: string
}

export interface TaxGroupItem {
  id: string
  name: string
  rate: number
  subTaxes: string[]
  description?: string
}

export const INITIAL_TAX_RATES: TaxRateItem[] = [
  { id: "tr-igst-0", name: "IGST@0%", rate: 0, type: "igst" },
  { id: "tr-sgst-0", name: "SGST@0%", rate: 0, type: "sgst" },
  { id: "tr-cgst-0", name: "CGST@0%", rate: 0, type: "cgst" },
  { id: "tr-igst-025", name: "IGST@0.25%", rate: 0.25, type: "igst" },
  { id: "tr-sgst-0125", name: "SGST@0.125%", rate: 0.125, type: "sgst" },
  { id: "tr-cgst-0125", name: "CGST@0.125%", rate: 0.125, type: "cgst" },
  { id: "tr-igst-3", name: "IGST@3%", rate: 3, type: "igst" },
  { id: "tr-sgst-15", name: "SGST@1.5%", rate: 1.5, type: "sgst" },
  { id: "tr-cgst-15", name: "CGST@1.5%", rate: 1.5, type: "cgst" },
  { id: "tr-igst-5", name: "IGST@5%", rate: 5, type: "igst" },
  { id: "tr-sgst-25", name: "SGST@2.5%", rate: 2.5, type: "sgst" },
  { id: "tr-cgst-25", name: "CGST@2.5%", rate: 2.5, type: "cgst" },
  { id: "tr-igst-12", name: "IGST@12%", rate: 12, type: "igst" },
  { id: "tr-sgst-6", name: "SGST@6%", rate: 6, type: "sgst" },
  { id: "tr-cgst-6", name: "CGST@6%", rate: 6, type: "cgst" },
  { id: "tr-igst-18", name: "IGST@18%", rate: 18, type: "igst" },
  { id: "tr-sgst-9", name: "SGST@9%", rate: 9, type: "sgst" },
  { id: "tr-cgst-9", name: "CGST@9%", rate: 9, type: "cgst" },
  { id: "tr-igst-28", name: "IGST@28%", rate: 28, type: "igst" },
  { id: "tr-sgst-14", name: "SGST@14%", rate: 14, type: "sgst" },
  { id: "tr-cgst-14", name: "CGST@14%", rate: 14, type: "cgst" },
  { id: "tr-igst-40", name: "IGST@40%", rate: 40, type: "igst" },
  { id: "tr-sgst-20", name: "SGST@20%", rate: 20, type: "sgst" },
  { id: "tr-cgst-20", name: "CGST@20%", rate: 20, type: "cgst" },
]

export const INITIAL_TAX_GROUPS: TaxGroupItem[] = [
  { id: "tg-0", name: "GST@0%", rate: 0, subTaxes: ["SGST@0%", "CGST@0%"], description: "Nil Rated / Exempt goods" },
  { id: "tg-025", name: "GST@0.25%", rate: 0.25, subTaxes: ["SGST@0.125%", "CGST@0.125%"], description: "Rough diamonds & precious stones" },
  { id: "tg-3", name: "GST@3%", rate: 3, subTaxes: ["SGST@1.5%", "CGST@1.5%"], description: "Gold, silver and jewellery" },
  { id: "tg-5", name: "GST@5%", rate: 5, subTaxes: ["SGST@2.5%", "CGST@2.5%"], description: "Essential commodities & medicines" },
  { id: "tg-12", name: "GST@12%", rate: 12, subTaxes: ["SGST@6%", "CGST@6%"], description: "Processed food & business goods" },
  { id: "tg-18", name: "GST@18%", rate: 18, subTaxes: ["SGST@9%", "CGST@9%"], description: "Standard rate for manufactured items & IT" },
  { id: "tg-28", name: "GST@28%", rate: 28, subTaxes: ["SGST@14%", "CGST@14%"], description: "Luxury items, automobiles & aerated drinks" },
  { id: "tg-40", name: "GST@40%", rate: 40, subTaxes: ["SGST@20%", "CGST@20%"], description: "Sin / demerit goods under GST Council slab" },
]

export interface WithholdingRateItem {
  id: string
  name: string
  rate: number
  section?: string
  collectionCode?: string
  description?: string
}

export const INITIAL_TDS_RATES: WithholdingRateItem[] = [
  { id: "tds-1", name: "Payment of salary", rate: 1, section: "192", collectionCode: "1002" },
  { id: "tds-2", name: "Payment to contractors for HUF/Individuals", rate: 1, section: "194C(1)[Sl.6(i)]", collectionCode: "1023" },
  { id: "tds-3", name: "Payment to contractors for Others", rate: 2, section: "194C(1)[Sl.6(i)...]", collectionCode: "1024" },
  { id: "tds-4", name: "Fees for technical services", rate: 2, section: "194J", collectionCode: "1026" },
  { id: "tds-5", name: "Fees for professional services", rate: 10, section: "194J", collectionCode: "1027" },
  { id: "tds-6", name: "Purchase of goods exceeding ₹50 Lakhs", rate: 0.1, section: "194Q", collectionCode: "1028" },
  { id: "tds-7", name: "Rent on plant & machinery", rate: 2, section: "194-I(a)", collectionCode: "1029" },
  { id: "tds-8", name: "Rent on land & building", rate: 10, section: "194-I(b)", collectionCode: "1030" },
]

export const INITIAL_TCS_RATES: WithholdingRateItem[] = [
  { id: "tcs-1", name: "Sale of goods exceeding ₹50 Lakhs", rate: 0.1, section: "206C(1H)", collectionCode: "2001" },
  { id: "tcs-2", name: "Alcoholic Liquor for human consumption", rate: 1, section: "206C(1)", collectionCode: "2002" },
  { id: "tcs-3", name: "Timber obtained under forest lease", rate: 2.5, section: "206C(1)", collectionCode: "2003" },
  { id: "tcs-4", name: "Scrap & waste materials", rate: 2.5, section: "206C(1)", collectionCode: "2004" },
  { id: "tcs-5", name: "Remittance under LRS / Tour package", rate: 5, section: "206C(1G)", collectionCode: "2005" },
  { id: "tcs-6", name: "Sale of motor vehicle above ₹10 Lakhs", rate: 1, section: "206C(1F)", collectionCode: "2006" },
]

export function getGstRateOptions(enableGst: boolean = true, taxGroups?: TaxGroupItem[]) {
  if (!enableGst) {
    return [{ value: "0", label: "0% (Exempt)" }]
  }
  if (taxGroups && taxGroups.length > 0) {
    return [
      { value: "0", label: "0%" },
      ...taxGroups.map(tg => ({
        value: String(tg.rate),
        label: `${tg.name} (${tg.rate}%)`
      }))
    ]
  }
  return [
    { value: "0", label: "0%" },
    { value: "0.25", label: "0.25%" },
    { value: "3", label: "3%" },
    { value: "5", label: "5%" },
    { value: "12", label: "12%" },
    { value: "18", label: "18%" },
    { value: "28", label: "28%" },
    { value: "40", label: "40%" },
  ]
}
export interface HsnSacItem {
  code: string
  type: "goods" | "service"
  description: string
  category: string
  chapter: string
  defaultGstRate: number
}

export const GOVERNMENT_HSN_SAC_CODES: HsnSacItem[] = [
  // --- GOODS (HSN - Chapters 01 to 98) ---
  {
    code: "01",
    type: "goods",
    description: "LIVE ANIMALS",
    category: "Live Animals",
    chapter: "Chapter 01",
    defaultGstRate: 0
  },
  {
    code: "0101",
    type: "goods",
    description: "LIVE HORSES, ASSES, MULES AND HINNIES.",
    category: "Live Animals",
    chapter: "Chapter 01",
    defaultGstRate: 0
  },
  {
    code: "01011010",
    type: "goods",
    description: "LIVE HORSES, ASSES, MULES AND HINNIES PURE-BRED BREEDING ANIMAL S HORSES",
    category: "Live Animals",
    chapter: "Chapter 01",
    defaultGstRate: 0
  },
  {
    code: "01011020",
    type: "goods",
    description: "LIVE HORSES, ASSES, MULESANDHINNIES PURE-BRED BREEDING ANIMALS ASSES",
    category: "Live Animals",
    chapter: "Chapter 01",
    defaultGstRate: 0
  },
  {
    code: "01011090",
    type: "goods",
    description: "LIVE HORSES, ASSES, MULES AND HINNIES PURE-BRED BREEDING ANIMAL S OTHER",
    category: "Live Animals",
    chapter: "Chapter 01",
    defaultGstRate: 0
  },
  {
    code: "010121",
    type: "goods",
    description: "PURE-BRED BREEDING ANIMALS",
    category: "Live Animals",
    chapter: "Chapter 01",
    defaultGstRate: 0
  },
  {
    code: "01012100",
    type: "goods",
    description: "PURE-BRED BREEDING ANIMALS",
    category: "Live Animals",
    chapter: "Chapter 01",
    defaultGstRate: 0
  },
  {
    code: "3004",
    type: "goods",
    description: "MEDICAMENTS CONSISTING OF MIXED OR UNMIXED PRODUCTS FOR THERAPEUTIC OR PROPHYLACTIC USES",
    category: "Pharmaceuticals",
    chapter: "Chapter 30",
    defaultGstRate: 12
  },
  {
    code: "3002",
    type: "goods",
    description: "Human blood; animal blood; vaccines, toxins, cultures of micro-organisms and similar products",
    category: "Pharmaceuticals",
    chapter: "Chapter 30",
    defaultGstRate: 5
  },
  {
    code: "3006",
    type: "goods",
    description: "Pharmaceutical goods such as sterile surgical catgut, dental cements, first-aid boxes and kits",
    category: "Pharmaceuticals",
    chapter: "Chapter 30",
    defaultGstRate: 12
  },
  {
    code: "8471",
    type: "goods",
    description: "Automatic data processing machines & units thereof; magnetic or optical readers (Laptops, Desktops, Servers, Storage)",
    category: "IT & Electronics",
    chapter: "Chapter 84",
    defaultGstRate: 18
  },
  {
    code: "8528",
    type: "goods",
    description: "Monitors and projectors, reception apparatus for television (LED/LCD Displays, Computer Monitors)",
    category: "IT & Electronics",
    chapter: "Chapter 85",
    defaultGstRate: 18
  },
  {
    code: "8517",
    type: "goods",
    description: "Telephone sets, smartphones, and apparatus for transmission of voice, images or other data",
    category: "IT & Electronics",
    chapter: "Chapter 85",
    defaultGstRate: 18
  },
  {
    code: "8443",
    type: "goods",
    description: "Printing machinery, ink-jet and laser printers, copying machines, facsimile machines and parts",
    category: "IT & Electronics",
    chapter: "Chapter 84",
    defaultGstRate: 18
  },
  {
    code: "8504",
    type: "goods",
    description: "Electrical transformers, static converters (UPS, Inverters, AC adaptors, power supplies)",
    category: "IT & Electronics",
    chapter: "Chapter 85",
    defaultGstRate: 18
  },
  {
    code: "8523",
    type: "goods",
    description: "Discs, tapes, solid-state non-volatile storage devices (SSDs, USB Flash drives, Memory cards)",
    category: "IT & Electronics",
    chapter: "Chapter 85",
    defaultGstRate: 18
  },
  {
    code: "4819",
    type: "goods",
    description: "Cartons, boxes, cases, bags and other packing containers of paper or paperboard",
    category: "Packaging",
    chapter: "Chapter 48",
    defaultGstRate: 18
  },
  {
    code: "3923",
    type: "goods",
    description: "Articles for the conveyance or packing of goods, of plastics; stoppers, lids, caps and closures",
    category: "Packaging",
    chapter: "Chapter 39",
    defaultGstRate: 18
  },
  {
    code: "4802",
    type: "goods",
    description: "Uncoated paper and paperboard, used for writing, printing or other graphic purposes (A4 paper reams)",
    category: "Packaging & Paper",
    chapter: "Chapter 48",
    defaultGstRate: 12
  },
  {
    code: "3808",
    type: "goods",
    description: "Insecticides, rodenticides, fungicides, herbicides, anti-sprouting products and disinfectants",
    category: "Chemicals",
    chapter: "Chapter 38",
    defaultGstRate: 18
  },
  {
    code: "2804",
    type: "goods",
    description: "Hydrogen, rare gases and other non-metals (Industrial oxygen, nitrogen, argon cylinders)",
    category: "Chemicals",
    chapter: "Chapter 28",
    defaultGstRate: 18
  },
  {
    code: "3208",
    type: "goods",
    description: "Paints and varnishes based on synthetic polymers or chemically modified natural polymers",
    category: "Chemicals & Paints",
    chapter: "Chapter 32",
    defaultGstRate: 18
  },
  {
    code: "7214",
    type: "goods",
    description: "Other bars and rods of iron or non-alloy steel (TMT bars, reinforcement steel for construction)",
    category: "Steel & Construction",
    chapter: "Chapter 72",
    defaultGstRate: 18
  },
  {
    code: "7326",
    type: "goods",
    description: "Other articles of iron or steel (Fasteners, bolts, clamps, fabricated hardware components)",
    category: "Steel & Hardware",
    chapter: "Chapter 73",
    defaultGstRate: 18
  },
  {
    code: "2523",
    type: "goods",
    description: "Portland cement, aluminous cement, slag cement and similar hydraulic cements",
    category: "Construction Materials",
    chapter: "Chapter 25",
    defaultGstRate: 28
  },
  {
    code: "6802",
    type: "goods",
    description: "Worked monumental or building stone (Granite, Marble slabs, Ceramic tiles)",
    category: "Construction Materials",
    chapter: "Chapter 68",
    defaultGstRate: 18
  },
  {
    code: "8708",
    type: "goods",
    description: "Parts and accessories of motor vehicles (Automotive spare parts, brakes, gearboxes, suspension)",
    category: "Automotive",
    chapter: "Chapter 87",
    defaultGstRate: 28
  },
  {
    code: "8507",
    type: "goods",
    description: "Electric accumulators, including separators therefor (Lead-acid automotive batteries, Lithium-ion packs)",
    category: "Automotive & Electrical",
    chapter: "Chapter 85",
    defaultGstRate: 28
  },
  {
    code: "9403",
    type: "goods",
    description: "Other furniture and parts thereof (Office chairs, steel desks, wooden workstations, storage racks)",
    category: "Furniture & Fixtures",
    chapter: "Chapter 94",
    defaultGstRate: 18
  },
  {
    code: "9405",
    type: "goods",
    description: "Lamps and lighting fittings including searchlights, spotlights, LED panels and luminaires",
    category: "Electrical & Lighting",
    chapter: "Chapter 94",
    defaultGstRate: 18
  },
  {
    code: "6109",
    type: "goods",
    description: "T-shirts, singlets and other vests, knitted or crocheted (Cotton, synthetic blends)",
    category: "Apparel & Textiles",
    chapter: "Chapter 61",
    defaultGstRate: 5
  },
  {
    code: "6203",
    type: "goods",
    description: "Men's or boys' suits, ensembles, jackets, blazers, trousers, overalls (Woven garments)",
    category: "Apparel & Textiles",
    chapter: "Chapter 62",
    defaultGstRate: 12
  },
  {
    code: "6403",
    type: "goods",
    description: "Footwear with outer soles of rubber, plastics, leather or composition leather",
    category: "Footwear",
    chapter: "Chapter 64",
    defaultGstRate: 18
  },
  {
    code: "1006",
    type: "goods",
    description: "Rice (Semi-milled or wholly milled, polished or glazed, pre-packaged and labelled)",
    category: "Food & Agriculture",
    chapter: "Chapter 10",
    defaultGstRate: 5
  },
  {
    code: "0402",
    type: "goods",
    description: "Milk and cream, concentrated or containing added sugar or other sweetening matter",
    category: "Food & Dairy",
    chapter: "Chapter 04",
    defaultGstRate: 5
  },
  {
    code: "0902",
    type: "goods",
    description: "Tea, whether or not flavoured (Black tea, Green tea packaged re-sale packs)",
    category: "Food & Beverages",
    chapter: "Chapter 09",
    defaultGstRate: 5
  },
  {
    code: "0901",
    type: "goods",
    description: "Coffee, whether or not roasted or decaffeinated; coffee beans and ground blends",
    category: "Food & Beverages",
    chapter: "Chapter 09",
    defaultGstRate: 5
  },
  {
    code: "1905",
    type: "goods",
    description: "Bread, pastry, cakes, biscuits and other bakers' wares; packaging snacks",
    category: "Food & FMCG",
    chapter: "Chapter 19",
    defaultGstRate: 18
  },
  {
    code: "2201",
    type: "goods",
    description: "Waters, including natural or artificial mineral waters and aerated waters, not sweetened",
    category: "Beverages",
    chapter: "Chapter 22",
    defaultGstRate: 18
  },
  {
    code: "2202",
    type: "goods",
    description: "Waters, including mineral waters, containing added sugar or flavouring (Soft drinks, Aerated beverages)",
    category: "Beverages",
    chapter: "Chapter 22",
    defaultGstRate: 28
  },
  {
    code: "7113",
    type: "goods",
    description: "Articles of jewellery and parts thereof, of precious metal (Gold, Silver, Platinum jewellery)",
    category: "Precious Metals",
    chapter: "Chapter 71",
    defaultGstRate: 3
  },
  {
    code: "7102",
    type: "goods",
    description: "Diamonds, whether or not worked, but not mounted or set (Cut and polished diamonds)",
    category: "Precious Metals",
    chapter: "Chapter 71",
    defaultGstRate: 0.25
  },
  {
    code: "9018",
    type: "goods",
    description: "Instruments and appliances used in medical, surgical, dental or veterinary sciences",
    category: "Medical Equipment",
    chapter: "Chapter 90",
    defaultGstRate: 12
  },
  {
    code: "9021",
    type: "goods",
    description: "Orthopaedic appliances, splints, hearing aids, pacemakers, artificial limbs and joints",
    category: "Medical Equipment",
    chapter: "Chapter 90",
    defaultGstRate: 5
  },

  // --- SERVICES (SAC - Chapter 99) ---
  {
    code: "998311",
    type: "service",
    description: "Management consulting and management services (Strategic advisory, Business process engineering)",
    category: "Professional & Consulting",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "998313",
    type: "service",
    description: "Information technology (IT) consulting and support services (System integration, Architecture)",
    category: "IT & Software",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "998314",
    type: "service",
    description: "Information technology (IT) design and development services (Custom software, Web apps, Mobile apps)",
    category: "IT & Software",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "998315",
    type: "service",
    description: "Hosting and information technology (IT) infrastructure provisioning services (Cloud hosting, SaaS, Data center)",
    category: "IT & Software",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "998316",
    type: "service",
    description: "IT infrastructure and network management services (DevOps, Server administration, NOC operations)",
    category: "IT & Software",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "998221",
    type: "service",
    description: "Financial auditing and accounting services (Statutory audit, Tax audit, Financial statement preparation)",
    category: "Accounting & Legal",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "998222",
    type: "service",
    description: "Bookkeeping and tax preparation services (GST return filing, TDS compliance, Payroll processing)",
    category: "Accounting & Legal",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "998211",
    type: "service",
    description: "Legal advisory and representation services concerning civil, criminal and corporate commercial law",
    category: "Accounting & Legal",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "995411",
    type: "service",
    description: "General construction services of residential buildings (Single / multi-family dwellings)",
    category: "Construction & Real Estate",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 12
  },
  {
    code: "995412",
    type: "service",
    description: "General construction services of other than residential buildings (Offices, Warehouses, Factories)",
    category: "Construction & Real Estate",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "995421",
    type: "service",
    description: "General construction services of civil engineering works (Highways, Bridges, Water treatment, Pipelines)",
    category: "Construction & Real Estate",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "996511",
    type: "service",
    description: "Road transport services of goods including Goods Transport Agency (GTA freight consignment note)",
    category: "Transportation & Logistics",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 5
  },
  {
    code: "996512",
    type: "service",
    description: "Railway transport services of goods (Containerized rail cargo, bulk goods transport)",
    category: "Transportation & Logistics",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 5
  },
  {
    code: "996711",
    type: "service",
    description: "Cargo handling and container freight forwarding services (Clearance, Stevedoring, CFS)",
    category: "Transportation & Logistics",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "996712",
    type: "service",
    description: "Storage and warehousing services of goods (Cold storage, Industrial and grain warehousing)",
    category: "Transportation & Logistics",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "997212",
    type: "service",
    description: "Rental or leasing services involving own or leased residential property (Commercial purposes)",
    category: "Real Estate & Rental",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "997213",
    type: "service",
    description: "Rental or leasing services of commercial real estate (Offices, Retail shops, Industrial sheds)",
    category: "Real Estate & Rental",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "997311",
    type: "service",
    description: "Leasing or rental services of machinery, plant, transport equipment and goods without operator",
    category: "Real Estate & Rental",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "998361",
    type: "service",
    description: "Advertising services, promotional campaigns, media planning and creative digital marketing",
    category: "Marketing & Advertising",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "998362",
    type: "service",
    description: "Purchase or sale of advertising space or time on commission (Media buying and brokerage)",
    category: "Marketing & Advertising",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "998713",
    type: "service",
    description: "Maintenance and repair services of computers and peripheral equipment (Hardware AMC, Server repairs)",
    category: "Maintenance & Repair",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "998714",
    type: "service",
    description: "Maintenance and repair services of office, accounting and electrical machinery",
    category: "Maintenance & Repair",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "996311",
    type: "service",
    description: "Room accommodation services provided by hotels, inns, resorts, guest houses (>₹1000/night)",
    category: "Hospitality & Food",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 12
  },
  {
    code: "996331",
    type: "service",
    description: "Restaurant and food serving services (Air-conditioned dining, Cafeteria, Quick service restaurants)",
    category: "Hospitality & Food",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 5
  },
  {
    code: "996332",
    type: "service",
    description: "Outdoor catering and banquet event food preparation services",
    category: "Hospitality & Food",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 5
  },
  {
    code: "999311",
    type: "service",
    description: "Human health services (Medical diagnostics, Hospital hospitalization, Clinical consultations)",
    category: "Healthcare & Education",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 0
  },
  {
    code: "999210",
    type: "service",
    description: "Primary, secondary and higher secondary education services (Curricular education & recognized boards)",
    category: "Healthcare & Education",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 0
  },
  {
    code: "998540",
    type: "service",
    description: "Security and investigation services (Security guards, Facility surveillance, Armored transport)",
    category: "Security & Facility",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "998511",
    type: "service",
    description: "Executive search, placement and employment agency services (Recruitment, Staff augmentation)",
    category: "Staffing & HR",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "998412",
    type: "service",
    description: "Fixed telephony, mobile communication, broadband internet and leased line data access services",
    category: "Telecom & Internet",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 18
  },
  {
    code: "998811",
    type: "service",
    description: "Manufacturing services on physical inputs owned by others (Job work / Textile spinning & dyeing)",
    category: "Job Work & Manufacturing",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 5
  },
  {
    code: "998812",
    type: "service",
    description: "Job work services on engineering components, metal fabrication, electroplating and machining",
    category: "Job Work & Manufacturing",
    chapter: "Chapter 99 (SAC)",
    defaultGstRate: 12
  }
]

export function searchHsnSacCodes(query: string = "", typeFilter?: "goods" | "service" | "all"): HsnSacItem[] {
  const cleanQuery = query.toLowerCase().trim()
  return GOVERNMENT_HSN_SAC_CODES.filter(item => {
    if (typeFilter && typeFilter !== "all" && item.type !== typeFilter) {
      return false
    }
    if (!cleanQuery) return true
    return (
      item.code.toLowerCase().includes(cleanQuery) ||
      item.description.toLowerCase().includes(cleanQuery) ||
      item.category.toLowerCase().includes(cleanQuery) ||
      item.chapter.toLowerCase().includes(cleanQuery)
    )
  })
}

export function getHsnSacByCode(code: string): HsnSacItem | undefined {
  if (!code) return undefined
  const clean = code.trim().toLowerCase()
  return GOVERNMENT_HSN_SAC_CODES.find(item => item.code.toLowerCase() === clean)
}

export function getDocPlaceOfSupply(
  doc: { placeOfSupply?: string; partyStateCode?: string; partyGstin?: string },
  defaultState: string = "27"
): string {
  if (doc.placeOfSupply && doc.placeOfSupply.trim()) {
    return doc.placeOfSupply.split("-")[0].trim().padStart(2, "0")
  }
  if (doc.partyStateCode && doc.partyStateCode.trim()) {
    return doc.partyStateCode.split("-")[0].trim().padStart(2, "0")
  }
  if (doc.partyGstin && doc.partyGstin.trim().length >= 2) {
    const code = doc.partyGstin.trim().slice(0, 2)
    if (/^\d{2}$/.test(code)) return code
  }
  return defaultState
}

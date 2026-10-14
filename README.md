# ⚖️ LegalMetrix

> **Automated Compliance Verification System for Packaged Commodities**  
> Built for **Smart India Hackathon 2026** · **Problem Statement ID: 26034**  
> **Ministry of Consumer Affairs, Food & Public Distribution** · **Department of Consumer Affairs (DoCA)**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003b57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com/)

---

## 📌 Problem Statement Overview

- **Problem ID:** 26034
- **Title:** Software System to check compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 by scanning products, images and labels.
- **Organization:** Ministry of Consumer Affairs, Food & Public Distribution
- **Department:** Department of Consumer Affairs (DoCA)
- **Category:** Software
- **Theme:** Miscellaneous

### The Challenge
Under the **Legal Metrology (Packaged Commodities) Rules, 2011 (PCR, 2011)** and the **Legal Metrology Act, 2009**, every packaged commodity sold in India (offline retail or online e-commerce) must display mandatory declarations:
1. Name and identity of the commodity
2. Name and address of the manufacturer / packer / importer
3. Net quantity in standard metric units
4. Maximum Retail Price (MRP) inclusive of all taxes in Indian Rupees
5. Month and year of manufacture / packing / import
6. Consumer care contact details (telephone helpline & email)
7. Country of origin (mandatory for imported commodities)
8. Batch / Lot number and statutory certifications (e.g., FSSAI)

Manual physical inspection by enforcement officers cannot keep pace with millions of e-commerce listings and retail packages. Non-compliant packages with missing declarations, obscured MRPs, or non-standard metric declarations lead to consumer exploitation and revenue loss.

### The LegalMetrix Solution
**LegalMetrix** is a full-stack, AI-powered regulatory compliance verification platform. It allows regulatory inspectors and consumers to inspect packages across multiple faces (Front, Back, Side, MRP Panel), extracts statutory declarations using optical character recognition (OCR) and computer vision, evaluates them against the 8 codified Legal Metrology rules, produces an automated preliminary score (0–100), and generates official inspection reports ready for statutory enforcement.

---

## 🚀 Key Features

- **Multi-Image Packaging Panel Inspection**:
  - Upload **1 to 10 images** per commodity to capture all faces of a 3D package (Front, Back Details, MRP & Batch, Side, Ingredients & Nutrition).
  - Individual panel tagging for organized evidence tracking.
- **Universal Image Format Decoding**:
  - Built-in preprocessing via `sharp` automatically converts and auto-orients modern formats (**AVIF, WebP, HEIC, JPG, PNG**) for maximum OCR fidelity.
- **Statutory Rules Engine (PCR, 2011)**:
  - 8 codified rules mapped directly to Rule 6 and Rule 10 of PCR 2011.
  - Transparent 100-point scoring algorithm categorizing products into **COMPLIANT (≥90)**, **WARNING (70–89)**, and **NON-COMPLIANT (<70)**.
- **Executive AI Legal Assessment**:
  - Automatically synthesizes findings into legal assessment summaries citing exact deficiencies and recommendations for enforcement officers.
- **Dual-Storage Cloud & Local Architecture**:
  - **Local SQLite** (`better-sqlite3`): Zero-config, offline-capable, ultra-fast synchronous storage.
  - **Cloud Supabase**: Real-time cloud sync for centralized auditing across field officers.
- **Printable Official Statutory Inspection Reports**:
  - Formatted to Ministry of Consumer Affairs guidelines. Includes commodity details, multi-panel evidence photo strips, rule audit table, and an authorized officer sign-off / seal block.
- **E-Commerce Listing Mode**:
  - Analyzes raw product descriptions and marketplace listings to catch non-compliant online sellers before delivery.
- **Interactive Officer Dashboard**:
  - Real-time compliance breakdown (Compliant vs Warning vs Violations), score distribution histograms, and searchable audit trail.

---

## 🏛️ Legal Metrology Compliance Rules Matrix

| Rule ID | Statutory Requirement | Legal Metrology Rule Reference | Category | Max Score | Severity |
|:-------:|:----------------------|:------------------------------|:---------|:---------:|:--------:|
| **R01** | Commodity Identity | Rule 6(1)(a) | Product Identification | **10 pts** | Critical |
| **R02** | Manufacturer / Packer / Importer Name | Rule 6(1)(a) | Manufacturer Information | **15 pts** | Critical |
| **R03** | Complete Registered Address with PIN/State | Rule 6(1)(a) | Manufacturer Information | **10 pts** | Major |
| **R04** | Net Quantity in Standard Metric Units | Rule 6(1)(b) | Quantity Declaration | **15 pts** | Critical |
| **R05** | MRP (Inclusive of All Taxes) in INR | Rule 6(1)(f) | Price Declaration | **20 pts** | Critical |
| **R06** | Month & Year of Mfg / Packing / Import | Rule 6(1)(d) | Date Declaration | **15 pts** | Major |
| **R07** | Consumer Care Details (Phone Helpline & Email) | Rule 6(1)(g) / CPA 2019 | Consumer Care | **10 pts** | Major |
| **R08** | Country of Origin Declaration | Rule 6(10) / Import Rules | Origin Declaration | **5 pts** | Minor |
| **TOTAL** | **8 Codified Statutory Checks** | **Legal Metrology Rules, 2011** | — | **100 pts** | — |

### Compliance Thresholds
- 🟢 **COMPLIANT (90 – 100 pts)**: All mandatory declarations present and verified in standard formats.
- 🟡 **POTENTIAL WARNING (70 – 89 pts)**: Minor omissions (e.g., partial address without PIN code, single contact channel).
- 🔴 **POTENTIAL NON-COMPLIANCE (< 70 pts)**: Missing critical declarations (e.g., no MRP, missing manufacturer name, undeclared net quantity). Warrants physical verification under Legal Metrology Act, 2009.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js Frontend (App Router)                   │
│  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐ ┌───────────────┐ │
│  │  Dashboard   │ │  Multi-Image  │ │ Result Audit │ │  Official     │ │
│  │   Page (/)   │ │ Scanner (/scan)│ │ Gallery (/result)│ Report (/report)│
│  └──────────────┘ └───────────────┘ └──────────────┘ └───────────────┘ │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ JSON / Multipart HTTP
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js Route Handlers (/api/*)                 │
│  /api/inspections           /api/inspections/:id/images                │
│  /api/inspections/:id       /api/inspections/:id/analyze               │
│  /api/inspections/text      /api/inspections/:id/report                │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│        Server Processing Core        │  │     Data & Persistence       │
│                                      │  │                              │
│ 1. Sharp Image Preprocessor          │  │ 1. SQLite (better-sqlite3)   │
│    (AVIF/WebP/HEIC → PNG Normalize)  │  │    Local instant persistence │
│ 2. Server Tesseract.js OCR Worker    │  │                              │
│ 3. Multi-Panel Field Aggregator      │  │ 2. Cloud Supabase            │
│ 4. 8-Rule Compliance Engine          │  │    Dual-storage cloud sync   │
│ 5. AI Legal Summary Generator        │  │                              │
└──────────────────────────────────────┘  │ 3. Local Uploads Storage     │
                                          │    (/data/uploads/:id/*)     │
                                          └──────────────────────────────┘
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.3.5 (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript 5.0 (Strict mode enabled)
- **Styling**: Tailwind CSS, CSS Grid/Flexbox
- **Icons & Graphics**: Lucide React
- **Data Visualization**: Recharts (PieChart, BarChart)
- **OCR Engine**: Tesseract.js v5 (Server-side Node.js worker pipeline)
- **Image Processing**: Sharp (Universal conversion for AVIF, WebP, HEIC, PNG, JPEG)
- **Primary Database**: SQLite via `better-sqlite3` (synchronous, local, zero-config)
- **Cloud Database**: Supabase (`@supabase/supabase-js`, PostgreSQL with Row Level Security)
- **Identifiers**: UUID v4

---

## 📂 Project Structure

```
legalmetrix/
├── app/
│   ├── api/
│   │   ├── inspections/
│   │   │   ├── route.ts              # GET list, POST create session, DELETE clear all
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts          # GET detail, DELETE session
│   │   │   │   ├── images/route.ts   # POST multipart 1-10 package images
│   │   │   │   ├── analyze/route.ts  # POST trigger OCR & compliance evaluation
│   │   │   │   └── report/route.ts   # GET structured statutory report
│   │   │   ├── demo/route.ts         # POST demo scenario runner
│   │   │   └── text/route.ts         # POST e-commerce listing text inspection
│   │   └── uploads/[...path]/
│   │       └── route.ts              # Secure static image streaming
│   ├── history/page.tsx              # Inspection history log with filter & search
│   ├── report/page.tsx               # Printable Government inspection report
│   ├── result/page.tsx               # Inspection result gallery with rule breakdown
│   ├── rules/page.tsx                # Statutory Legal Metrology rules documentation
│   ├── scan/page.tsx                 # Multi-image package scanner & demo launcher
│   ├── layout.tsx                    # Root navigation & footer
│   └── page.tsx                      # Officer intelligence dashboard
├── components/                       # Shared UI components
├── context/                          # React context providers
├── data/
│   ├── demoProducts.ts               # Sample evaluation scenarios
│   └── supabase_schema.sql           # Complete Supabase PostgreSQL migration
├── lib/
│   ├── supabase.ts                   # Supabase client initializer
│   └── server/
│       ├── analysisService.ts        # Inspection orchestration pipeline
│       ├── complianceEngine.ts       # 8-rule scoring & evaluation logic
│       ├── db.ts                     # SQLite database init & schema DDL
│       ├── fieldExtractionService.ts # Multi-image regex parser & deduplicator
│       ├── inspectionService.ts      # Database CRUD operations
│       ├── ocrService.ts             # Sharp + Tesseract.js OCR service
│       ├── storageService.ts         # Local file system storage manager
│       └── supabaseService.ts        # Cloud sync service
├── rules/
│   └── complianceRules.ts            # Codified statutory rules (PCR, 2011)
├── services/                         # Client-side helpers
├── types/                            # TypeScript interfaces
├── .env.example                      # Environment variables template
├── next.config.js                    # Webpack & external packages configuration
├── package.json                      # Project dependencies & scripts
├── run.bat                           # 1-Click Windows execution script
└── README.md                         # Project documentation
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: v18.17.0 or higher (v20+ recommended)
- **npm**: v9+ or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/pragyangoyal/LegalMetrix.git
   cd LegalMetrix
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables** (Optional — local SQLite works out of the box):
   ```bash
   cp .env.example .env.local
   ```
   If connecting to Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   *(Or on Windows, simply double-click `run.bat`)*

5. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Database Setup (Supabase Cloud Sync)

LegalMetrix uses **local SQLite** by default with automatic background sync to **Supabase**.

To enable Supabase:
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the script in [`data/supabase_schema.sql`](./data/supabase_schema.sql).
4. Add your Supabase URL and Publishable / Anon Key to `.env.local`.

---

## 🔌 API Reference

| Method | Endpoint | Description |
|:------:|:---------|:------------|
| `GET` | `/api/inspections` | List inspection records with optional `?status=...` and `?search=...` |
| `POST` | `/api/inspections` | Initialize new inspection session (`{ scanMode, productName }`) |
| `DELETE` | `/api/inspections` | Clear all inspections from database |
| `GET` | `/api/inspections/:id` | Get full inspection detail including images, fields, and rule checks |
| `DELETE` | `/api/inspections/:id` | Delete inspection session and clean up uploaded files |
| `POST` | `/api/inspections/:id/images` | Upload 1 to 10 package images (multipart form data with panel labels) |
| `POST` | `/api/inspections/:id/analyze` | Trigger OCR extraction and statutory compliance validation |
| `GET` | `/api/inspections/:id/report` | Retrieve formatted statutory report payload |
| `POST` | `/api/inspections/demo` | Run deterministic demo scenario (`{ demoProductId: 'demo-rice' }`) |
| `POST` | `/api/inspections/text` | Inspect e-commerce listing text (`{ text, title }`) |
| `GET` | `/api/uploads/:id/:filename` | Stream uploaded package images with cache headers |

---

## 🎯 3-Minute Hackathon Demo Script

1. **Dashboard (`/`)**:
   - Showcase real-time compliance metrics, status distribution pie chart, score histograms, and recent audit logs.
2. **Scanner (`/scan`)**:
   - Demonstrate multi-image upload: Add package panels (Front, Back, MRP Panel) and assign labels.
   - Or click one of the pre-loaded **Demo Scenarios** (e.g., *Golden Harvest Basmati Rice* for 100% compliant, *NaturaHerb Shampoo* for Warning, or *Spicy Crunch Namkeen* for Violations).
   - Watch the animated 6-step inspection pipeline.
3. **Inspection Result (`/result?id=...`)**:
   - View the interactive multi-image thumbnail strip.
   - Inspect the statutory score ring, AI executive legal summary, and 8 expandable rule audit cards showing detected statutory evidence.
4. **Official Report (`/report?id=...`)**:
   - Click "View Official Report" to present the formal inspection document formatted for the Ministry of Consumer Affairs, complete with evidence photos and officer signature section.
   - Click **"Print / Save as PDF"** to demonstrate one-click PDF generation.
5. **Audit History (`/history`)**:
   - Filter by *Compliant*, *Warning*, or *Non-Compliant*, and search by commodity name or ID.

---

## ⚖️ Legal Disclaimer

*This software is a prototype developed for Smart India Hackathon 2026 (Problem Statement 26034). All automated compliance scores and preliminary assessments generated by this system are designed to aid authorized enforcement officers and consumers. Final enforcement actions must follow physical inspection and verification by an authorized Legal Metrology Officer under the Legal Metrology Act, 2009.*

---

## 👥 Contributors

- **Pragyan Goyal** — Full-Stack & Systems Architecture
- Built with ❤️ for Smart India Hackathon 2026

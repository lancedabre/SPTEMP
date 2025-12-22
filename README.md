<div align="center">
  <br />
  <img src="public/logo5.png" alt="Cinehoria Logo" width="120" />
  <br />
  <h1 align="center">CINEHORIA</h1>
  <p align="center">
    <strong>The Modern, Distraction-Free Screenwriting Tool</strong>
  </p>
  
  <p align="center">
    <a href="#key-features">Key Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#shortcuts">Shortcuts</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Slate.js-Editor-white?style=flat-square" alt="Slate.js" />
  </p>
</div>

<br />

## 🎬 About The Project

**Cinehoria** is a sleek, web-based screenplay editor designed for focus and creativity. Built to rival industry standards like Final Draft, it offers standardized screenplay formatting, real-time cloud sync, and a distraction-free "dark mode" environment.

Whether you're outlining your next blockbuster or drafting an indie short, Cinehoria keeps your formatting perfect so you can focus on the story.

![Screenshot Placeholder](https://via.placeholder.com/1200x600/1a1a1a/ffffff?text=Cinehoria+Interface+Preview)
*(Replace this link with a screenshot of your actual editor!)*

---

## ✨ Key Features

- **📝 Standardized Formatting:** Automatically handles margins and styling for Scene Headings, Action, Characters, Dialogue, Parentheticals, and Transitions.
- **☁️ Real-Time Cloud Save:** Never lose a word. Typing syncs instantly to Supabase with smart debouncing.
- **🔒 Race-Condition Proof:** Advanced "One-Time Load" logic ensures your cursor never jumps and your data never gets wiped while typing.
- **📄 PDF Export:** Professional industry-standard PDF generation with proper fonts (Courier Prime) and layout.
- **⌨️ Keyboard Shortcuts:** Navigate and format without touching the mouse.
- **📂 Local Import/Export:** Save backups as JSON (`.cinehoria`) and load them back anytime.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Editor Engine:** [Slate.js](https://docs.slatejs.org/)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **PDF Generation:** [PDFMake](http://pdfmake.org/)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

Follow these steps to run Cinehoria locally.

### Prerequisites
* Node.js 18+
* A Supabase account

### Installation

1. **Clone the repo**
   ```sh
   git clone [https://github.com/yourusername/cinehoria.git](https://github.com/yourusername/cinehoria.git)
   cd cinehoria

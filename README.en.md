
### README.en.md (انگلیسی)

```markdown
<div align="center">

# GUI Advanced Chat API

**A modern, lightweight, and fully standalone PHP interface for interacting with OpenAI-compatible AI models**

[🇮🇷 فارسی](README.md) | [🇬🇧 English](README.en.md)

<br>

**Current Version: v2.2.0**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PHP](https://img.shields.io/badge/PHP-7.4%2B-777BB4?logo=php&logoColor=white)](https://www.php.net/)
[![No Database](https://img.shields.io/badge/Database-None-success)](#)
[![Streaming](https://img.shields.io/badge/Streaming-SSE-orange)](#)

</div>

---

## Overview

**GUI Advanced Chat API** is a modern, responsive, and lightweight chat interface for Large Language Models (LLMs), built entirely with pure PHP — no heavy frameworks or databases required.

It connects to any OpenAI-compatible API (OpenAI, Groq, OpenRouter, local FreeLLMAPI, Dahl, and more) and offers advanced features including **real-time streaming**, **Markdown + KaTeX + Syntax Highlighting**, **multi-provider management**, **file/image/audio/video uploads**, **chat history with trash/restore**, **100+ color themes**, **bilingual support (Persian/English)**, and much more.

Designed for:
- Developers and AI enthusiasts
- Shared PHP hosting environments
- Local use or easy customization

---

## Preview

> Screenshots are located in `.github/images`

<p align="center">
  <img src=".github/images/preview.png" width="100%" alt="Preview">
</p>

### Settings
<p align="center">
  <img src=".github/images/settings.png" width="90%" alt="Settings">
</p>

### Light Mode
<p align="center">
  <img src=".github/images/Lite-mode.png" width="90%" alt="Light Mode">
</p>

---

## Key Features

### UI & UX
- Modern, minimal, fully responsive design (mobile + desktop)
- Full RTL (Persian) and LTR (English) support with instant language switching
- **100+ beautiful color themes**
- Multiple response animations (Typewriter, Word-by-word, Fade, Smooth, or None)
- Smart scroll (doesn't interrupt if you're scrolled up)
- Real-time streaming with **stop generation** anytime
- Customizable quick prompts (up to 4 editable slots)
- User message navigation + chat search

### AI Capabilities
- Full support for **OpenAI-compatible APIs** (OpenAI, Groq, OpenRouter, FreeLLMAPI, Dahl, etc.)
- Multi-provider management (add, edit, test connection, activate)
- Model selection with search + Auto mode
- **True streaming** (SSE) with automatic non-streaming fallback
- Web search support (for FreeLLMAPI)
- Temperature control
- Mathematical formulas via **KaTeX**
- Full Markdown rendering + **Syntax Highlighting** (Highlight.js)
- File uploads: images (base64), audio, video, text files (up to 20 MB)
- Per-chat token usage display

### Data Management & Customization
- **No database** — everything stored in JSON files
- Full chat history + search + trash (restore / permanent delete)
- User & AI profiles (name + uploadable avatars)
- Chat backup & restore (Export/Import JSON)
- Simple modular structure for easy extension

### Technical
- Built with **pure PHP** + Vanilla JS + CSS
- Minimal files and clean architecture
- Works on ordinary shared hosting
- Easy to customize and extend

---

## Requirements

- PHP 7.4 or higher (recommended: 8.0+)
- **cURL** extension (required for API calls)
- **GD** extension (optional – for avatar resizing)
- Write permissions for the `data/` directory (created automatically)
- Web server (Apache/Nginx) or local PHP server (`php -S`)

---

## Installation

### Method 1: Shared Hosting
1. Download or clone the repository.
2. Upload all files to your public_html (or a subdirectory).
3. Ensure the `data/` folder is writable (usually created automatically with 0777 permissions).
4. Open the site in your browser.
5. Go to **Settings** and configure your provider + API key.

### Method 2: Local Development
```bash
git clone https://github.com/abalfazljam/GUI-advanced-chat-API.git
cd GUI-advanced-chat-API
php -S localhost:8000

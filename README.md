<p align="center">
  <img width="1219" height="517" alt="Rho Reader banner" src="https://github.com/user-attachments/assets/c01351f2-db80-45e8-918e-162fd99ec4ed" />
</p>

<p align="center">
  <b>Read and manage RSS feeds.</b><br/><br />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Obsidian-Plugin-7f6df2" />
  <a href="https://github.com/scriptnull/rho-reader/actions/workflows/test.yml"><img src="https://github.com/scriptnull/rho-reader/actions/workflows/test.yml/badge.svg?branch=main" /></a>
</p>

<br />

**Rho** was derived from *Rhododendron* after I discovered the existence of these beautiful flowers in a bedtime story.

## Features

- Built on top of [Obsidian Bases](https://help.obsidian.md/bases).
- Supports RSS, Atom, and JSON Feed formats.
- Import and export OPML.
- Tagging system to organise reading lists.

## Installation

Requires Obsidian 1.9.0 or newer (Rho Reader is built on top of Obsidian Bases).

### Option 1: Community plugins (recommended, once approved)

1. Open **Settings → Community plugins** in Obsidian.
2. Click **Browse** and search for "Rho Reader".
3. Click **Install**, then **Enable**.

### Option 2: Manual install from GitHub Releases

1. Go to the [Releases](https://github.com/scriptnull/rho-reader/releases) page and pick the latest release.
2. Download `main.js`, `manifest.json`, and `styles.css` (attached as individual files on the release).
3. Place them in your vault at `<your-vault>/.obsidian/plugins/rho-reader/` (create the folder if needed).
4. Restart Obsidian and enable the plugin in **Settings → Community plugins**.

### Option 3: Build from source

```bash
cd <path-to-your-vault>/.obsidian/plugins
git clone git@github.com:scriptnull/rho-reader.git
cd rho-reader
npm install
npm run build
```

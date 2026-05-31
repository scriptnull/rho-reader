<p align="center">
  <img alt="Rho Reader" src="https://github.com/user-attachments/assets/0a484455-231a-4183-b57b-8389d0c47298" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Obsidian-Plugin-7f6df2" />
  <a href="https://github.com/scriptnull/rho-reader/actions/workflows/test.yml"><img src="https://github.com/scriptnull/rho-reader/actions/workflows/test.yml/badge.svg?branch=main" /></a>
</p>

<br />

Rho Reader is an RSS reader plugin for [Obsidian](https://obsidian.md/).

[File over app](https://stephango.com/file-over-app): _Every feed and every post is its own file in your vault._

<p align="center">🌸</p>

**Rho** was derived from *Rhododendron* after I discovered the existence of these beautiful flowers in a bedtime story.

## Workflows

Attach an RSS feed URL to a note and get the posts alongside it.

<img alt="Add feed" src="https://github.com/user-attachments/assets/f92d37b7-a93f-492d-8ab7-221e432fd612" />

<p align="center">~</p>

Clicking a post opens it in your web browser. To stay inside Obsidian instead, enable the "Web Viewer" core plugin. Clicking a post marks it "read" by default to help you keep track of what you have read.

<img alt="Rho Reader - Where posts open" src="https://github.com/user-attachments/assets/2b0c1767-629f-4a3c-aa19-6abb473e105d" />


## Features

- Supports RSS, Atom, and JSON Feed formats.
- Import and export OPML.
- Tagging system to organise reading lists.

## Installation

Requires Obsidian 1.9.0 or newer (Rho Reader is built on top of Obsidian Bases).

### Option 1: Community plugins (recommended)

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

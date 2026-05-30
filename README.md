<p align="center">
  <img width="1219" height="517" alt="Rho Reader banner" src="https://github.com/user-attachments/assets/c01351f2-db80-45e8-918e-162fd99ec4ed" />
</p>

<p align="center">
  A Reading Companion for Obsidian 🌸📚<br/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Obsidian-Plugin-7f6df2" />
  <a href="https://github.com/scriptnull/rho-reader/actions/workflows/test.yml"><img src="https://github.com/scriptnull/rho-reader/actions/workflows/test.yml/badge.svg?branch=main" /></a>
</p>

<br />

Rho Reader is an RSS reader plugin for [Obsidian](https://obsidian.md/). It is built on top of [Obsidian Bases](https://help.obsidian.md/bases).

[File over app](https://stephango.com/file-over-app) - Every feed and post gets a file of its own in your vault. You can turn any file in your vault into an RSS feed source by adding the `feed_url` property.

<p align="center">🌸</p>

**Rho** was derived from *Rhododendron* after I discovered the existence of these beautiful flowers in a bedtime story.

## Features

- Supports RSS, Atom, and JSON Feed formats.
- Import and export OPML.
- Tagging system to organise reading lists.

## Screenshots

<img width="1247" height="786" alt="image" src="https://github.com/user-attachments/assets/6e596b4b-8f6f-4745-8b0d-55b1756d6cad" />
<img width="1247" height="786" alt="image" src="https://github.com/user-attachments/assets/fb33c9b3-43ad-4a70-8e98-a155161a2e45" />
<img width="515" height="220" alt="image" src="https://github.com/user-attachments/assets/2443fa37-9c6b-4a07-a631-be38a6b380e0" />

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

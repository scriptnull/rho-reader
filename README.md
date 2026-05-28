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

Rho Reader is under active development and not yet published in the Obsidian community plugin store. So you'll need to install it manually.

### Option 1: Download zip

1. Go to the [Releases](https://github.com/scriptnull/rho-reader/releases) page.
2. Download `rho-reader.zip` from the latest release.
3. Extract the zip file.
4. Copy the `rho-reader` folder to your vault's plugins directory: `<your-vault>/.obsidian/plugins/`
5. Restart Obsidian and enable the plugin in **Settings → Community plugins**.

### Option 2: Build from source

```bash
cd <path-to-your-vault>/.obsidian/plugins
git clone git@github.com:scriptnull/rho-reader.git
cd rho-reader
npm install
npm run build
```

<p align="center">
  <img alt="Rho Banner" src="https://github.com/user-attachments/assets/99cd45cc-bb1b-4c9a-b87e-c13b15fc1de9" />
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

## Features

- Supports RSS, Atom, and JSON Feed formats.
- Import and export OPML.
- Tagging system to organise reading lists.

## Workflows

Add an RSS feed URL to a note and get the posts alongside it.

<img alt="Rho Reader - Pane" src="https://github.com/user-attachments/assets/11822188-526b-42ff-9f5c-2036fe7b5602" />

<p align="center">~</p>

By default, clicking a post opens it in your web browser. It also marks the post as read, helping you track what you've seen.

> [!TIP]
> Enable the **Web Viewer** core plugin to open posts inside Obsidian instead.

<img alt="Rho Reader - Where posts open" src="https://github.com/user-attachments/assets/bdeea344-f429-462f-9ba0-a6bda8157717" />


<p align="center">~</p>

Explore the Rho commands to get the most out of it.

<img alt="Rho Reader - Commands" src="https://github.com/user-attachments/assets/6818c527-2f9c-4c7f-8499-f159e87936e2" />

<p align="center">~</p>

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

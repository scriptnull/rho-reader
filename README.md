<p align="center">
  <img width="1219" height="517" alt="Rho Reader banner" src="https://github.com/user-attachments/assets/c01351f2-db80-45e8-918e-162fd99ec4ed" />
</p>

<p align="center">
  <b>A Reading Companion for Obsidian 🌸📚</b><br/><br />
  RSS Feeds · Reading Lists · Your Notes — all in one place<br /><br />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/WIP-🚧-yellow" />
  <img src="https://img.shields.io/badge/Obsidian-Plugin-7f6df2" />
  <a href="https://github.com/scriptnull/rho-reader/actions/workflows/test.yml"><img src="https://github.com/scriptnull/rho-reader/actions/workflows/test.yml/badge.svg?branch=main" /></a>
</p>

<br />

**Rho** was derived from *Rhododendron* after I discovered the existence of these beautiful flowers in a bedtime story.

## 🚀 Features

- Built on top of [Obsidian Bases](https://help.obsidian.md/bases).
- Supports RSS / Atom feeds.
- Track your read / unread posts.
- (more to come...)

## 💡 How to Use

### Browse feeds

Browsing the RSS/Atom feeds that you follow is just browsing an Obsidian Base managed by Rho.

<img width="1440" height="1080" alt="image" src="https://github.com/user-attachments/assets/73504ced-f7fd-45a6-a3e6-5b8214a7bde2" />

### View Unread feeds

This is as simple as switching to "Unread" view of the Obsidian Base managed by Rho.

<img width="1146" height="1080" alt="image" src="https://github.com/user-attachments/assets/dd6d3a00-15f7-45be-8b05-b2aa443a2921" />

### Add RSS feeds

Adding RSS feed is just adding a `feed_url` property to any Obsidian note in your vault.

<img width="1440" height="1080" alt="image" src="https://github.com/user-attachments/assets/ae51e964-a9fc-4d62-95d3-872ef3f46c02" />

### Mark as Unread

By default, when you click on a post to read it, Rho will mark it as read. If you wish to mark it as unread, you can do it via right-click.

<img width="1440" height="1080" alt="image" src="https://github.com/user-attachments/assets/1e49e4c2-7636-413e-b929-7cf61ed246e9" />

## 🛠️ Installation

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

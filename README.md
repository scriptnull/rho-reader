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
</p>

<br />

**Rho** was derived from *Rhododendron* after I discovered the existence of these beautiful flowers in a bedtime story.

## 🚀 Features

- Built on top of [Obsidian Bases](https://help.obsidian.md/bases).
- Supports RSS / Atom feeds.
- Track your read / unread posts.
- (more to come...)

## 💡 How to Use

### Add RSS feed

Add the RSS link as the `feed_url` property on any page. You can now start seeing their posts in the RSS pane on the right.

<img width="1505" height="492" alt="image" src="https://github.com/user-attachments/assets/548f3563-e56e-4b68-93cf-144e3596c603" />

### Mark as read/unread

Clicking on a post will open the post in your web browser (yep, that is the best place to read a blog).

If you want to mark it as "Unread", you can do so by right-clicking on the post.

<img width="660" height="491" alt="image" src="https://github.com/user-attachments/assets/331e7546-cc3f-450a-a31f-40c450069202" />

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

Restart Obsidian and enable the plugin in **Settings → Community plugins**.

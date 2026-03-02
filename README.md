# Leek Wars

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/46d001bcd2944ad5b6ba45d772e6099f)](https://www.codacy.com/gh/leek-wars/leek-wars/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=leek-wars/leek-wars&amp;utm_campaign=Badge_Grade)
[![CI](https://github.com/leek-wars/leek-wars/actions/workflows/build.yml/badge.svg)](https://github.com/leek-wars/leek-wars/actions/workflows/build.yml)

The Leek Wars website frontend, in Vue 3 + TypeScript. This is the frontend repository, although it also contains all the information about the whole Leek Wars project.

Related projects: [LeekScript](https://github.com/leek-wars/leekscript) and [Leek Wars fight generator](https://github.com/leek-wars/leek-wars-generator).

![Banner](https://raw.githubusercontent.com/leek-wars/leek-wars/refs/heads/master/banner.jpg)

## Deployment

The project is very easy to install and deploy in 10s:
```shell
git clone https://github.com/leek-wars/leek-wars.git
cd leek-wars
npm i
npm start
```
Then go to `localhost:8080` in your browser.

*Be careful*, this project is only the front end of Leek Wars, so it's connected to the
production server. When you log into this local version, you will use your real account!

## Architecture
![Banner](https://github.com/leek-wars/leek-wars-meta/blob/master/doc/architecture.svg)
- Client : this repository
- Generator : https://github.com/leek-wars/leek-wars-generator
- LeekScript : https://github.com/leek-wars/leekscript

## Contributing
I gladly accept pull requests to Leek Wars. Before starting work on a feature, see the [contribution guidelines](https://github.com/leek-wars/leek-wars/blob/master/CONTRIBUTING.md).

## Libraries used

- Vue 3 https://github.com/vuejs/core
- Vuetify https://github.com/vuetifyjs/vuetify
- Vuex https://github.com/vuejs/vuex
- Pinia https://github.com/vuejs/pinia
- Vite https://github.com/vitejs/vite
- Monaco Editor https://github.com/microsoft/monaco-editor
- CodeMirror https://github.com/codemirror/codemirror
- Chart.js https://github.com/chartjs/Chart.js
- Katex https://github.com/Khan/KaTeX
- Flags https://github.com/hampusborgos/country-flags

## Social media
- X (Twitter) : https://twitter.com/LeekWars
- Facebook : https://www.facebook.com/LeekWars/
- GitHub (this repo) : https://github.com/leek-wars/leek-wars

## License

Distributed under the GPL3 license. Copyright (c) 2016-2026, Pilow

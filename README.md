# Leek Wars

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/5e418e53905e486c95a57df49c047cee)](https://app.codacy.com/app/5pilow/leek-wars-client?utm_source=github.com&utm_medium=referral&utm_content=leek-wars/leek-wars-client&utm_campaign=Badge_Grade_Dashboard)

The Leek Wars website frontend, in Vue.js + TypeScript. This is the frontend repository, altough it also contains all the information about the whole Leek Wars projet.

Related projects: [LeekScript](https://github.com/leek-wars/leekscript) and [Leek Wars fight generator](https://github.com/leek-wars/leek-wars-generator).

![Banner](https://github.com/leek-wars/leek-wars-client/blob/master/banner.jpg)

## Deployment

The project is very easy to install and deploy in 10s:
```shell
git clone https://github.com/leek-wars/leek-wars.git
cd leek-wars
git submodule update --init --recursive
npm i
npm start
```
Then go to `localhost:8080` in your browser.

*Be careful*, this project is only the front end of Leek Wars, so it's connected to the
production server. When you log into this local version, you will use your real account!

## Architecture
![Banner](https://github.com/leek-wars/leek-wars-meta/blob/master/doc/architecture.svg)
- Client : this repository
- Generator : https://github.com/leek-wars/leek-wars-generator-v1
- LeekScript : https://github.com/leek-wars/leekscript-v1

## Hacking
I gladly accept pull requests to Leek Wars. Before starting work on a feature, see the [contribution guidelines](https://github.com/leek-wars/leek-wars-client/blob/master/CONTRIBUTING.md).

## Libraries used

- Vue.js https://github.com/vuejs/vue
- Vuex https://github.com/vuejs/vuex
- CodeMirror https://github.com/codemirror/codemirror
- Chartist https://github.com/gionkunz/chartist-js
- Katex https://github.com/Khan/KaTeX

## Social media
- Twitter : https://twitter.com/LeekWars
- Facebook : https://www.facebook.com/LeekWars/
- GitHub (this repo) : https://github.com/leek-wars/leek-wars
- Wiki : http://leekwarswiki.net

## License

Distributed under the GPL3 license. Copyright (c) 2016-2020, Pierre Lauprêtre

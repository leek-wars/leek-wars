# Leek Wars client

The Leek Wars website frontend, in HTML, CSS, JavaScript.

Related projects: [LeekScript](https://github.com/leek-wars/leekscript) and [Leek Wars fight generator](https://github.com/leek-wars/leek-wars-generator).

![Banner](https://github.com/leek-wars/leek-wars-client/blob/master/banner.jpg)

## Deployment
Prerequisites: **Python 3**

The project is very easy to install and deploy in 10s:
```shell
git clone https://github.com/leek-wars/leek-wars-client.git
cd leek-wars-client
npm i
make # or python3 leekwars.py
```
Then go to `localhost:8012` in your browser (you can change the port in the python script).

*Be careful*, this project is only the front end of Leek Wars, so it's connected to the
production server. When you log into this local version, you will use your real account!

## Structure
- http/			: All served files
	* image/ 		: All images, icons, textures
	* lang/ 		: Translations files : en/ and fr/
	* script/		: JavaScript files
		- game/			: JS for the fight rendering
	* sound/		: Sounds files
	* style/		: CSS files
	* third_party/	: Some third party libraries (JS and CSS)
	* view/			: HTML template files
- Dockerfile	: A Dockerfile if you need to build a Docker image
- Makefile		: Makefile to perform some quick actions like `make serve`
- leekwars.py	: Python script to serve the site locally

## Hacking
I gladly accept pull requests to Leek Wars. Before starting work on a feature, see the [contribution guidelines](https://github.com/leek-wars/leek-wars-client/blob/master/CONTRIBUTING.md).

## Libraries used

- CodeMirror https://github.com/codemirror/codemirror
- Page.js https://github.com/visionmedia/page.js
- jQuery https://github.com/jquery/jquery
- Chartist https://github.com/gionkunz/chartist-js
- Twemoji https://github.com/twitter/twemoji

## License

Distributed under the GPL3 license. Copyright (c) 2016-2018, Pierre Lauprêtre

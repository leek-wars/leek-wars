CLOC_EXCLUDED := .git,http/third_party,http/image,http/lang,http/sound

LIB_FILES := http/third_party/jquery.min.js \
			 http/third_party/page.js \
			 http/third_party/mousewheel.js \
			 http/third_party/codemirror/codemirror.js \
			 http/third_party/codemirror/matchbrackets.js \
			 http/third_party/codemirror/match-highlighter.js \
			 http/third_party/jsbeautifier/beautify.js \
			 http/third_party/mousewheel.js \
			 http/third_party/twemoji/twemoji.js \
			 http/third_party/chartist/chartist.min.js \
			 http/third_party/katex/katex.min.js

JS_FILES := http/script/main.js \
			http/third_party/codemirror/leekscript.js \
			http/third_party/codemirror/runmode.js \
			http/script/*.js \
			http/script/game/entity.js \
			http/script/game/map/*.js \
			http/script/game/*.js

CSS_FILES := http/third_party/codemirror/codemirror.css \
			 http/third_party/chartist/chartist.css \
			 http/third_party/katex/katex.min.css \
			 http/style/*.css


bundle: http/bundle.min.js http/libs.min.js http/leekwars.min.css
	cat http/libs.min.js http/bundle.min.js > http/leekwars.min.js

serve: bundle
	python3 leekwars.py

http/bundle.min.js: $(JS_FILES)
	uglifyjs $(JS_FILES) -o http/bundle.min.js -c -m --source-map root="http://leekwars.com/",url=bundle.min.js.map

http/libs.min.js: $(LIB_FILES)
	uglifyjs $(LIB_FILES) -o http/libs.min.js -c -m

http/leekwars.min.css: $(CSS_FILES)
	cat $(CSS_FILES) | csso -o bundle -o http/leekwars.min.css --stat

clean:
	rm -f http/bundle.min.js
	rm -f http/bundle.min.js.map
	rm -f http/libs.min.js
	rm -f http/leekwars.min.js
	rm -f http/leekwars.min.css

# Line couning with cloc.
# `apt-get install cloc`
cloc:
	cloc . --exclude-dir=$(CLOC_EXCLUDED)
cloc-xml:
	cloc --quiet --xml . --exclude-dir=$(CLOC_EXCLUDED)

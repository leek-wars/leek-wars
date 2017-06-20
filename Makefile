CLOC_EXCLUDED := .git,src/third_party,http/image,http/lang,http/sound

LIB_FILES := src/third_party/jquery.min.js \
			 src/third_party/page.js \
			 src/third_party/mousewheel.js \
			 src/third_party/codemirror/codemirror.js \
			 src/third_party/codemirror/matchbrackets.js \
			 src/third_party/codemirror/match-highlighter.js \
			 src/third_party/jsbeautifier/beautify.js \
			 src/third_party/mousewheel.js \
			 src/third_party/twemoji/twemoji.js \
			 src/third_party/chartist/chartist.min.js \
			 src/third_party/katex/katex.min.js

JS_FILES := src/script/main.js \
			src/third_party/codemirror/leekscript.js \
			src/third_party/codemirror/runmode.js \
			src/script/*.js \
			src/script/game/entity.js \
			src/script/game/map/*.js \
			src/script/game/*.js

CSS_FILES := src/third_party/codemirror/codemirror.css \
			 src/third_party/chartist/chartist.css \
			 src/third_party/katex/katex.min.css \
			 src/style/*.css

all: http/leekwars.min.js http/leekwars.min.css

http/leekwars.min.js: http/bundle.min.js http/libs.min.js
	@echo "Merge JavaScript bundles..."
	@echo "==========================="
	cat http/libs.min.js http/bundle.min.js > http/leekwars.min.js

serve: bundle
	python3 leekwars.py

http/bundle.min.js: $(JS_FILES)
	@echo "Minify JavaScript..."
	@echo "===================="
	uglifyjs $(JS_FILES) -o http/bundle.min.js -c -m --source-map root="http://leekwars.com/",url=bundle.min.js.map

http/libs.min.js: $(LIB_FILES)
	@echo "Minify JavaScript libraries..."
	@echo "=============================="
	uglifyjs $(LIB_FILES) -o http/libs.min.js -c -m

http/leekwars.min.css: $(CSS_FILES)
	@echo "Minify CSS..."
	@echo "============="
	cat $(CSS_FILES) | csso -o bundle -o http/leekwars.min.css --stat

clean:
	@echo "Clean project..."
	@echo "================"
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

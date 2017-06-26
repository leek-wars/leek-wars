CLOC_EXCLUDED := .git,src/third_party,http/image,http/lang,http/sound

JS_LIB_FILES := src/third_party/jquery.js \
			src/third_party/page.js \
			src/third_party/mousewheel.js \
			src/third_party/codemirror/codemirror.js \
			src/third_party/codemirror/matchbrackets.js \
			src/third_party/codemirror/match-highlighter.js \
			src/third_party/jsbeautifier/beautify.js \
			src/third_party/mousewheel.js \
			src/third_party/twemoji/twemoji.js \
			src/third_party/chartist/chartist.js \
			src/third_party/katex/katex.min.js
JS_FILES :=	src/script/main.js \
			src/third_party/codemirror/leekscript.js \
			src/third_party/codemirror/runmode.js \
			$(wildcard src/script/*.js) \
			src/script/game/entity.js \
			$(wildcard src/script/game/map/*.js) \
			$(wildcard src/script/game/*.js)

JS_LIB_SRC_FILES :=  $(subst src/third_party/,,$(JS_LIB_FILES))

CSS_FILES := src/third_party/codemirror/codemirror.css \
			 src/third_party/chartist/chartist.css \
			 src/third_party/katex/katex.min.css \
			 $(wildcard src/style/*.css)

CSS_SRC_FILES :=  $(subst src/,,$(CSS_FILES))

JS_LIB_MIN := $(patsubst %.js,build/third_party/%.min.js, $(JS_LIB_SRC_FILES))
CSS_MIN := $(patsubst %.css,build/%.min.css, $(CSS_SRC_FILES))

all: http/leekwars.min.js http/leekwars.min.css

http/leekwars.min.js: build/leekwars.min.js
	@cp build/leekwars.min.js http/leekwars.min.js

http/leekwars.min.css: build/leekwars.min.css
	@cp build/leekwars.min.css http/leekwars.min.css

build/leekwars.min.js: $(JS_LIB_MIN) build/sources.min.js
	cat $(JS_LIB_MIN) build/sources.min.js > build/leekwars.min.js

build/leekwars.min.css: $(CSS_MIN)
	cat $(CSS_MIN) > build/leekwars.min.css

build/sources.min.js: $(JS_FILES)
	uglifyjs $(JS_FILES) -o $@ -c -m --source-map root="http://leekwars.com/",url=$@.map

build/third_party/%.min.js: src/third_party/%.js
	@mkdir -p $(@D)
	uglifyjs $? -o $@ -c -m

build/%.min.css: src/%.css
	@mkdir -p $(@D)
	csso $? -o $@

test:
	uglifyjs $(JS_FILES) -o all.min.js -c -m


serve: all
	python3 leekwars.py

clean:
	@echo "Clean project..."
	@echo "================"
	rm -rf build

# Line couning with cloc.
# `apt-get install cloc`
cloc:
	cloc . --exclude-dir=$(CLOC_EXCLUDED)
cloc-xml:
	cloc --quiet --xml . --exclude-dir=$(CLOC_EXCLUDED)

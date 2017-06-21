CLOC_EXCLUDED := .git,src/third_party,http/image,http/lang,http/sound

JS_FILES := src/third_party/jquery.js \
			src/third_party/page.js \
			src/third_party/mousewheel.js \
			src/third_party/codemirror/codemirror.js \
			src/third_party/codemirror/matchbrackets.js \
			src/third_party/codemirror/match-highlighter.js \
			src/third_party/jsbeautifier/beautify.js \
			src/third_party/mousewheel.js \
			src/third_party/twemoji/twemoji.js \
			src/third_party/chartist/chartist.min.js \
			src/third_party/katex/katex.min.js \
			src/script/main.js \
			src/third_party/codemirror/leekscript.js \
			src/third_party/codemirror/runmode.js \
			$(wildcard src/script/*.js) \
			src/script/game/entity.js \
			$(wildcard src/script/game/map/*.js) \
			$(wildcard src/script/game/*.js)

JS_SRC_FILES :=  $(subst src/,,$(JS_FILES))

CSS_FILES := src/third_party/codemirror/codemirror.css \
			 src/third_party/chartist/chartist.css \
			 src/third_party/katex/katex.min.css \
			 $(wildcard src/style/*.css)

JS_MIN := $(patsubst %.js,build/%.min.js, $(JS_SRC_FILES))

all: build_dir build/leekwars.min.js build/leekwars.min.css

build/leekwars.min.js: $(JS_MIN)
	cat $(JS_MIN) > build/leekwars.min.js

#
# http/libs.min.js: $(LIB_FILES)
# 	@echo "Minify JavaScript libraries..."
# 	@echo "=============================="
# 	uglifyjs $(LIB_FILES) -o http/libs.min.js -c -m

build/%.min.js: src/%.js
	@mkdir -p $(@D)
	uglifyjs $? -o $@ -c -m --source-map root="http://leekwars.com/",url=$<.map

test:
	uglifyjs $(JS_FILES) -o all.min.js -c -m

http/leekwars.min.css: $(CSS_FILES)
	@echo "Minify CSS..."
	@echo "============="
	cat $(CSS_FILES) | csso -o bundle -o http/leekwars.min.css --stat

build_dir:
	@mkdir -p build/third_party
	@mkdir -p build/script
	@mkdir -p build/style

serve: bundle
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

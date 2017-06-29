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

CSS_LIB_FILES := src/third_party/codemirror/codemirror.css \
			 src/third_party/chartist/chartist.css \
			 src/third_party/katex/katex.min.css
CSS_FILES := $(wildcard src/style/*.css)

CSS_LIB_SRC_FILES :=  $(subst src/,,$(CSS_LIB_FILES))
CSS_SRC_FILES :=  $(subst src/,,$(CSS_FILES))

JS_LIB_MIN := $(patsubst %.js,build/third_party/%.min.js, $(JS_LIB_SRC_FILES))
CSS_MIN := $(patsubst %.css,build/%.min.css, $(CSS_SRC_FILES))
CSS_LIB_MIN := $(patsubst %.css,build/%.min.css, $(CSS_LIB_SRC_FILES))

MAKEFLAGS += --jobs=2

all: http/libs.min.js http/leekwars.min.js http/libs.min.css http/leekwars.min.css

http/libs.min.js: build/libs.min.js
	@cp build/libs.min.js http/libs.min.js

http/leekwars.min.js: build/leekwars.min.js
	@cp build/leekwars.min.js http/leekwars.min.js

http/libs.min.css: build/libs.min.css
	@cp build/libs.min.css http/libs.min.css

http/leekwars.min.css: build/leekwars.min.css
	@cp build/leekwars.min.css http/leekwars.min.css

build/libs.min.js: $(JS_LIB_MIN)
	cat $(JS_LIB_MIN) > build/libs.min.js

build/leekwars.min.js: $(JS_FILES)
	uglifyjs $(JS_FILES) -o $@ -c -m --source-map root="http://leekwars.com/",url=$@.map

build/libs.min.css: $(CSS_LIB_MIN)
	cat $(CSS_LIB_MIN) > build/libs.min.css

build/leekwars.min.css: $(CSS_MIN)
	cat $(CSS_MIN) > build/leekwars.min.css

build/third_party/%.min.js: src/third_party/%.js
	@mkdir -p $(@D)
	uglifyjs $? -o $@ -c -m

build/%.min.css: src/%.css
	@mkdir -p $(@D)
	csso $? -o $@

test:
	uglifyjs $(JS_FILES) -o all.min.js -c -m

watch:
	@echo "Start watchers..."
	@echo "================="
	@+inotifywait -mqr src -e create -e moved_to -e close_write | \
	while read path action file; do \
		echo "File [\033[1;34m$$path$$file\033[0m] modified, generate..."; \
		make > /dev/null & \
	done

server: all
	@+fuser -k 8012/tcp > /dev/null; python3 leekwars.py

serve: watch server

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

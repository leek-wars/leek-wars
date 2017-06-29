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
			$(subst src/script/main.js,,$(wildcard src/script/*.js)) \
			src/script/game/entity.js \
			$(wildcard src/script/game/map/*.js) \
			$(subst src/script/game/entity.js,,$(wildcard src/script/game/*.js))

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

quick: http/libs.min.js http/leekwars-quick.min.js http/libs.min.css http/leekwars-quick.min.css

http/libs.min.js: $(JS_LIB_MIN)
	cat $(JS_LIB_MIN) > $@

http/leekwars.min.js: $(JS_FILES)
	uglifyjs $(JS_FILES) -o $@ -c -m --source-map root="http://leekwars.com/",url=$@.map

http/leekwars-quick.min.js: $(JS_FILES)
	awk 1 $(JS_FILES) > $@

http/libs.min.css: $(CSS_LIB_MIN)
	cat $(CSS_LIB_MIN) > $@

http/leekwars.min.css: $(CSS_FILES)
	cat $(CSS_FILES) | csso -o $@

http/leekwars-quick.min.css: $(CSS_FILES)
	cat $(CSS_FILES) > $@

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
		echo -n "File [\033[1;34m$$path$$file\033[0m] modified, generate... "; \
		make quick > /dev/null && echo "done!" & \
	done

server: quick
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

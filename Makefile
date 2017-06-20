CLOC_EXCLUDED := .git,http/third_party,http/image,http/lang,http/sound

LIB_FILES := http/third_party/page.js http/third_party/mousewheel.js http/third_party/codemirror/codemirror.js

JS_FILES := http/script/main.js http/third_party/codemirror/leekscript.js http/third_party/codemirror/runmode.js http/script/*.js
CSS_FILES := http/third_party/codemirror/codemirror.css http/style/*.css

serve: bundle
	python3 leekwars.py

bundle: http/bundle.min.js http/libs.min.js http/bundle.min.css

http/bundle.min.js: $(JS_FILES)
	uglifyjs $(JS_FILES) -o http/bundle.min.js -c -m --source-map root="http://leekwars.com/",url=bundle.min.js.map

http/libs.min.js: $(LIB_FILES)
	uglifyjs $(LIB_FILES) -o http/libs.min.js -c -m

http/bundle.min.css: $(CSS_FILES)
	cat $(CSS_FILES) | csso -o bundle -o http/bundle.min.css --stat

clean:
	rm -f http/bundle.min.js
	rm -f http/bundle.min.js.map
	rm -f http/libs.min.js
	rm -f http/bundle.min.css

# Line couning with cloc.
# `apt-get install cloc`
cloc:
	cloc . --exclude-dir=$(CLOC_EXCLUDED)
cloc-xml:
	cloc --quiet --xml . --exclude-dir=$(CLOC_EXCLUDED)

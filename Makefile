CLOC_EXCLUDED := .git,http/third_party,http/image,http/lang,http/sound

serve: bundle
	python3 leekwars.py

bundle: http/bundle.min.js

http/bundle.min.js: http/script/*.js
	uglifyjs http/script/main.js http/script/*.js -o http/bundle.min.js -c -m --source-map root="http://leekwars.com/",url=bundle.min.js.map

clean:
	rm http/bundle.min.js
	rm http/bundle.min.js.map

# Line couning with cloc.
# `apt-get install cloc`
cloc:
	cloc . --exclude-dir=$(CLOC_EXCLUDED)
cloc-xml:
	cloc --quiet --xml . --exclude-dir=$(CLOC_EXCLUDED)

CLOC_EXCLUDED := .git,http/third_party,http/image,http/lang,http/sound

serve:
	python3 leekwars.py

# Line couning with cloc.
# `apt-get install cloc`
cloc:
	cloc . --exclude-dir=$(CLOC_EXCLUDED)
cloc-xml:
	cloc --quiet --xml . --exclude-dir=$(CLOC_EXCLUDED)

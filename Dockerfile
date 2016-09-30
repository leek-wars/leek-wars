# Basic docker image for leek-wars-client
#
# Usage:
#   docker build -t leek-wars-client .
#   docker run --rm -p 8012:8012 -P leek-wars-client
#
#   or
#
#   docker build -t leek-wars-client .
#   docker run --rm -p 8012:8012 -v /path/to/local/app/folder:/app -it -P leek-wars-client /bin/sh

FROM alpine:3.4
MAINTAINER Leek Wars <https://github.com/leek-wars>

# Default port the webserver runs on
EXPOSE 8012

# Working directory for the application
WORKDIR /app/

# Install required packages
RUN apk add --no-cache python3

# Copy everything to the working directory
ADD leekwars.py leekwars.py
ADD http/ http/

# Run the application
ENTRYPOINT ["python3", "leekwars.py"]

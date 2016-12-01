# Python 3 script

from http.server import SimpleHTTPRequestHandler, HTTPServer
import socketserver
import os, re, time, webbrowser

PORT = 8012

os.chdir('http')

class LWHandler(SimpleHTTPRequestHandler):
	def do_GET(self):
		if self.path != '/' and os.access('.' + os.sep + self.path, os.R_OK):
			super().do_GET();
		else:
			bindings = {
				'static': 'http://localhost:' + str(PORT) + '/',
				'time': str(int(time.time())),
				'api': 'https://leekwars.com/api/',
				'local': 'false',
				'version': '1212',
				'sub_version': '100'
			}
			body = open("view" + os.sep + "head.html").read()
			body = re.sub(r"\{\{(.*)\}\}", lambda m: bindings[m.group(1)], body)

			self.send_response(200)
			self.send_header('Content-Type', "text/html; charset=utf-8")
			self.send_header("Content-Length", str(len(body)))
			self.end_headers()
			self.wfile.write(body.encode("utf-8"))
			self.wfile.flush()

class LWTCPServer(socketserver.TCPServer):
	allow_reuse_address = True
server = LWTCPServer(("", PORT), LWHandler)
print("Serving Leek Wars at port", PORT)
webbrowser.open('http://localhost:' + str(PORT))
server.serve_forever()

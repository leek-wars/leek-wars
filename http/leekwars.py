import SimpleHTTPServer, SocketServer
import urlparse, os, re, time

PORT = 8000

class Handler(SimpleHTTPServer.SimpleHTTPRequestHandler):
	def do_GET(self):
	
		if os.access('.' + self.path, os.R_OK):
			SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self);
		else:
		
			bindings = {
				'static': 'http://localhost:' + str(PORT) + '/',
				'time': str(int(time.time()))
			}
	
			body = open("view/head.html").read()
			body = re.sub(r"\{\{(.*)\}\}", lambda m: bindings[m.group(1)], body)
			
			self.send_response(200)
			self.send_header('Content-Type', "text/html; charset=utf-8")
			self.send_header("Content-Length", str(len(body)))
			self.end_headers()
			self.wfile.write(body.encode("utf-8"))
        	self.wfile.flush()

httpd = SocketServer.TCPServer(("", PORT), LWHandler)
print "Serving Leek Wars at port", PORT
httpd.serve_forever()

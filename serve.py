"""serve.py."""
import http.server
import socketserver
import os
from urllib.parse import unquote

PORT = 8000
GRAD_PATH = "/graduate-program"

class SPARequestHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Only serve under /graduate-program/
        path = unquote(path)
        if path.startswith(GRAD_PATH + "/"):
            rel_path = path[len(GRAD_PATH) + 1 :]
            return os.path.join(os.getcwd(), rel_path)
        # Fallback: serve index.html for /graduate-program or unknown
        return os.path.join(os.getcwd(), "index.html")

    def do_GET(self):
        if self.path == GRAD_PATH or self.path == GRAD_PATH + "/":
            self.path = GRAD_PATH + "/index.html"
        file_path = self.translate_path(self.path)
        # Serve file if it exists
        if os.path.isfile(file_path):
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        # If not a file, and is an asset request, return 404
        if any(self.path.endswith(ext) for ext in [".js", ".css", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".json", ".map", ".woff", ".woff2", ".ttf", ".eot"]):
            self.send_error(404, "File not found")
            return
        # Otherwise, serve index.html (SPA fallback)
        self.path = GRAD_PATH + "/index.html"
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

with socketserver.TCPServer(("", PORT), SPARequestHandler) as httpd:
    print(f"Serving graduate-program at http://localhost:{PORT}/graduate-program/")
    httpd.serve_forever()
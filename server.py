import http.server
import socketserver
import webbrowser
import os
import sys

# Ensure working directory is project root
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class DevHandler(http.server.SimpleHTTPRequestHandler):
    # Disable caching during development so changes are instantly reflected
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def run_server():
    ports_to_try = [5500, 8000, 8080, 3000]
    httpd = None
    selected_port = None

    for port in ports_to_try:
        try:
            httpd = socketserver.TCPServer(('127.0.0.1', port), DevHandler)
            selected_port = port
            break
        except OSError:
            continue

    if not httpd:
        print("[ERROR] Could not bind to any dev port (5500, 8000, 8080, 3000).")
        input("Press Enter to exit...")
        sys.exit(1)

    url = f"http://127.0.0.1:{selected_port}"
    print("=" * 60)
    print(f"  Fatama Fighting Dragons - Local Dev Server")
    print("=" * 60)
    print(f"\n  Running at:  {url}")
    print(f"  Opening browser automatically...")
    print(f"\n  [Press Ctrl+C in this window to stop the server]\n")

    # Open browser after server is confirmed listening
    webbrowser.open(url)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        httpd.server_close()

if __name__ == '__main__':
    run_server()

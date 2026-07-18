import sys
import json
import threading
import os
import logging
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

# Set up logging dynamically based on execution mode
if getattr(sys, 'frozen', False):
    app_path = os.path.dirname(sys.executable)
else:
    app_path = os.path.dirname(os.path.abspath(__file__))

log_file = os.path.join(app_path, 'backend.log')
logging.basicConfig(
    filename=log_file,
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logging.info("Python Backend Starting (HTTP Mode)...")

try:
    from ytmusicapi import YTMusic
    import yt_dlp
    ytmusic = YTMusic()
    logging.info("Backend libraries initialized")
except Exception as e:
    logging.error(f"Library Init Error: {e}")
    sys.exit(1)

class MusicAPIHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed_path = urlparse(self.path)
        endpoint = parsed_path.path
        query = parse_qs(parsed_path.query)

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        response_data = {"error": "Invalid endpoint"}

        try:
            if endpoint == '/home':
                logging.info("Fetching home data...")
                try:
                    home_data = ytmusic.get_home(limit=5)
                    songs, albums = [], []
                    for row in home_data:
                        t = row.get('title', '').lower()
                        items = row.get('contents', [])
                        if any(x in t for x in ['song', 'track', 'trending', 'hit', 'vibe', 'mix']):
                            songs.extend(items)
                        elif any(x in t for x in ['album', 'release', 'artist', 'new']):
                            albums.extend(items)
                    
                    if not songs: 
                        logging.info("Home songs dry, fallback to trending search")
                        songs = ytmusic.search("Trending Songs", filter="songs")[:10]
                    if not albums:
                        albums = ytmusic.search("New Albums", filter="albums")[:10]
                    
                    response_data = {"songs": {"items": songs}, "albums": {"items": albums}}
                except Exception as e:
                    logging.error(f"Home failed: {e}")
                    response_data = {"songs": {"items": ytmusic.search("Top Hits", filter="songs")}, "albums": {"items": []}}
            
            elif endpoint == '/search':
                q = query.get('q', [''])[0]
                logging.info(f"Multi-category search for: {q}")
                try:
                    # Attempt focused searches for better depth
                    songs = ytmusic.search(q, filter="songs")[:10]
                    albums = ytmusic.search(q, filter="albums")[:10]
                    artists = ytmusic.search(q, filter="artists")[:10]
                    playlists = ytmusic.search(q, filter="playlists")[:10]
                    
                    # If focused searches are dry, try a general search and categorize
                    if not any([songs, albums, artists, playlists]):
                        results = ytmusic.search(q)
                        for r in results:
                            t = r.get('resultType')
                            if t == 'song' and len(songs) < 10: songs.append(r)
                            elif t == 'album' and len(albums) < 10: albums.append(r)
                            elif t == 'artist' and len(artists) < 10: artists.append(r)
                            elif t == 'playlist' and len(playlists) < 10: playlists.append(r)

                    response_data = {
                        "songs": songs,
                        "albums": albums,
                        "artists": artists,
                        "playlists": playlists
                    }
                except Exception as e:
                    logging.error(f"Search failed: {e}")
                    response_data = {"songs": [], "albums": [], "artists": [], "playlists": []}
            
            elif endpoint == '/track':
                v_id = query.get('id', [''])[0]
                ydl_opts = {'format': 'bestaudio/best', 'quiet': True, 'nocheckcertificate': True}
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(f"https://www.youtube.com/watch?v={v_id}", download=False)
                    response_data = {
                        "videoId": v_id,
                        "url": info.get('url'),
                        "title": info.get('title'),
                        "artist": info.get('uploader'),
                        "duration": info.get('duration'),
                        "thumbnails": info.get('thumbnails')
                    }
            
            elif endpoint == '/album':
                a_id = query.get('id', [''])[0]
                response_data = ytmusic.get_album(a_id)

            elif endpoint == '/artist':
                c_id = query.get('id', [''])[0]
                response_data = ytmusic.get_artist(c_id)

            elif endpoint == '/playlist':
                p_id = query.get('id', [''])[0]
                response_data = ytmusic.get_playlist(p_id)

            elif endpoint == '/related':
                v_id = query.get('id', [''])[0]
                # get_watch_playlist returns related tracks (radio)
                results = ytmusic.get_watch_playlist(videoId=v_id, limit=20)
                # Extract tracks and ensure they have videoId
                tracks = results.get('tracks', [])
                response_data = {"tracks": tracks}

            elif endpoint == '/lyrics':
                import urllib.request
                import urllib.parse
                import re

                def clean_title(title, artist):
                    # Deep clean for better matching
                    t = title.lower()
                    a = artist.lower()
                    # Remove artist name if it's in the title
                    t = t.replace(a, '')
                    # Remove common noise
                    t = re.sub(r'\(.*?\)|\[.*?\]', '', t)
                    t = re.sub(r'official (video|audio|lyrics|music video)', '', t)
                    t = re.sub(r'feat\..*|ft\..*', '', t)
                    t = re.sub(r'lyrics|lyric video', '', t)
                    t = re.sub(r'[^a-z0-9\s]', '', t)
                    return t.strip()

                raw_artist = query.get('artist', [''])[0]
                raw_title = query.get('title', [''])[0]
                
                artist = raw_artist.strip()
                title = clean_title(raw_title, raw_artist)
                
                logging.info(f"Refined Lyrics Search: {artist} - {title}")
                
                # Attempt 1: LRCLIB Get (Strict)
                params = {'artist_name': artist, 'track_name': title}
                url = "https://lrclib.net/api/get?" + urllib.parse.urlencode(params)
                
                try:
                    with urllib.request.urlopen(url) as response:
                        response_data = json.loads(response.read().decode())
                except Exception:
                    # Attempt 2: LRCLIB Search (Fuzzy)
                    search_url = "https://lrclib.net/api/search?q=" + urllib.parse.quote(f"{artist} {title}")
                    try:
                        with urllib.request.urlopen(search_url) as response:
                            results = json.loads(response.read().decode())
                            if results:
                                # Prioritize results with synced lyrics
                                synced = [r for r in results if r.get('syncedLyrics')]
                                response_data = synced[0] if synced else results[0]
                            else:
                                response_data = {"error": "Not found"}
                    except Exception as e:
                        logging.error(f"Lyrics search failed: {e}")
                        response_data = {"error": "Not found"}

        except Exception as e:
            logging.error(f"API Error at {endpoint}: {e}")
            response_data = {"error": str(e)}

        self.wfile.write(json.dumps(response_data).encode())

    def log_message(self, format, *args):
        logging.info("%s - - [%s] %s" % (self.address_string(), self.log_date_time_string(), format%args))

def run_server(port=9999):
    server_address = ('127.0.0.1', port)
    httpd = HTTPServer(server_address, MusicAPIHandler)
    logging.info(f"Serving at http://127.0.0.1:{port}")
    httpd.serve_forever()

if __name__ == "__main__":
    port = 9876
    run_server(port)

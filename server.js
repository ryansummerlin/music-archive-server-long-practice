const http = require('http');
const fs = require('fs');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}


/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    // Get all the artists
    if (req.method === 'GET' && req.url === '/artists') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(artists));
      return res.end();
    }

    // Get a specific artist's details based on artistId
    if (req.method === 'GET' && req.url.startsWith('/artists/')) {
      let urlParts = req.url.split('/');
      let artistId = urlParts[2];
      if (urlParts.length === 3 && artists[artistId]) {
        const artistAlbums = Object.keys(albums)
          .filter(key => albums[key]['artistId'] == artistId)
          .map(key => albums[key]);
        let artistInfo = {...artists[artistId], albums: artistAlbums};
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(artistInfo));
        return res.end();
      }
    }

    // Add an artist
    if (req.method === 'POST' && req.url === '/artists') {
      const name = req.body["name"];
      const artistId = getNewArtistId();
      artists[artistId] = {artistId: artistId, name: name};
      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(artists[artistId]));
      return res.end();
    }

    // Edit a specific artist based on artistId
    if (req.method === 'PUT' && req.url.startsWith('/artists/')) {
      let urlParts = req.url.split('/');
      let artistId = urlParts[2];
      if (urlParts.length === 3 && artists[artistId]) {
        const newName = req.body['name'];
        artists[artistId]["name"] = newName;
        const timeStamp = new Date().toISOString();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({...artists[artistId], updatedAt: timeStamp}));
        return res.end();
      }
    }

    // Delete a specific artist based on artistId
    if (req.method === 'DELETE' && req.url.startsWith('/artists/')) {
      let urlParts = req.url.split('/');
      let artistId = urlParts[2];
      if (urlParts.length === 3 && artists[artistId]) {
        delete artists[artistId];
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({message: "Successfully deleted"}));
        return res.end();
      }
    }

    // Get all albums of a specific artist based on artistId
    if (req.method === 'GET' && req.url.startsWith('/artists/')) {
      const urlParts = req.url.split('/');
      const artistId = urlParts[2];
      if (urlParts.length === 4 && urlParts[3] === 'albums' && artists[artistId]) {
        const artistAlbums = Object.keys(albums)
          .filter(key => albums[key]['artistId'] == artistId)
          .map(key => albums[key]);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(artistAlbums));
        return res.end();
      }
    }

    // Get a specific album's details based on albumId
    if (req.method === 'GET' && req.url.startsWith('/albums')) {
      const urlParts = req.url.split('/');
      const albumId = urlParts[2];
      if (urlParts.length === 3 && albums[albumId]) {
        const artistId = albums[albumId]['artistId']
        const albumSongs = Object.keys(songs)
          .filter(key => songs[key]['albumId'] == albumId)
          .map(key => songs[key]);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({...albums[albumId], artist: artists[artistId], songs: albumSongs}));
        return res.end();
      }
    }

    // Add an album to a specific artist based on artistId
    if (req.method === 'POST' && req.url.startsWith('/artists/')) {
      const urlParts = req.url.split('/');
      const artistId = urlParts[2];
      if (urlParts.length === 4 && urlParts[3] === 'albums' && artists[artistId]) {
        const albumName = req.body['name'];
        const albumId = getNewAlbumId();
        albums[albumId] = {albumId: albumId, name: albumName, artistId: artistId};
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(albums[albumId]));
        return res.end();
      }
    }

    // Edit a specified album by albumId
    if (req.method === 'PUT' && req.url.startsWith('/albums')) {
      const urlParts = req.url.split('/');
      const albumId = urlParts[2];
      if (urlParts.length === 3 && albums[albumId]) {
        const newAlbumName = req.body['name'];
        albums[albumId]['name'] = newAlbumName;
        const timeStamp = new Date().toISOString();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({...albums[albumId], updatedAt: timeStamp}));
        return res.end();
      }
    }

    // Delete a specified album by albumId
    if (req.method === 'DELETE' && req.url.startsWith('/albums')) {
      const urlParts = req.url.split('/');
      const albumId = urlParts[2];
      if (urlParts.length === 3 && albums[albumId]) {
        delete albums[albumId];
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({message:"Successfully deleted"}));
        return res.end();
      }
    }

    // Get all songs of a specified artist based on artistId
    if (req.method === 'GET' && req.url.startsWith('/artists/')) {
      const urlParts = req.url.split('/');
      const artistId = urlParts[2];
      if (urlParts.length === 4 && urlParts[3] === 'songs' && artists[artistId]) {
        const artistAlbumIds = Object.keys(albums)
          .filter(key => albums[key]['artistId'] == artistId)
          .map(key => albums[key]['albumId']);

        const artistSongs = Object.keys(songs)
          .filter(key => artistAlbumIds.includes(songs[key]['albumId']))
          .map(key => songs[key]);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(artistSongs));
        return res.end();
      }
    }

    // Get all the songs of a specific album based on albumId
    if (req.method === 'GET' && req.url.startsWith('/albums/')) {
      const urlParts = req.url.split('/');
      const albumId = urlParts[2];
      if (urlParts.length === 4 && urlParts[3] === 'songs' && albums[albumId]) {
        const albumSongs = Object.keys(songs)
          .filter(key => songs[key]['albumId'] == albumId)
          .map(key => songs[key]);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(albumSongs));
        return res.end();
      }
    }

    // Get all songs of a specified trackNumber
    if (req.method === 'GET' && req.url.startsWith('/trackNumbers/')) {
      const urlParts = req.url.split('/');
      const trackNumber = urlParts[2];
      if (urlParts.length === 4 && urlParts[3] === 'songs') {
        const trackNumberSongs = Object.keys(songs)
          .filter(key => songs[key]['trackNumber'] == trackNumber)
          .map(key => songs[key]);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(trackNumberSongs));
        return res.end();
      }
    }

    // Get a specific song's details based on songId
    if (req.method === 'GET' && req.url.startsWith('/songs/')) {
      const urlParts = req.url.split('/');
      const songId = urlParts[2];
      if (urlParts.length === 3 && songs[songId]) {
        const album = songs[songId]['albumId'];
        const artistId = album['artistId'];
        const artist = artists[artistId];
        const song = {...songs[songId], album: album, artist: artist};
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(song));
        return res.end();
      }
    }

    // Add a song to a specific album based on albumId
    if (req.method === 'POST' && req.url.startsWith('/albums/')) {
      const urlParts = req.url.split('/');
      const albumId = urlParts[2];
      if (urlParts.length === 4 && urlParts[3] === 'songs' && albums[albumId]) {
        songId = getNewSongId();
        [songName, trackNumber, lyrics] = [req.body['name'], req.body['trackNumber'], req.body['lyrics']];
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({songId: songId, name: songName, trackNumber: trackNumber, albumId: albumId, lyrics: lyrics}));
        return res.end();
      }
    }

    // Edit a specified song by songId
    if (req.method === 'PUT' && req.url.startsWith('/songs/')) {
      const urlParts = req.url.split('/');
      const songId = urlParts[2];
      if (urlParts.length === 3 && songs[songId]) {
        [songName, trackNumber, lyrics] = [req.body['name'], req.body['trackNumber'], req.body['lyrics']];
        const albumId = songs[songId]['albumId'];
        const timeStamp = new Date().toISOString();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({name: songName, lyrics: lyrics, trackNumber: trackNumber, songId: songId, albumId: albumId, updatedAt: timeStamp}));
        return res.end();
      }
    }

    // Delete a specified song by songId
    if (req.method === 'DELETE' && req.url.startsWith('/songs/')) {
      const urlParts = req.url.split('/');
      const songId = urlParts[2];
      if (urlParts.length === 3 && songs[songId]) {
        delete songs[songId];
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({message: "Successfully deleted"}));
        return res.end();
      }
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = 5001;

server.listen(port, () => console.log('Server is listening on port', port));

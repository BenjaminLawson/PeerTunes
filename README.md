# PeerTunes
PeerTunes is a Peer-to-Peer social DJ'ing experience for the browser. Peers take turns playing songs and chat about them. Still very much in alpha!

![Alt text](screenshot.jpg?raw=true "Screenshot of Working Alpha Version")

### Development
 - Automatically build changes to src/main.js : `npm run-script watch`
 - Start local web server: `npm start`
 - Dev: npm run dev
### How
 - Users join bittorrent swarm where peers announce rooms
 - Users join swarm with gossipped room state
 - Host peer controls song playing, DJ queue
### Why
 - Hosting this type of real-time service with the client-server design is EXPENSIVE
 - Business model shown to be unprofitable time and time again
 - Websites keep popping up and shutting down, this will be permanent
### Features
 - $0 to host (static files => host on IPFS, gh-pages, bitbucket.io, electron app, etc.)
 - YouTube video support
 - YouTube search
 - Chat with full emoji support
 - Animated avatars
 - Rating system
 - Ability to play mp3 files
 - Bittorent tracker based peer discovery
 - Public room listing
 - Basic player info/controls
 - Basic persistent song queue organizer
### Planned
 - Security
 - Playlists
 - Soundcloud support
 - Friend system using RSA keys (exchange public keys, then have potential friend sign to confirm identity)
 - Profiles (ask peer for info about themself)
 - custom backgrounds set by host (upload to imgur)
 - custom avatars set by user (upload to imgur)
 - moderation controls (kick, ban, skip, max song length, max room size, etc.)
 - Advanced player controls (quality, refresh, hide video, etc.)
 - Export all data
 - import playlists (from export file, youtube playlist, soundcloud playlist, dubtrack.fm, plug.dj)
### Problems
 - Can't have persistant rooms
 - Can't store points (without trusting client)
 - Can't reserve usernames/accounts (but can still confirm identities with keys)
 - More open to abuse / security issues
 - Uses new technology (WebRTC, MediaSource) not supported by some browsers
### Alternatives (AKA why this project needs to exist)
 - ~~TurnTable.fm~~ ($7 - 7.5M seed funding) [Bankrupt]
  https://techcrunch.com/2013/11/22/turntable-fm-shutting-down-so-company-can-focus-on-turntable-live-events-platform/
  "Founder Billy Chasen said that the removal of the ability to upload music was able to save the company about $20k a month"
  
 - Dubtrack.fm [Alive, open-source, popular]
https://www.reddit.com/r/dubtrack/comments/4qqca0/can_dubtrack_devs_please_make_the_queue_menu/d4v2erw
 "...it's been costing pretty much $9,000 a month for the past few months"
 
 - Plug.dj ($1.25M seed funding) [Bankrupt, then bought out & resurrected, popular]
 - Soundtrack.io [open-source]
 - Jukebox.today
 - beatsense.com
- 4ever.tv
- totem.fm [front end open source]
- soundbounce.org [requires Spotify premium]
- jqbx.fm [requires Spotify premium]
 - https://github.com/aportner/opentt [Open source, not hosted]
 - https://github.com/calzoneman/sync [Open source, several hosted instances]
  - lifeboatradio.com [bare bones]
 - ~~musiqpad.com~~ [open-source, decentralized rooms] [discontinued]
 - ~~rolling.fm~~ [Offline]
 - ~~Qus~~ (mobile) [Shut down by streaming services]
https://www.facebook.com/notes/qus/closed-for-remodeling/702138243257896
"Incredible user response to our app drew the attention of some of the streaming services supported in Qus and, unfortunately, some of them have claimed that we are operating outside of their respective Terms of Use"

 - ~~BudtoBud~~ (desktop) [Shut down]
 - ~~Sounddrop.fm~~ [Killed by Spotify]
 - ~~Cred.fm~~ [Shut down]
 - ~~corp.beatrobo.com~~ ($1.7 million funding)[shut down]
 - ~~Mixify.com~~ [Shut down / merged]
 - ~~Grooveshark broadcast~~ [Shutdown due to lawsuit]
 - ~~juqster.com~~ [shut down]
 - ~~turn.fm~~ [Vaporware]
 - ~~spinit.fm~~ [Vaporware]
 - ~~blog.bonsai.fm~~ [Open source, cancelled]
 - ~~listeningroom.net~~ [Shut down]
 - ~~Outloud.fm~~ [Shut down]

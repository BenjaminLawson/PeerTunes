# PeerTunes
PeerTunes is a Peer-to-Peer social DJ'ing experience for the browser. Peers take turns playing songs and rate and chat about them. 
### Development
 - Automatically build changes to src/main.js : `npm run-script watch`
 - Start local web server: `npm start`
### How
 - Users join bittorrent swarm where peers announce rooms
 - Users subscribe to room updates from host peer
 - Host peer processes and relays messages among room peers
### Why
 - Hosting this type of real-time service with the client-server design is EXPENSIVE
 - Business model shown to be unprofitable time and time again
 - Websites keep popping up and shutting down, this will be perminant
### Features
 - $0 to host (static files => host on IPFS, gh-pages, dropbox, etc.)
 - YouTube video support
 - YouTube search
 - Chat with full emoji support
 - Animated avatars
 - Rating system
 - Ability to play mp3 files
 - Bittorent tracker based peer discovery
 - Persistent song queue
 - Public room listing
 - Basic player info/controls
 - Basic song queue organizer
### Planned
 - Persistant playlists
 - Playlists
 - Advanced media search/upload
 - Soundcloud support
 - Scuttlebutt/Grapevine model to support more users
 - Friend system using RSA keys (exchange public keys, then have potential friend sign to confirm identity)
 - Profiles (ask peer for info about themself)
 - custom backgrounds set by host (upload to imgur)
 - custom avatars set by user (upload to imgur)
 - moderation controls (kick, ban, skip, max song length, max room size, etc.)
 - Advanced player controls (quality, refresh, hide video, etc.)
### Problems
 - Can't have persistant rooms
 - Can't store points (without trusting client)
 - Can't reserve usernames/accounts (but can still confirm identities with keys)
 - Max peer connection limit (unknown, possible to overcome with Scuttlebutt)
 - Max amount of peers host can support (unknown)
 - More open to abuse / security issues
 - Uses new technology (WebRTC, MediaSource) not supported by some browsers (Chrome has everything, Firefox is missing MediaSource)
### Alternatives (AKA why this project needs to exist)
 - ~~TurnTable.fm~~ ($7 - 7.5M seed funding) [Bankrupt]
  https://techcrunch.com/2013/11/22/turntable-fm-shutting-down-so-company-can-focus-on-turntable-live-events-platform/
  "Founder Billy Chasen said that the removal of the ability to upload music was able to save the company about $20k a month"
  
 - Dubtrack.fm [Alive, open-source, popular]
https://www.reddit.com/r/dubtrack/comments/4qqca0/can_dubtrack_devs_please_make_the_queue_menu/d4v2erw
 "...it's been costing pretty much $9,000 a month for the past few months"
 
 - Plug.dj ($1.25M seed funding) [Bankrupt, then bought out & resurrected, popular]
 - Soundtrack.io [No users, open-source]
 - Jukebox.today
 - musiqpad.com [open-source, decentralized rooms, the next best thing!]
 - ~~rolling.fm~~ [Offline]
 - ~~Qus~~ (mobile) [Shut down by streaming services]
https://www.facebook.com/notes/qus/closed-for-remodeling/702138243257896
"Incredible user response to our app drew the attention of some of the streaming services supported in Qus and, unfortunately, some of them have claimed that we are operating outside of their respective Terms of Use"

 - ~~BudtoBud~~ (desktop) [Shut down]
 - ~~Sounddrop.fm~~ [Killed by Spotify]
 - ~~Cred.fm~~ [Shut down]
 - corp.beatrobo.com [Website shut down, now iOS only]($1.7 million funding)
 - ~~Mixify.com~~ [Shut down / merged]
 - beatsense.com
 - ~~Grooveshark broadcast~~ [Shutdown due to lawsuit]
 - juqster.com
 - lifeboatradio.com [bare bones]
 - 4ever.tv
 - ~~turn.fm~~ [Vaporware]
 - ~~spinit.fm~~ [Vaporware]
 - totem.fm [Broken & abandoned?, front end open source]
 - blog.bonsai.fm [Open source, abandoned?]
 - https://github.com/aportner/opentt [Open source, not hosted]
 - https://github.com/calzoneman/sync [Open source, several hosted instances]
 - ~~listeningroom.net~~ [Shut down]
 - ~~Outloud.fm~~ [Shut down]
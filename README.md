# PeerTunes
PeerTunes is a Peer-to-Peer social music experience for the browser.
### Development
 - Automatically build changes to src/main.js : `npm run-script watch`
 - Start local web server: `npm start`
### How
 - Users join bittorrent swarm where peers announce rooms
 - Users subscribe to room updates from host peer
 - Host peer processes and relays messages among room peers
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
### Planned
 - Persistant playlists
 - Playlists
 - Advanced media search/upload
 - Soundcloud support
 - Scuttlebutt/Grapevine model
 - Friend system using RSA keys
 - Profiles
 - custom backgrounds set by host
 - custom avatars
 - moderation controls (kick, ban, skip, etc.)
 - Advanced player controls
### Problems
 - Can't have persistant rooms
 - Can't store points (without trusting client)
 - Can't reserve usernames/accounts
 - Max peer connection limit (unknown)
 - Max amount of peers host can support (unknown)
 - More open to abuse / security issues
### Alternatives (AKA why this project needs to exist)
 - ~~TurnTable.fm~~ ($7 - 7.5M seed funding) [Bankrupt]
  https://techcrunch.com/2013/11/22/turntable-fm-shutting-down-so-company-can-focus-on-turntable-live-events-platform/
  "Founder Billy Chasen said that the removal of the ability to upload music was able to save the company about $20k a month"
  
 - Dubtrack.fm [Alive, open-source, popular]
https://www.reddit.com/r/dubtrack/comments/4qqca0/can_dubtrack_devs_please_make_the_queue_menu/d4v2erw
 "...it's been costing pretty much $9,000 a month for the past few months"
 
 - Plug.dj ($1.25M seed funding) [Bankrupt, then bought out & resurrected, popular]
 - Soundtrack.io [No users, open-source]
 - Jukebox.today [No users]
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
 - beatsense.com
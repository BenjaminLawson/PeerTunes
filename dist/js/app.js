(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){
function Client(e){function n(e){process.nextTick(function(){r.emit("warning",e)})}var r=this;if(!(r instanceof Client))return new Client(e);if(EventEmitter.call(r),e||(e={}),!e.peerId)throw new Error("Option `peerId` is required");if(!e.infoHash)throw new Error("Option `infoHash` is required");if(!e.announce)throw new Error("Option `announce` is required");if(!process.browser&&!e.port)throw new Error("Option `port` is required");r.peerId="string"==typeof e.peerId?e.peerId:e.peerId.toString("hex"),r._peerIdBuffer=Buffer.from(r.peerId,"hex"),r._peerIdBinary=r._peerIdBuffer.toString("binary"),r.infoHash="string"==typeof e.infoHash?e.infoHash:e.infoHash.toString("hex"),r._infoHashBuffer=Buffer.from(r.infoHash,"hex"),r._infoHashBinary=r._infoHashBuffer.toString("binary"),r._port=e.port,r.destroyed=!1,r._rtcConfig=e.rtcConfig,r._wrtc=e.wrtc,r._getAnnounceOpts=e.getAnnounceOpts,debug("new client %s",r.infoHash);var t=r._wrtc!==!1&&(!!r._wrtc||Peer.WEBRTC_SUPPORT),o="string"==typeof e.announce?[e.announce]:null==e.announce?[]:e.announce;o=o.map(function(e){return e=e.toString(),"/"===e[e.length-1]&&(e=e.substring(0,e.length-1)),e}),o=uniq(o),r._trackers=o.map(function(e){var o=url.parse(e).protocol;return"http:"!==o&&"https:"!==o||"function"!=typeof HTTPTracker?"udp:"===o&&"function"==typeof UDPTracker?new UDPTracker(r,e):"ws:"!==o&&"wss:"!==o||!t?(n(new Error("Unsupported tracker protocol: "+e)),null):"ws:"===o&&"undefined"!=typeof window&&"https:"===window.location.protocol?(n(new Error("Unsupported tracker protocol: "+e)),null):new WebSocketTracker(r,e):new HTTPTracker(r,e)}).filter(Boolean)}module.exports=Client;var Buffer=require("safe-buffer").Buffer,debug=require("debug")("bittorrent-tracker"),EventEmitter=require("events").EventEmitter,extend=require("xtend"),inherits=require("inherits"),once=require("once"),parallel=require("run-parallel"),Peer=require("simple-peer"),uniq=require("uniq"),url=require("url"),common=require("./lib/common"),HTTPTracker=require("./lib/client/http-tracker"),UDPTracker=require("./lib/client/udp-tracker"),WebSocketTracker=require("./lib/client/websocket-tracker");inherits(Client,EventEmitter),Client.scrape=function(e,n){if(n=once(n),!e.infoHash)throw new Error("Option `infoHash` is required");if(!e.announce)throw new Error("Option `announce` is required");var r=extend(e,{infoHash:Array.isArray(e.infoHash)?e.infoHash[0]:e.infoHash,peerId:Buffer.from("01234567890123456789"),port:6881}),t=new Client(r);t.once("error",n),t.once("warning",n);var o=Array.isArray(e.infoHash)?e.infoHash.length:1,i={};return t.on("scrape",function(e){if(o-=1,i[e.infoHash]=e,0===o){t.destroy();var r=Object.keys(i);1===r.length?n(null,i[r[0]]):n(null,i)}}),e.infoHash=Array.isArray(e.infoHash)?e.infoHash.map(function(e){return Buffer.from(e,"hex")}):Buffer.from(e.infoHash,"hex"),t.scrape({infoHash:e.infoHash}),t},Client.prototype.start=function(e){var n=this;debug("send `start`"),e=n._defaultAnnounceOpts(e),e.event="started",n._announce(e),n._trackers.forEach(function(e){e.setInterval()})},Client.prototype.stop=function(e){var n=this;debug("send `stop`"),e=n._defaultAnnounceOpts(e),e.event="stopped",n._announce(e)},Client.prototype.complete=function(e){var n=this;debug("send `complete`"),e||(e={}),e=n._defaultAnnounceOpts(e),e.event="completed",n._announce(e)},Client.prototype.update=function(e){var n=this;debug("send `update`"),e=n._defaultAnnounceOpts(e),e.event&&delete e.event,n._announce(e)},Client.prototype._announce=function(e){var n=this;n._trackers.forEach(function(n){n.announce(e)})},Client.prototype.scrape=function(e){var n=this;debug("send `scrape`"),e||(e={}),n._trackers.forEach(function(n){n.scrape(e)})},Client.prototype.setInterval=function(e){var n=this;debug("setInterval %d",e),n._trackers.forEach(function(n){n.setInterval(e)})},Client.prototype.destroy=function(e){var n=this;if(!n.destroyed){n.destroyed=!0,debug("destroy");var r=n._trackers.map(function(e){return function(n){e.destroy(n)}});parallel(r,e),n._trackers=[],n._getAnnounceOpts=null}},Client.prototype._defaultAnnounceOpts=function(e){var n=this;return e||(e={}),null==e.numwant&&(e.numwant=common.DEFAULT_ANNOUNCE_PEERS),null==e.uploaded&&(e.uploaded=0),null==e.downloaded&&(e.downloaded=0),n._getAnnounceOpts&&(e=extend(e,n._getAnnounceOpts())),e};
}).call(this,require('_process'))
},{"./lib/client/http-tracker":32,"./lib/client/udp-tracker":32,"./lib/client/websocket-tracker":3,"./lib/common":4,"_process":41,"debug":5,"events":37,"inherits":8,"once":10,"run-parallel":12,"safe-buffer":13,"simple-peer":97,"uniq":28,"url":70,"xtend":29}],2:[function(require,module,exports){
function Tracker(e,t){var n=this;EventEmitter.call(n),n.client=e,n.announceUrl=t,n.interval=null,n.destroyed=!1}module.exports=Tracker;var EventEmitter=require("events").EventEmitter,inherits=require("inherits");inherits(Tracker,EventEmitter),Tracker.prototype.setInterval=function(e){var t=this;null==e&&(e=t.DEFAULT_ANNOUNCE_INTERVAL),clearInterval(t.interval),e&&(t.interval=setInterval(function(){t.announce(t.client._defaultAnnounceOpts())},e),t.interval.unref&&t.interval.unref())};
},{"events":37,"inherits":8}],3:[function(require,module,exports){
function WebSocketTracker(e,n,o){var r=this;Tracker.call(r,e,n),debug("new websocket tracker %s",n),r.peers={},r.socket=null,r.reconnecting=!1,r.retries=0,r.reconnectTimer=null,r._openSocket()}function noop(){}module.exports=WebSocketTracker;var debug=require("debug")("bittorrent-tracker:websocket-tracker"),extend=require("xtend"),inherits=require("inherits"),Peer=require("simple-peer"),randombytes=require("randombytes"),Socket=require("simple-websocket"),common=require("../common"),Tracker=require("./tracker"),socketPool={},RECONNECT_MINIMUM=15e3,RECONNECT_MAXIMUM=18e5,RECONNECT_VARIANCE=3e4,OFFER_TIMEOUT=5e4;inherits(WebSocketTracker,Tracker),WebSocketTracker.prototype.DEFAULT_ANNOUNCE_INTERVAL=3e4,WebSocketTracker.prototype.announce=function(e){var n=this;if(!n.destroyed&&!n.reconnecting){if(!n.socket.connected)return void n.socket.once("connect",function(){n.announce(e)});var o=extend(e,{action:"announce",info_hash:n.client._infoHashBinary,peer_id:n.client._peerIdBinary});if(n._trackerId&&(o.trackerid=n._trackerId),"stopped"===e.event)n._send(o);else{var r=Math.min(e.numwant,10);n._generateOffers(r,function(e){o.numwant=r,o.offers=e,n._send(o)})}}},WebSocketTracker.prototype.scrape=function(e){var n=this;if(!n.destroyed&&!n.reconnecting){if(!n.socket.connected)return void n.socket.once("connect",function(){n.scrape(e)});var o=Array.isArray(e.infoHash)&&e.infoHash.length>0?e.infoHash.map(function(e){return e.toString("binary")}):e.infoHash&&e.infoHash.toString("binary")||n.client._infoHashBinary,r={action:"scrape",info_hash:o};n._send(r)}},WebSocketTracker.prototype.destroy=function(e){var n=this;if(e||(e=noop),n.destroyed)return e(null);n.destroyed=!0,clearInterval(n.interval),clearTimeout(n.reconnectTimer),n.socket&&(n.socket.removeListener("connect",n._onSocketConnectBound),n.socket.removeListener("data",n._onSocketDataBound),n.socket.removeListener("close",n._onSocketCloseBound),n.socket.removeListener("error",n._onSocketErrorBound)),n._onSocketConnectBound=null,n._onSocketErrorBound=null,n._onSocketDataBound=null,n._onSocketCloseBound=null;for(var o in n.peers){var r=n.peers[o];clearTimeout(r.trackerTimeout),r.destroy()}if(n.peers=null,socketPool[n.announceUrl]&&(socketPool[n.announceUrl].consumers-=1),0===socketPool[n.announceUrl].consumers){delete socketPool[n.announceUrl];try{n.socket.on("error",noop),n.socket.destroy(e)}catch(n){e(null)}}else e(null);n.socket=null},WebSocketTracker.prototype._openSocket=function(){var e=this;e.destroyed=!1,e.peers||(e.peers={}),e._onSocketConnectBound=function(){e._onSocketConnect()},e._onSocketErrorBound=function(n){e._onSocketError(n)},e._onSocketDataBound=function(n){e._onSocketData(n)},e._onSocketCloseBound=function(){e._onSocketClose()},e.socket=socketPool[e.announceUrl],e.socket?socketPool[e.announceUrl].consumers+=1:(e.socket=socketPool[e.announceUrl]=new Socket(e.announceUrl),e.socket.consumers=1,e.socket.on("connect",e._onSocketConnectBound)),e.socket.on("data",e._onSocketDataBound),e.socket.on("close",e._onSocketCloseBound),e.socket.on("error",e._onSocketErrorBound)},WebSocketTracker.prototype._onSocketConnect=function(){var e=this;e.destroyed||e.reconnecting&&(e.reconnecting=!1,e.retries=0,e.announce(e.client._defaultAnnounceOpts()))},WebSocketTracker.prototype._onSocketData=function(e){var n=this;if(!n.destroyed){try{e=JSON.parse(e)}catch(e){return void n.client.emit("warning",new Error("Invalid tracker response"))}"announce"===e.action?n._onAnnounceResponse(e):"scrape"===e.action?n._onScrapeResponse(e):n._onSocketError(new Error("invalid action in WS response: "+e.action))}},WebSocketTracker.prototype._onAnnounceResponse=function(e){var n=this;if(e.info_hash!==n.client._infoHashBinary)return void debug("ignoring websocket data from %s for %s (looking for %s: reused socket)",n.announceUrl,common.binaryToHex(e.info_hash),n.client.infoHash);if(!e.peer_id||e.peer_id!==n.client._peerIdBinary){debug("received %s from %s for %s",JSON.stringify(e),n.announceUrl,n.client.infoHash);var o=e["failure reason"];if(o)return n.client.emit("warning",new Error(o));var r=e["warning message"];r&&n.client.emit("warning",new Error(r));var t=e.interval||e["min interval"];t&&n.setInterval(1e3*t);var c=e["tracker id"];c&&(n._trackerId=c),null!=e.complete&&n.client.emit("update",{announce:n.announceUrl,complete:e.complete,incomplete:e.incomplete});var i;if(e.offer&&e.peer_id&&(debug("creating peer (from remote offer)"),i=new Peer({trickle:!1,config:n.client._rtcConfig,wrtc:n.client._wrtc}),i.id=common.binaryToHex(e.peer_id),i.once("signal",function(o){var r={action:"announce",info_hash:n.client._infoHashBinary,peer_id:n.client._peerIdBinary,to_peer_id:e.peer_id,answer:o,offer_id:e.offer_id};n._trackerId&&(r.trackerid=n._trackerId),n._send(r)}),i.signal(e.offer),n.client.emit("peer",i)),e.answer&&e.peer_id){var a=common.binaryToHex(e.offer_id);i=n.peers[a],i?(i.id=common.binaryToHex(e.peer_id),i.signal(e.answer),n.client.emit("peer",i),clearTimeout(i.trackerTimeout),i.trackerTimeout=null,delete n.peers[a]):debug("got unexpected answer: "+JSON.stringify(e.answer))}}},WebSocketTracker.prototype._onScrapeResponse=function(e){var n=this;e=e.files||{};var o=Object.keys(e);return 0===o.length?void n.client.emit("warning",new Error("invalid scrape response")):void o.forEach(function(o){var r=e[o];n.client.emit("scrape",{announce:n.announceUrl,infoHash:common.binaryToHex(o),complete:r.complete,incomplete:r.incomplete,downloaded:r.downloaded})})},WebSocketTracker.prototype._onSocketClose=function(){var e=this;e.destroyed||(e.destroy(),e._startReconnectTimer())},WebSocketTracker.prototype._onSocketError=function(e){var n=this;n.destroyed||(n.destroy(),n.client.emit("warning",e),n._startReconnectTimer())},WebSocketTracker.prototype._startReconnectTimer=function(){var e=this,n=Math.floor(Math.random()*RECONNECT_VARIANCE)+Math.min(Math.pow(2,e.retries)*RECONNECT_MINIMUM,RECONNECT_MAXIMUM);e.reconnecting=!0,clearTimeout(e.reconnectTimer),e.reconnectTimer=setTimeout(function(){e.retries++,e._openSocket()},n),e.reconnectTimer.unref&&e.reconnectTimer.unref(),debug("reconnecting socket in %s ms",n)},WebSocketTracker.prototype._send=function(e){var n=this;if(!n.destroyed){var o=JSON.stringify(e);debug("send %s",o),n.socket.send(o)}},WebSocketTracker.prototype._generateOffers=function(e,n){function o(){var e=randombytes(20).toString("hex");debug("creating peer (from _generateOffers)");var n=t.peers[e]=new Peer({initiator:!0,trickle:!1,config:t.client._rtcConfig,wrtc:t.client._wrtc});n.once("signal",function(n){c.push({offer:n,offer_id:common.hexToBinary(e)}),r()}),n.trackerTimeout=setTimeout(function(){debug("tracker timeout: destroying peer"),n.trackerTimeout=null,delete t.peers[e],n.destroy()},OFFER_TIMEOUT),n.trackerTimeout.unref&&n.trackerTimeout.unref()}function r(){c.length===e&&(debug("generated %s offers",e),n(c))}var t=this,c=[];debug("generating %s offers",e);for(var i=0;i<e;++i)o();r()};
},{"../common":4,"./tracker":2,"debug":5,"inherits":8,"randombytes":11,"simple-peer":97,"simple-websocket":14,"xtend":29}],4:[function(require,module,exports){
var Buffer=require("safe-buffer").Buffer,extend=require("xtend/mutable");exports.DEFAULT_ANNOUNCE_PEERS=50,exports.MAX_ANNOUNCE_PEERS=82,exports.binaryToHex=function(r){return"string"!=typeof r&&(r=String(r)),Buffer.from(r,"binary").toString("hex")},exports.hexToBinary=function(r){return"string"!=typeof r&&(r=String(r)),Buffer.from(r,"hex").toString("binary")};var config=require("./common-node");extend(exports,config);
},{"./common-node":32,"safe-buffer":13,"xtend/mutable":30}],5:[function(require,module,exports){
function useColors(){return"WebkitAppearance"in document.documentElement.style||window.console&&(console.firebug||console.exception&&console.table)||navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)&&parseInt(RegExp.$1,10)>=31}function formatArgs(){var o=arguments,e=this.useColors;if(o[0]=(e?"%c":"")+this.namespace+(e?" %c":" ")+o[0]+(e?"%c ":" ")+"+"+exports.humanize(this.diff),!e)return o;var r="color: "+this.color;o=[o[0],r,"color: inherit"].concat(Array.prototype.slice.call(o,1));var t=0,s=0;return o[0].replace(/%[a-z%]/g,function(o){"%%"!==o&&(t++,"%c"===o&&(s=t))}),o.splice(s,0,r),o}function log(){return"object"==typeof console&&console.log&&Function.prototype.apply.call(console.log,console,arguments)}function save(o){try{null==o?exports.storage.removeItem("debug"):exports.storage.debug=o}catch(o){}}function load(){var o;try{o=exports.storage.debug}catch(o){}return o}function localstorage(){try{return window.localStorage}catch(o){}}exports=module.exports=require("./debug"),exports.log=log,exports.formatArgs=formatArgs,exports.save=save,exports.load=load,exports.useColors=useColors,exports.storage="undefined"!=typeof chrome&&"undefined"!=typeof chrome.storage?chrome.storage.local:localstorage(),exports.colors=["lightseagreen","forestgreen","goldenrod","dodgerblue","darkorchid","crimson"],exports.formatters.j=function(o){return JSON.stringify(o)},exports.enable(load());
},{"./debug":6}],6:[function(require,module,exports){
function selectColor(){return exports.colors[prevColor++%exports.colors.length]}function debug(e){function r(){}function o(){var e=o,r=+new Date,s=r-(prevTime||r);e.diff=s,e.prev=prevTime,e.curr=r,prevTime=r,null==e.useColors&&(e.useColors=exports.useColors()),null==e.color&&e.useColors&&(e.color=selectColor());var t=Array.prototype.slice.call(arguments);t[0]=exports.coerce(t[0]),"string"!=typeof t[0]&&(t=["%o"].concat(t));var n=0;t[0]=t[0].replace(/%([a-z%])/g,function(r,o){if("%%"===r)return r;n++;var s=exports.formatters[o];if("function"==typeof s){var p=t[n];r=s.call(e,p),t.splice(n,1),n--}return r}),"function"==typeof exports.formatArgs&&(t=exports.formatArgs.apply(e,t));var p=o.log||exports.log||console.log.bind(console);p.apply(e,t)}r.enabled=!1,o.enabled=!0;var s=exports.enabled(e)?o:r;return s.namespace=e,s}function enable(e){exports.save(e);for(var r=(e||"").split(/[\s,]+/),o=r.length,s=0;s<o;s++)r[s]&&(e=r[s].replace(/\*/g,".*?"),"-"===e[0]?exports.skips.push(new RegExp("^"+e.substr(1)+"$")):exports.names.push(new RegExp("^"+e+"$")))}function disable(){exports.enable("")}function enabled(e){var r,o;for(r=0,o=exports.skips.length;r<o;r++)if(exports.skips[r].test(e))return!1;for(r=0,o=exports.names.length;r<o;r++)if(exports.names[r].test(e))return!0;return!1}function coerce(e){return e instanceof Error?e.stack||e.message:e}exports=module.exports=debug,exports.coerce=coerce,exports.disable=disable,exports.enable=enable,exports.enabled=enabled,exports.humanize=require("ms"),exports.names=[],exports.skips=[],exports.formatters={};var prevColor=0,prevTime;
},{"ms":7}],7:[function(require,module,exports){
function parse(e){if(e=""+e,!(e.length>1e4)){var a=/^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(e);if(a){var r=parseFloat(a[1]),c=(a[2]||"ms").toLowerCase();switch(c){case"years":case"year":case"yrs":case"yr":case"y":return r*y;case"days":case"day":case"d":return r*d;case"hours":case"hour":case"hrs":case"hr":case"h":return r*h;case"minutes":case"minute":case"mins":case"min":case"m":return r*m;case"seconds":case"second":case"secs":case"sec":case"s":return r*s;case"milliseconds":case"millisecond":case"msecs":case"msec":case"ms":return r}}}}function short(e){return e>=d?Math.round(e/d)+"d":e>=h?Math.round(e/h)+"h":e>=m?Math.round(e/m)+"m":e>=s?Math.round(e/s)+"s":e+"ms"}function long(e){return plural(e,d,"day")||plural(e,h,"hour")||plural(e,m,"minute")||plural(e,s,"second")||e+" ms"}function plural(s,e,a){if(!(s<e))return s<1.5*e?Math.floor(s/e)+" "+a:Math.ceil(s/e)+" "+a+"s"}var s=1e3,m=60*s,h=60*m,d=24*h,y=365.25*d;module.exports=function(s,e){return e=e||{},"string"==typeof s?parse(s):e.long?long(s):short(s)};
},{}],8:[function(require,module,exports){
"function"==typeof Object.create?module.exports=function(t,e){t.super_=e,t.prototype=Object.create(e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}})}:module.exports=function(t,e){t.super_=e;var o=function(){};o.prototype=e.prototype,t.prototype=new o,t.prototype.constructor=t};
},{}],9:[function(require,module,exports){
function wrappy(n,r){function e(){for(var r=new Array(arguments.length),e=0;e<r.length;e++)r[e]=arguments[e];var t=n.apply(this,r),o=r[r.length-1];return"function"==typeof t&&t!==o&&Object.keys(o).forEach(function(n){t[n]=o[n]}),t}if(n&&r)return wrappy(n)(r);if("function"!=typeof n)throw new TypeError("need wrapper function");return Object.keys(n).forEach(function(r){e[r]=n[r]}),e}module.exports=wrappy;
},{}],10:[function(require,module,exports){
function once(e){var n=function(){return n.called?n.value:(n.called=!0,n.value=e.apply(this,arguments))};return n.called=!1,n}var wrappy=require("wrappy");module.exports=wrappy(once),once.proto=once(function(){Object.defineProperty(Function.prototype,"once",{value:function(){return once(this)},configurable:!0})});
},{"wrappy":9}],11:[function(require,module,exports){
(function (process,global,Buffer){
"use strict";function oldBrowser(){throw new Error("secure random number generation not supported by this browser\nuse chrome, FireFox or Internet Explorer 11")}function randomBytes(r,o){if(r>65536)throw new Error("requested too many random bytes");var e=new global.Uint8Array(r);r>0&&crypto.getRandomValues(e);var t=new Buffer(e.buffer);return"function"==typeof o?process.nextTick(function(){o(null,t)}):t}var crypto=global.crypto||global.msCrypto;crypto&&crypto.getRandomValues?module.exports=randomBytes:module.exports=oldBrowser;
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"_process":41,"buffer":33}],12:[function(require,module,exports){
(function (process){
module.exports=function(n,c){function o(n){function o(){c&&c(n,u),c=null}r?process.nextTick(o):o()}function t(n,c,t){u[n]=t,(0===--f||c)&&o(c)}var u,f,i,r=!0;Array.isArray(n)?(u=[],f=n.length):(i=Object.keys(n),u={},f=i.length),f?i?i.forEach(function(c){n[c](function(n,o){t(c,n,o)})}):n.forEach(function(n,c){n(function(n,o){t(c,n,o)})}):o(null),r=!1};
}).call(this,require('_process'))
},{"_process":41}],13:[function(require,module,exports){
module.exports=require("buffer");
},{"buffer":33}],14:[function(require,module,exports){
(function (process,Buffer){
function Socket(e,t){var n=this;if(!(n instanceof Socket))return new Socket(e,t);t||(t={}),debug("new websocket: %s %o",e,t),t.allowHalfOpen=!1,null==t.highWaterMark&&(t.highWaterMark=1048576),stream.Duplex.call(n,t),n.url=e,n.connected=!1,n.destroyed=!1,n._maxBufferedAmount=t.highWaterMark,n._chunk=null,n._cb=null,n._interval=null;try{"undefined"==typeof WebSocket?n._ws=new _WebSocket(n.url,t):n._ws=new _WebSocket(n.url)}catch(e){return void process.nextTick(function(){n._onError(e)})}n._ws.binaryType="arraybuffer",n._ws.onopen=function(){n._onOpen()},n._ws.onmessage=function(e){n._onMessage(e)},n._ws.onclose=function(){n._onClose()},n._ws.onerror=function(){n._onError(new Error("connection error to "+n.url))},n.on("finish",function(){n.connected?setTimeout(function(){n._destroy()},100):n.once("connect",function(){setTimeout(function(){n._destroy()},100)})})}module.exports=Socket;var debug=require("debug")("simple-websocket"),inherits=require("inherits"),stream=require("readable-stream"),ws=require("ws"),_WebSocket="undefined"!=typeof WebSocket?WebSocket:ws;inherits(Socket,stream.Duplex),Socket.WEBSOCKET_SUPPORT=!!_WebSocket,Socket.prototype.send=function(e){var t=this,n=e.length||e.byteLength||e.size;t._ws.send(e),debug("write: %d bytes",n)},Socket.prototype.destroy=function(e){var t=this;t._destroy(null,e)},Socket.prototype._destroy=function(e,t){var n=this;if(!n.destroyed){if(t&&n.once("close",t),debug("destroy (error: %s)",e&&e.message),this.readable=this.writable=!1,n._readableState.ended||n.push(null),n._writableState.finished||n.end(),n.connected=!1,n.destroyed=!0,clearInterval(n._interval),n._interval=null,n._chunk=null,n._cb=null,n._ws){var o=n._ws,r=function(){o.onclose=null,n.emit("close")};if(o.readyState===_WebSocket.CLOSED)r();else try{o.onclose=r,o.close()}catch(e){r()}o.onopen=null,o.onmessage=null,o.onerror=null}n._ws=null,e&&n.emit("error",e)}},Socket.prototype._read=function(){},Socket.prototype._write=function(e,t,n){var o=this;if(o.destroyed)return n(new Error("cannot write after socket is destroyed"));if(o.connected){try{o.send(e)}catch(e){return o._onError(e)}"function"!=typeof ws&&o._ws.bufferedAmount>o._maxBufferedAmount?(debug("start backpressure: bufferedAmount %d",o._ws.bufferedAmount),o._cb=n):n(null)}else debug("write before connect"),o._chunk=e,o._cb=n},Socket.prototype._onMessage=function(e){var t=this;if(!t.destroyed){var n=e.data;debug("read: %d bytes",n.byteLength||n.length),n instanceof ArrayBuffer&&(n=new Buffer(n)),t.push(n)}},Socket.prototype._onOpen=function(){var e=this;if(!e.connected&&!e.destroyed){if(e.connected=!0,e._chunk){try{e.send(e._chunk)}catch(t){return e._onError(t)}e._chunk=null,debug('sent chunk from "write before connect"');var t=e._cb;e._cb=null,t(null)}"function"!=typeof ws&&(e._interval=setInterval(function(){if(e._cb&&e._ws&&!(e._ws.bufferedAmount>e._maxBufferedAmount)){debug("ending backpressure: bufferedAmount %d",e._ws.bufferedAmount);var t=e._cb;e._cb=null,t(null)}},150),e._interval.unref&&e._interval.unref()),debug("connect"),e.emit("connect")}},Socket.prototype._onClose=function(){var e=this;e.destroyed||(debug("on close"),e._destroy())},Socket.prototype._onError=function(e){var t=this;t.destroyed||(debug("error: %s",e.message||e),t._destroy(e))};
}).call(this,require('_process'),require("buffer").Buffer)
},{"_process":41,"buffer":33,"debug":5,"inherits":8,"readable-stream":27,"ws":32}],15:[function(require,module,exports){
"use strict";function Duplex(e){return this instanceof Duplex?(Readable.call(this,e),Writable.call(this,e),e&&e.readable===!1&&(this.readable=!1),e&&e.writable===!1&&(this.writable=!1),this.allowHalfOpen=!0,e&&e.allowHalfOpen===!1&&(this.allowHalfOpen=!1),void this.once("end",onend)):new Duplex(e)}function onend(){this.allowHalfOpen||this._writableState.ended||processNextTick(onEndNT,this)}function onEndNT(e){e.end()}function forEach(e,t){for(var r=0,i=e.length;r<i;r++)t(e[r],r)}var objectKeys=Object.keys||function(e){var t=[];for(var r in e)t.push(r);return t};module.exports=Duplex;var processNextTick=require("process-nextick-args"),util=require("core-util-is");util.inherits=require("inherits");var Readable=require("./_stream_readable"),Writable=require("./_stream_writable");util.inherits(Duplex,Readable);for(var keys=objectKeys(Writable.prototype),v=0;v<keys.length;v++){var method=keys[v];Duplex.prototype[method]||(Duplex.prototype[method]=Writable.prototype[method])}
},{"./_stream_readable":17,"./_stream_writable":19,"core-util-is":22,"inherits":8,"process-nextick-args":24}],16:[function(require,module,exports){
"use strict";function PassThrough(r){return this instanceof PassThrough?void Transform.call(this,r):new PassThrough(r)}module.exports=PassThrough;var Transform=require("./_stream_transform"),util=require("core-util-is");util.inherits=require("inherits"),util.inherits(PassThrough,Transform),PassThrough.prototype._transform=function(r,s,i){i(null,r)};
},{"./_stream_transform":18,"core-util-is":22,"inherits":8}],17:[function(require,module,exports){
(function (process){
"use strict";function prependListener(e,t,r){return"function"==typeof e.prependListener?e.prependListener(t,r):void(e._events&&e._events[t]?isArray(e._events[t])?e._events[t].unshift(r):e._events[t]=[r,e._events[t]]:e.on(t,r))}function ReadableState(e,t){Duplex=Duplex||require("./_stream_duplex"),e=e||{},this.objectMode=!!e.objectMode,t instanceof Duplex&&(this.objectMode=this.objectMode||!!e.readableObjectMode);var r=e.highWaterMark,n=this.objectMode?16:16384;this.highWaterMark=r||0===r?r:n,this.highWaterMark=~~this.highWaterMark,this.buffer=new BufferList,this.length=0,this.pipes=null,this.pipesCount=0,this.flowing=null,this.ended=!1,this.endEmitted=!1,this.reading=!1,this.sync=!0,this.needReadable=!1,this.emittedReadable=!1,this.readableListening=!1,this.resumeScheduled=!1,this.defaultEncoding=e.defaultEncoding||"utf8",this.ranOut=!1,this.awaitDrain=0,this.readingMore=!1,this.decoder=null,this.encoding=null,e.encoding&&(StringDecoder||(StringDecoder=require("string_decoder/").StringDecoder),this.decoder=new StringDecoder(e.encoding),this.encoding=e.encoding)}function Readable(e){return Duplex=Duplex||require("./_stream_duplex"),this instanceof Readable?(this._readableState=new ReadableState(e,this),this.readable=!0,e&&"function"==typeof e.read&&(this._read=e.read),void Stream.call(this)):new Readable(e)}function readableAddChunk(e,t,r,n,a){var i=chunkInvalid(t,r);if(i)e.emit("error",i);else if(null===r)t.reading=!1,onEofChunk(e,t);else if(t.objectMode||r&&r.length>0)if(t.ended&&!a){var d=new Error("stream.push() after EOF");e.emit("error",d)}else if(t.endEmitted&&a){var o=new Error("stream.unshift() after end event");e.emit("error",o)}else{var u;!t.decoder||a||n||(r=t.decoder.write(r),u=!t.objectMode&&0===r.length),a||(t.reading=!1),u||(t.flowing&&0===t.length&&!t.sync?(e.emit("data",r),e.read(0)):(t.length+=t.objectMode?1:r.length,a?t.buffer.unshift(r):t.buffer.push(r),t.needReadable&&emitReadable(e))),maybeReadMore(e,t)}else a||(t.reading=!1);return needMoreData(t)}function needMoreData(e){return!e.ended&&(e.needReadable||e.length<e.highWaterMark||0===e.length)}function computeNewHighWaterMark(e){return e>=MAX_HWM?e=MAX_HWM:(e--,e|=e>>>1,e|=e>>>2,e|=e>>>4,e|=e>>>8,e|=e>>>16,e++),e}function howMuchToRead(e,t){return e<=0||0===t.length&&t.ended?0:t.objectMode?1:e!==e?t.flowing&&t.length?t.buffer.head.data.length:t.length:(e>t.highWaterMark&&(t.highWaterMark=computeNewHighWaterMark(e)),e<=t.length?e:t.ended?t.length:(t.needReadable=!0,0))}function chunkInvalid(e,t){var r=null;return Buffer.isBuffer(t)||"string"==typeof t||null===t||void 0===t||e.objectMode||(r=new TypeError("Invalid non-string/buffer chunk")),r}function onEofChunk(e,t){if(!t.ended){if(t.decoder){var r=t.decoder.end();r&&r.length&&(t.buffer.push(r),t.length+=t.objectMode?1:r.length)}t.ended=!0,emitReadable(e)}}function emitReadable(e){var t=e._readableState;t.needReadable=!1,t.emittedReadable||(debug("emitReadable",t.flowing),t.emittedReadable=!0,t.sync?processNextTick(emitReadable_,e):emitReadable_(e))}function emitReadable_(e){debug("emit readable"),e.emit("readable"),flow(e)}function maybeReadMore(e,t){t.readingMore||(t.readingMore=!0,processNextTick(maybeReadMore_,e,t))}function maybeReadMore_(e,t){for(var r=t.length;!t.reading&&!t.flowing&&!t.ended&&t.length<t.highWaterMark&&(debug("maybeReadMore read 0"),e.read(0),r!==t.length);)r=t.length;t.readingMore=!1}function pipeOnDrain(e){return function(){var t=e._readableState;debug("pipeOnDrain",t.awaitDrain),t.awaitDrain&&t.awaitDrain--,0===t.awaitDrain&&EElistenerCount(e,"data")&&(t.flowing=!0,flow(e))}}function nReadingNextTick(e){debug("readable nexttick read 0"),e.read(0)}function resume(e,t){t.resumeScheduled||(t.resumeScheduled=!0,processNextTick(resume_,e,t))}function resume_(e,t){t.reading||(debug("resume read 0"),e.read(0)),t.resumeScheduled=!1,t.awaitDrain=0,e.emit("resume"),flow(e),t.flowing&&!t.reading&&e.read(0)}function flow(e){var t=e._readableState;for(debug("flow",t.flowing);t.flowing&&null!==e.read(););}function fromList(e,t){if(0===t.length)return null;var r;return t.objectMode?r=t.buffer.shift():!e||e>=t.length?(r=t.decoder?t.buffer.join(""):1===t.buffer.length?t.buffer.head.data:t.buffer.concat(t.length),t.buffer.clear()):r=fromListPartial(e,t.buffer,t.decoder),r}function fromListPartial(e,t,r){var n;return e<t.head.data.length?(n=t.head.data.slice(0,e),t.head.data=t.head.data.slice(e)):n=e===t.head.data.length?t.shift():r?copyFromBufferString(e,t):copyFromBuffer(e,t),n}function copyFromBufferString(e,t){var r=t.head,n=1,a=r.data;for(e-=a.length;r=r.next;){var i=r.data,d=e>i.length?i.length:e;if(a+=d===i.length?i:i.slice(0,e),e-=d,0===e){d===i.length?(++n,r.next?t.head=r.next:t.head=t.tail=null):(t.head=r,r.data=i.slice(d));break}++n}return t.length-=n,a}function copyFromBuffer(e,t){var r=bufferShim.allocUnsafe(e),n=t.head,a=1;for(n.data.copy(r),e-=n.data.length;n=n.next;){var i=n.data,d=e>i.length?i.length:e;if(i.copy(r,r.length-e,0,d),e-=d,0===e){d===i.length?(++a,n.next?t.head=n.next:t.head=t.tail=null):(t.head=n,n.data=i.slice(d));break}++a}return t.length-=a,r}function endReadable(e){var t=e._readableState;if(t.length>0)throw new Error('"endReadable()" called on non-empty stream');t.endEmitted||(t.ended=!0,processNextTick(endReadableNT,t,e))}function endReadableNT(e,t){e.endEmitted||0!==e.length||(e.endEmitted=!0,t.readable=!1,t.emit("end"))}function forEach(e,t){for(var r=0,n=e.length;r<n;r++)t(e[r],r)}function indexOf(e,t){for(var r=0,n=e.length;r<n;r++)if(e[r]===t)return r;return-1}module.exports=Readable;var processNextTick=require("process-nextick-args"),isArray=require("isarray");Readable.ReadableState=ReadableState;var EE=require("events").EventEmitter,EElistenerCount=function(e,t){return e.listeners(t).length},Stream;!function(){try{Stream=require("stream")}catch(e){}finally{Stream||(Stream=require("events").EventEmitter)}}();var Buffer=require("buffer").Buffer,bufferShim=require("buffer-shims"),util=require("core-util-is");util.inherits=require("inherits");var debugUtil=require("util"),debug=void 0;debug=debugUtil&&debugUtil.debuglog?debugUtil.debuglog("stream"):function(){};var BufferList=require("./internal/streams/BufferList"),StringDecoder;util.inherits(Readable,Stream);var Duplex,Duplex;Readable.prototype.push=function(e,t){var r=this._readableState;return r.objectMode||"string"!=typeof e||(t=t||r.defaultEncoding,t!==r.encoding&&(e=bufferShim.from(e,t),t="")),readableAddChunk(this,r,e,t,!1)},Readable.prototype.unshift=function(e){var t=this._readableState;return readableAddChunk(this,t,e,"",!0)},Readable.prototype.isPaused=function(){return this._readableState.flowing===!1},Readable.prototype.setEncoding=function(e){return StringDecoder||(StringDecoder=require("string_decoder/").StringDecoder),this._readableState.decoder=new StringDecoder(e),this._readableState.encoding=e,this};var MAX_HWM=8388608;Readable.prototype.read=function(e){debug("read",e),e=parseInt(e,10);var t=this._readableState,r=e;if(0!==e&&(t.emittedReadable=!1),0===e&&t.needReadable&&(t.length>=t.highWaterMark||t.ended))return debug("read: emitReadable",t.length,t.ended),0===t.length&&t.ended?endReadable(this):emitReadable(this),null;if(e=howMuchToRead(e,t),0===e&&t.ended)return 0===t.length&&endReadable(this),null;var n=t.needReadable;debug("need readable",n),(0===t.length||t.length-e<t.highWaterMark)&&(n=!0,debug("length less than watermark",n)),t.ended||t.reading?(n=!1,debug("reading or ended",n)):n&&(debug("do read"),t.reading=!0,t.sync=!0,0===t.length&&(t.needReadable=!0),this._read(t.highWaterMark),t.sync=!1,t.reading||(e=howMuchToRead(r,t)));var a;return a=e>0?fromList(e,t):null,null===a?(t.needReadable=!0,e=0):t.length-=e,0===t.length&&(t.ended||(t.needReadable=!0),r!==e&&t.ended&&endReadable(this)),null!==a&&this.emit("data",a),a},Readable.prototype._read=function(e){this.emit("error",new Error("not implemented"))},Readable.prototype.pipe=function(e,t){function r(e){debug("onunpipe"),e===s&&a()}function n(){debug("onend"),e.end()}function a(){debug("cleanup"),e.removeListener("close",o),e.removeListener("finish",u),e.removeListener("drain",c),e.removeListener("error",d),e.removeListener("unpipe",r),s.removeListener("end",n),s.removeListener("end",a),s.removeListener("data",i),g=!0,!h.awaitDrain||e._writableState&&!e._writableState.needDrain||c()}function i(t){debug("ondata"),b=!1;var r=e.write(t);!1!==r||b||((1===h.pipesCount&&h.pipes===e||h.pipesCount>1&&indexOf(h.pipes,e)!==-1)&&!g&&(debug("false write response, pause",s._readableState.awaitDrain),s._readableState.awaitDrain++,b=!0),s.pause())}function d(t){debug("onerror",t),l(),e.removeListener("error",d),0===EElistenerCount(e,"error")&&e.emit("error",t)}function o(){e.removeListener("finish",u),l()}function u(){debug("onfinish"),e.removeListener("close",o),l()}function l(){debug("unpipe"),s.unpipe(e)}var s=this,h=this._readableState;switch(h.pipesCount){case 0:h.pipes=e;break;case 1:h.pipes=[h.pipes,e];break;default:h.pipes.push(e)}h.pipesCount+=1,debug("pipe count=%d opts=%j",h.pipesCount,t);var f=(!t||t.end!==!1)&&e!==process.stdout&&e!==process.stderr,p=f?n:a;h.endEmitted?processNextTick(p):s.once("end",p),e.on("unpipe",r);var c=pipeOnDrain(s);e.on("drain",c);var g=!1,b=!1;return s.on("data",i),prependListener(e,"error",d),e.once("close",o),e.once("finish",u),e.emit("pipe",s),h.flowing||(debug("pipe resume"),s.resume()),e},Readable.prototype.unpipe=function(e){var t=this._readableState;if(0===t.pipesCount)return this;if(1===t.pipesCount)return e&&e!==t.pipes?this:(e||(e=t.pipes),t.pipes=null,t.pipesCount=0,t.flowing=!1,e&&e.emit("unpipe",this),this);if(!e){var r=t.pipes,n=t.pipesCount;t.pipes=null,t.pipesCount=0,t.flowing=!1;for(var a=0;a<n;a++)r[a].emit("unpipe",this);return this}var i=indexOf(t.pipes,e);return i===-1?this:(t.pipes.splice(i,1),t.pipesCount-=1,1===t.pipesCount&&(t.pipes=t.pipes[0]),e.emit("unpipe",this),this)},Readable.prototype.on=function(e,t){var r=Stream.prototype.on.call(this,e,t);if("data"===e)this._readableState.flowing!==!1&&this.resume();else if("readable"===e){var n=this._readableState;n.endEmitted||n.readableListening||(n.readableListening=n.needReadable=!0,n.emittedReadable=!1,n.reading?n.length&&emitReadable(this,n):processNextTick(nReadingNextTick,this))}return r},Readable.prototype.addListener=Readable.prototype.on,Readable.prototype.resume=function(){var e=this._readableState;return e.flowing||(debug("resume"),e.flowing=!0,resume(this,e)),this},Readable.prototype.pause=function(){return debug("call pause flowing=%j",this._readableState.flowing),!1!==this._readableState.flowing&&(debug("pause"),this._readableState.flowing=!1,this.emit("pause")),this},Readable.prototype.wrap=function(e){var t=this._readableState,r=!1,n=this;e.on("end",function(){if(debug("wrapped end"),t.decoder&&!t.ended){var e=t.decoder.end();e&&e.length&&n.push(e)}n.push(null)}),e.on("data",function(a){if(debug("wrapped data"),t.decoder&&(a=t.decoder.write(a)),(!t.objectMode||null!==a&&void 0!==a)&&(t.objectMode||a&&a.length)){var i=n.push(a);i||(r=!0,e.pause())}});for(var a in e)void 0===this[a]&&"function"==typeof e[a]&&(this[a]=function(t){return function(){return e[t].apply(e,arguments)}}(a));var i=["error","close","destroy","pause","resume"];return forEach(i,function(t){e.on(t,n.emit.bind(n,t))}),n._read=function(t){debug("wrapped _read",t),r&&(r=!1,e.resume())},n},Readable._fromList=fromList;
}).call(this,require('_process'))
},{"./_stream_duplex":15,"./internal/streams/BufferList":20,"_process":41,"buffer":33,"buffer-shims":21,"core-util-is":22,"events":37,"inherits":8,"isarray":23,"process-nextick-args":24,"stream":62,"string_decoder/":25,"util":32}],18:[function(require,module,exports){
"use strict";function TransformState(r){this.afterTransform=function(t,n){return afterTransform(r,t,n)},this.needTransform=!1,this.transforming=!1,this.writecb=null,this.writechunk=null,this.writeencoding=null}function afterTransform(r,t,n){var e=r._transformState;e.transforming=!1;var i=e.writecb;if(!i)return r.emit("error",new Error("no writecb in Transform class"));e.writechunk=null,e.writecb=null,null!==n&&void 0!==n&&r.push(n),i(t);var a=r._readableState;a.reading=!1,(a.needReadable||a.length<a.highWaterMark)&&r._read(a.highWaterMark)}function Transform(r){if(!(this instanceof Transform))return new Transform(r);Duplex.call(this,r),this._transformState=new TransformState(this);var t=this;this._readableState.needReadable=!0,this._readableState.sync=!1,r&&("function"==typeof r.transform&&(this._transform=r.transform),"function"==typeof r.flush&&(this._flush=r.flush)),this.once("prefinish",function(){"function"==typeof this._flush?this._flush(function(r){done(t,r)}):done(t)})}function done(r,t){if(t)return r.emit("error",t);var n=r._writableState,e=r._transformState;if(n.length)throw new Error("Calling transform done when ws.length != 0");if(e.transforming)throw new Error("Calling transform done when still transforming");return r.push(null)}module.exports=Transform;var Duplex=require("./_stream_duplex"),util=require("core-util-is");util.inherits=require("inherits"),util.inherits(Transform,Duplex),Transform.prototype.push=function(r,t){return this._transformState.needTransform=!1,Duplex.prototype.push.call(this,r,t)},Transform.prototype._transform=function(r,t,n){throw new Error("Not implemented")},Transform.prototype._write=function(r,t,n){var e=this._transformState;if(e.writecb=n,e.writechunk=r,e.writeencoding=t,!e.transforming){var i=this._readableState;(e.needTransform||i.needReadable||i.length<i.highWaterMark)&&this._read(i.highWaterMark)}},Transform.prototype._read=function(r){var t=this._transformState;null!==t.writechunk&&t.writecb&&!t.transforming?(t.transforming=!0,this._transform(t.writechunk,t.writeencoding,t.afterTransform)):t.needTransform=!0};
},{"./_stream_duplex":15,"core-util-is":22,"inherits":8}],19:[function(require,module,exports){
(function (process){
"use strict";function nop(){}function WriteReq(e,t,r){this.chunk=e,this.encoding=t,this.callback=r,this.next=null}function WritableState(e,t){Duplex=Duplex||require("./_stream_duplex"),e=e||{},this.objectMode=!!e.objectMode,t instanceof Duplex&&(this.objectMode=this.objectMode||!!e.writableObjectMode);var r=e.highWaterMark,i=this.objectMode?16:16384;this.highWaterMark=r||0===r?r:i,this.highWaterMark=~~this.highWaterMark,this.needDrain=!1,this.ending=!1,this.ended=!1,this.finished=!1;var n=e.decodeStrings===!1;this.decodeStrings=!n,this.defaultEncoding=e.defaultEncoding||"utf8",this.length=0,this.writing=!1,this.corked=0,this.sync=!0,this.bufferProcessing=!1,this.onwrite=function(e){onwrite(t,e)},this.writecb=null,this.writelen=0,this.bufferedRequest=null,this.lastBufferedRequest=null,this.pendingcb=0,this.prefinished=!1,this.errorEmitted=!1,this.bufferedRequestCount=0,this.corkedRequestsFree=new CorkedRequest(this)}function Writable(e){return Duplex=Duplex||require("./_stream_duplex"),this instanceof Writable||this instanceof Duplex?(this._writableState=new WritableState(e,this),this.writable=!0,e&&("function"==typeof e.write&&(this._write=e.write),"function"==typeof e.writev&&(this._writev=e.writev)),void Stream.call(this)):new Writable(e)}function writeAfterEnd(e,t){var r=new Error("write after end");e.emit("error",r),processNextTick(t,r)}function validChunk(e,t,r,i){var n=!0,s=!1;return null===r?s=new TypeError("May not write null values to stream"):Buffer.isBuffer(r)||"string"==typeof r||void 0===r||t.objectMode||(s=new TypeError("Invalid non-string/buffer chunk")),s&&(e.emit("error",s),processNextTick(i,s),n=!1),n}function decodeChunk(e,t,r){return e.objectMode||e.decodeStrings===!1||"string"!=typeof t||(t=bufferShim.from(t,r)),t}function writeOrBuffer(e,t,r,i,n){r=decodeChunk(t,r,i),Buffer.isBuffer(r)&&(i="buffer");var s=t.objectMode?1:r.length;t.length+=s;var u=t.length<t.highWaterMark;if(u||(t.needDrain=!0),t.writing||t.corked){var o=t.lastBufferedRequest;t.lastBufferedRequest=new WriteReq(r,i,n),o?o.next=t.lastBufferedRequest:t.bufferedRequest=t.lastBufferedRequest,t.bufferedRequestCount+=1}else doWrite(e,t,!1,s,r,i,n);return u}function doWrite(e,t,r,i,n,s,u){t.writelen=i,t.writecb=u,t.writing=!0,t.sync=!0,r?e._writev(n,t.onwrite):e._write(n,s,t.onwrite),t.sync=!1}function onwriteError(e,t,r,i,n){--t.pendingcb,r?processNextTick(n,i):n(i),e._writableState.errorEmitted=!0,e.emit("error",i)}function onwriteStateUpdate(e){e.writing=!1,e.writecb=null,e.length-=e.writelen,e.writelen=0}function onwrite(e,t){var r=e._writableState,i=r.sync,n=r.writecb;if(onwriteStateUpdate(r),t)onwriteError(e,r,i,t,n);else{var s=needFinish(r);s||r.corked||r.bufferProcessing||!r.bufferedRequest||clearBuffer(e,r),i?asyncWrite(afterWrite,e,r,s,n):afterWrite(e,r,s,n)}}function afterWrite(e,t,r,i){r||onwriteDrain(e,t),t.pendingcb--,i(),finishMaybe(e,t)}function onwriteDrain(e,t){0===t.length&&t.needDrain&&(t.needDrain=!1,e.emit("drain"))}function clearBuffer(e,t){t.bufferProcessing=!0;var r=t.bufferedRequest;if(e._writev&&r&&r.next){var i=t.bufferedRequestCount,n=new Array(i),s=t.corkedRequestsFree;s.entry=r;for(var u=0;r;)n[u]=r,r=r.next,u+=1;doWrite(e,t,!0,t.length,n,"",s.finish),t.pendingcb++,t.lastBufferedRequest=null,s.next?(t.corkedRequestsFree=s.next,s.next=null):t.corkedRequestsFree=new CorkedRequest(t)}else{for(;r;){var o=r.chunk,f=r.encoding,a=r.callback,c=t.objectMode?1:o.length;if(doWrite(e,t,!1,c,o,f,a),r=r.next,t.writing)break}null===r&&(t.lastBufferedRequest=null)}t.bufferedRequestCount=0,t.bufferedRequest=r,t.bufferProcessing=!1}function needFinish(e){return e.ending&&0===e.length&&null===e.bufferedRequest&&!e.finished&&!e.writing}function prefinish(e,t){t.prefinished||(t.prefinished=!0,e.emit("prefinish"))}function finishMaybe(e,t){var r=needFinish(t);return r&&(0===t.pendingcb?(prefinish(e,t),t.finished=!0,e.emit("finish")):prefinish(e,t)),r}function endWritable(e,t,r){t.ending=!0,finishMaybe(e,t),r&&(t.finished?processNextTick(r):e.once("finish",r)),t.ended=!0,e.writable=!1}function CorkedRequest(e){var t=this;this.next=null,this.entry=null,this.finish=function(r){var i=t.entry;for(t.entry=null;i;){var n=i.callback;e.pendingcb--,n(r),i=i.next}e.corkedRequestsFree?e.corkedRequestsFree.next=t:e.corkedRequestsFree=t}}module.exports=Writable;var processNextTick=require("process-nextick-args"),asyncWrite=!process.browser&&["v0.10","v0.9."].indexOf(process.version.slice(0,5))>-1?setImmediate:processNextTick;Writable.WritableState=WritableState;var util=require("core-util-is");util.inherits=require("inherits");var internalUtil={deprecate:require("util-deprecate")},Stream;!function(){try{Stream=require("stream")}catch(e){}finally{Stream||(Stream=require("events").EventEmitter)}}();var Buffer=require("buffer").Buffer,bufferShim=require("buffer-shims");util.inherits(Writable,Stream);var Duplex;WritableState.prototype.getBuffer=function(){for(var e=this.bufferedRequest,t=[];e;)t.push(e),e=e.next;return t},function(){try{Object.defineProperty(WritableState.prototype,"buffer",{get:internalUtil.deprecate(function(){return this.getBuffer()},"_writableState.buffer is deprecated. Use _writableState.getBuffer instead.")})}catch(e){}}();var Duplex;Writable.prototype.pipe=function(){this.emit("error",new Error("Cannot pipe, not readable"))},Writable.prototype.write=function(e,t,r){var i=this._writableState,n=!1;return"function"==typeof t&&(r=t,t=null),Buffer.isBuffer(e)?t="buffer":t||(t=i.defaultEncoding),"function"!=typeof r&&(r=nop),i.ended?writeAfterEnd(this,r):validChunk(this,i,e,r)&&(i.pendingcb++,n=writeOrBuffer(this,i,e,t,r)),n},Writable.prototype.cork=function(){var e=this._writableState;e.corked++},Writable.prototype.uncork=function(){var e=this._writableState;e.corked&&(e.corked--,e.writing||e.corked||e.finished||e.bufferProcessing||!e.bufferedRequest||clearBuffer(this,e))},Writable.prototype.setDefaultEncoding=function(e){if("string"==typeof e&&(e=e.toLowerCase()),!(["hex","utf8","utf-8","ascii","binary","base64","ucs2","ucs-2","utf16le","utf-16le","raw"].indexOf((e+"").toLowerCase())>-1))throw new TypeError("Unknown encoding: "+e);return this._writableState.defaultEncoding=e,this},Writable.prototype._write=function(e,t,r){r(new Error("not implemented"))},Writable.prototype._writev=null,Writable.prototype.end=function(e,t,r){var i=this._writableState;"function"==typeof e?(r=e,e=null,t=null):"function"==typeof t&&(r=t,t=null),null!==e&&void 0!==e&&this.write(e,t),i.corked&&(i.corked=1,this.uncork()),i.ending||i.finished||endWritable(this,i,r)};
}).call(this,require('_process'))
},{"./_stream_duplex":15,"_process":41,"buffer":33,"buffer-shims":21,"core-util-is":22,"events":37,"inherits":8,"process-nextick-args":24,"stream":62,"util-deprecate":26}],20:[function(require,module,exports){
"use strict";function BufferList(){this.head=null,this.tail=null,this.length=0}var Buffer=require("buffer").Buffer,bufferShim=require("buffer-shims");module.exports=BufferList,BufferList.prototype.push=function(t){var e={data:t,next:null};this.length>0?this.tail.next=e:this.head=e,this.tail=e,++this.length},BufferList.prototype.unshift=function(t){var e={data:t,next:this.head};0===this.length&&(this.tail=e),this.head=e,++this.length},BufferList.prototype.shift=function(){if(0!==this.length){var t=this.head.data;return 1===this.length?this.head=this.tail=null:this.head=this.head.next,--this.length,t}},BufferList.prototype.clear=function(){this.head=this.tail=null,this.length=0},BufferList.prototype.join=function(t){if(0===this.length)return"";for(var e=this.head,i=""+e.data;e=e.next;)i+=t+e.data;return i},BufferList.prototype.concat=function(t){if(0===this.length)return bufferShim.alloc(0);if(1===this.length)return this.head.data;for(var e=bufferShim.allocUnsafe(t>>>0),i=this.head,h=0;i;)i.data.copy(e,h),h+=i.data.length,i=i.next;return e};
},{"buffer":33,"buffer-shims":21}],21:[function(require,module,exports){
(function (global){
"use strict";var buffer=require("buffer"),Buffer=buffer.Buffer,SlowBuffer=buffer.SlowBuffer,MAX_LEN=buffer.kMaxLength||2147483647;exports.alloc=function(r,e,f){if("function"==typeof Buffer.alloc)return Buffer.alloc(r,e,f);if("number"==typeof f)throw new TypeError("encoding must not be number");if("number"!=typeof r)throw new TypeError("size must be a number");if(r>MAX_LEN)throw new RangeError("size is too large");var n=f,o=e;void 0===o&&(n=void 0,o=0);var t=new Buffer(r);if("string"==typeof o)for(var u=new Buffer(o,n),i=u.length,a=-1;++a<r;)t[a]=u[a%i];else t.fill(o);return t},exports.allocUnsafe=function(r){if("function"==typeof Buffer.allocUnsafe)return Buffer.allocUnsafe(r);if("number"!=typeof r)throw new TypeError("size must be a number");if(r>MAX_LEN)throw new RangeError("size is too large");return new Buffer(r)},exports.from=function(r,e,f){if("function"==typeof Buffer.from&&(!global.Uint8Array||Uint8Array.from!==Buffer.from))return Buffer.from(r,e,f);if("number"==typeof r)throw new TypeError('"value" argument must not be a number');if("string"==typeof r)return new Buffer(r,e);if("undefined"!=typeof ArrayBuffer&&r instanceof ArrayBuffer){var n=e;if(1===arguments.length)return new Buffer(r);"undefined"==typeof n&&(n=0);var o=f;if("undefined"==typeof o&&(o=r.byteLength-n),n>=r.byteLength)throw new RangeError("'offset' is out of bounds");if(o>r.byteLength-n)throw new RangeError("'length' is out of bounds");return new Buffer(r.slice(n,n+o))}if(Buffer.isBuffer(r)){var t=new Buffer(r.length);return r.copy(t,0,0,r.length),t}if(r){if(Array.isArray(r)||"undefined"!=typeof ArrayBuffer&&r.buffer instanceof ArrayBuffer||"length"in r)return new Buffer(r);if("Buffer"===r.type&&Array.isArray(r.data))return new Buffer(r.data)}throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.")},exports.allocUnsafeSlow=function(r){if("function"==typeof Buffer.allocUnsafeSlow)return Buffer.allocUnsafeSlow(r);if("number"!=typeof r)throw new TypeError("size must be a number");if(r>=MAX_LEN)throw new RangeError("size is too large");return new SlowBuffer(r)};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"buffer":33}],22:[function(require,module,exports){
(function (Buffer){
function isArray(r){return Array.isArray?Array.isArray(r):"[object Array]"===objectToString(r)}function isBoolean(r){return"boolean"==typeof r}function isNull(r){return null===r}function isNullOrUndefined(r){return null==r}function isNumber(r){return"number"==typeof r}function isString(r){return"string"==typeof r}function isSymbol(r){return"symbol"==typeof r}function isUndefined(r){return void 0===r}function isRegExp(r){return"[object RegExp]"===objectToString(r)}function isObject(r){return"object"==typeof r&&null!==r}function isDate(r){return"[object Date]"===objectToString(r)}function isError(r){return"[object Error]"===objectToString(r)||r instanceof Error}function isFunction(r){return"function"==typeof r}function isPrimitive(r){return null===r||"boolean"==typeof r||"number"==typeof r||"string"==typeof r||"symbol"==typeof r||"undefined"==typeof r}function objectToString(r){return Object.prototype.toString.call(r)}exports.isArray=isArray,exports.isBoolean=isBoolean,exports.isNull=isNull,exports.isNullOrUndefined=isNullOrUndefined,exports.isNumber=isNumber,exports.isString=isString,exports.isSymbol=isSymbol,exports.isUndefined=isUndefined,exports.isRegExp=isRegExp,exports.isObject=isObject,exports.isDate=isDate,exports.isError=isError,exports.isFunction=isFunction,exports.isPrimitive=isPrimitive,exports.isBuffer=Buffer.isBuffer;
}).call(this,{"isBuffer":require("../../../../../../../../browserify/node_modules/insert-module-globals/node_modules/is-buffer/index.js")})
},{"../../../../../../../../browserify/node_modules/insert-module-globals/node_modules/is-buffer/index.js":39}],23:[function(require,module,exports){
var toString={}.toString;module.exports=Array.isArray||function(r){return"[object Array]"==toString.call(r)};
},{}],24:[function(require,module,exports){
(function (process){
"use strict";function nextTick(e,n,c,r){if("function"!=typeof e)throw new TypeError('"callback" argument must be a function');var s,t,o=arguments.length;switch(o){case 0:case 1:return process.nextTick(e);case 2:return process.nextTick(function(){e.call(null,n)});case 3:return process.nextTick(function(){e.call(null,n,c)});case 4:return process.nextTick(function(){e.call(null,n,c,r)});default:for(s=new Array(o-1),t=0;t<s.length;)s[t++]=arguments[t];return process.nextTick(function(){e.apply(null,s)})}}!process.version||0===process.version.indexOf("v0.")||0===process.version.indexOf("v1.")&&0!==process.version.indexOf("v1.8.")?module.exports=nextTick:module.exports=process.nextTick;
}).call(this,require('_process'))
},{"_process":41}],25:[function(require,module,exports){
function assertEncoding(e){if(e&&!isBufferEncoding(e))throw new Error("Unknown encoding: "+e)}function passThroughWrite(e){return e.toString(this.encoding)}function utf16DetectIncompleteChar(e){this.charReceived=e.length%2,this.charLength=this.charReceived?2:0}function base64DetectIncompleteChar(e){this.charReceived=e.length%3,this.charLength=this.charReceived?3:0}var Buffer=require("buffer").Buffer,isBufferEncoding=Buffer.isEncoding||function(e){switch(e&&e.toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":case"raw":return!0;default:return!1}},StringDecoder=exports.StringDecoder=function(e){switch(this.encoding=(e||"utf8").toLowerCase().replace(/[-_]/,""),assertEncoding(e),this.encoding){case"utf8":this.surrogateSize=3;break;case"ucs2":case"utf16le":this.surrogateSize=2,this.detectIncompleteChar=utf16DetectIncompleteChar;break;case"base64":this.surrogateSize=3,this.detectIncompleteChar=base64DetectIncompleteChar;break;default:return void(this.write=passThroughWrite)}this.charBuffer=new Buffer(6),this.charReceived=0,this.charLength=0};StringDecoder.prototype.write=function(e){for(var t="";this.charLength;){var r=e.length>=this.charLength-this.charReceived?this.charLength-this.charReceived:e.length;if(e.copy(this.charBuffer,this.charReceived,0,r),this.charReceived+=r,this.charReceived<this.charLength)return"";e=e.slice(r,e.length),t=this.charBuffer.slice(0,this.charLength).toString(this.encoding);var h=t.charCodeAt(t.length-1);if(!(h>=55296&&h<=56319)){if(this.charReceived=this.charLength=0,0===e.length)return t;break}this.charLength+=this.surrogateSize,t=""}this.detectIncompleteChar(e);var i=e.length;this.charLength&&(e.copy(this.charBuffer,0,e.length-this.charReceived,i),i-=this.charReceived),t+=e.toString(this.encoding,0,i);var i=t.length-1,h=t.charCodeAt(i);if(h>=55296&&h<=56319){var c=this.surrogateSize;return this.charLength+=c,this.charReceived+=c,this.charBuffer.copy(this.charBuffer,c,0,c),e.copy(this.charBuffer,0,0,c),t.substring(0,i)}return t},StringDecoder.prototype.detectIncompleteChar=function(e){for(var t=e.length>=3?3:e.length;t>0;t--){var r=e[e.length-t];if(1==t&&r>>5==6){this.charLength=2;break}if(t<=2&&r>>4==14){this.charLength=3;break}if(t<=3&&r>>3==30){this.charLength=4;break}}this.charReceived=t},StringDecoder.prototype.end=function(e){var t="";if(e&&e.length&&(t=this.write(e)),this.charReceived){var r=this.charReceived,h=this.charBuffer,i=this.encoding;t+=h.slice(0,r).toString(i)}return t};
},{"buffer":33}],26:[function(require,module,exports){
(function (global){
function deprecate(r,e){function o(){if(!t){if(config("throwDeprecation"))throw new Error(e);config("traceDeprecation")?console.trace(e):console.warn(e),t=!0}return r.apply(this,arguments)}if(config("noDeprecation"))return r;var t=!1;return o}function config(r){try{if(!global.localStorage)return!1}catch(r){return!1}var e=global.localStorage[r];return null!=e&&"true"===String(e).toLowerCase()}module.exports=deprecate;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],27:[function(require,module,exports){
(function (process){
var Stream=function(){try{return require("stream")}catch(r){}}();exports=module.exports=require("./lib/_stream_readable.js"),exports.Stream=Stream||exports,exports.Readable=exports,exports.Writable=require("./lib/_stream_writable.js"),exports.Duplex=require("./lib/_stream_duplex.js"),exports.Transform=require("./lib/_stream_transform.js"),exports.PassThrough=require("./lib/_stream_passthrough.js"),!process.browser&&"disable"===process.env.READABLE_STREAM&&Stream&&(module.exports=Stream);
}).call(this,require('_process'))
},{"./lib/_stream_duplex.js":15,"./lib/_stream_passthrough.js":16,"./lib/_stream_readable.js":17,"./lib/_stream_transform.js":18,"./lib/_stream_writable.js":19,"_process":41,"stream":62}],28:[function(require,module,exports){
"use strict";function unique_pred(n,e){for(var u=1,t=n.length,i=n[0],r=n[0],o=1;o<t;++o)if(r=i,i=n[o],e(i,r)){if(o===u){u++;continue}n[u++]=i}return n.length=u,n}function unique_eq(n){for(var e=1,u=n.length,t=n[0],i=n[0],r=1;r<u;++r,i=t)if(i=t,t=n[r],t!==i){if(r===e){e++;continue}n[e++]=t}return n.length=e,n}function unique(n,e,u){return 0===n.length?n:e?(u||n.sort(e),unique_pred(n,e)):(u||n.sort(),unique_eq(n))}module.exports=unique;
},{}],29:[function(require,module,exports){
function extend(){for(var r={},e=0;e<arguments.length;e++){var t=arguments[e];for(var n in t)hasOwnProperty.call(t,n)&&(r[n]=t[n])}return r}module.exports=extend;var hasOwnProperty=Object.prototype.hasOwnProperty;
},{}],30:[function(require,module,exports){
function extend(r){for(var e=1;e<arguments.length;e++){var t=arguments[e];for(var n in t)hasOwnProperty.call(t,n)&&(r[n]=t[n])}return r}module.exports=extend;var hasOwnProperty=Object.prototype.hasOwnProperty;
},{}],31:[function(require,module,exports){

},{}],32:[function(require,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"dup":31}],33:[function(require,module,exports){
(function (global){
"use strict";function typedArraySupport(){try{var t=new Uint8Array(1);return t.__proto__={__proto__:Uint8Array.prototype,foo:function(){return 42}},42===t.foo()&&"function"==typeof t.subarray&&0===t.subarray(1,1).byteLength}catch(t){return!1}}function kMaxLength(){return Buffer.TYPED_ARRAY_SUPPORT?2147483647:1073741823}function createBuffer(t,e){if(kMaxLength()<e)throw new RangeError("Invalid typed array length");return Buffer.TYPED_ARRAY_SUPPORT?(t=new Uint8Array(e),t.__proto__=Buffer.prototype):(null===t&&(t=new Buffer(e)),t.length=e),t}function Buffer(t,e,r){if(!(Buffer.TYPED_ARRAY_SUPPORT||this instanceof Buffer))return new Buffer(t,e,r);if("number"==typeof t){if("string"==typeof e)throw new Error("If encoding is specified then the first argument must be a string");return allocUnsafe(this,t)}return from(this,t,e,r)}function from(t,e,r,n){if("number"==typeof e)throw new TypeError('"value" argument must not be a number');return"undefined"!=typeof ArrayBuffer&&e instanceof ArrayBuffer?fromArrayBuffer(t,e,r,n):"string"==typeof e?fromString(t,e,r):fromObject(t,e)}function assertSize(t){if("number"!=typeof t)throw new TypeError('"size" argument must be a number');if(t<0)throw new RangeError('"size" argument must not be negative')}function alloc(t,e,r,n){return assertSize(e),e<=0?createBuffer(t,e):void 0!==r?"string"==typeof n?createBuffer(t,e).fill(r,n):createBuffer(t,e).fill(r):createBuffer(t,e)}function allocUnsafe(t,e){if(assertSize(e),t=createBuffer(t,e<0?0:0|checked(e)),!Buffer.TYPED_ARRAY_SUPPORT)for(var r=0;r<e;++r)t[r]=0;return t}function fromString(t,e,r){if("string"==typeof r&&""!==r||(r="utf8"),!Buffer.isEncoding(r))throw new TypeError('"encoding" must be a valid string encoding');var n=0|byteLength(e,r);t=createBuffer(t,n);var f=t.write(e,r);return f!==n&&(t=t.slice(0,f)),t}function fromArrayLike(t,e){var r=e.length<0?0:0|checked(e.length);t=createBuffer(t,r);for(var n=0;n<r;n+=1)t[n]=255&e[n];return t}function fromArrayBuffer(t,e,r,n){if(e.byteLength,r<0||e.byteLength<r)throw new RangeError("'offset' is out of bounds");if(e.byteLength<r+(n||0))throw new RangeError("'length' is out of bounds");return e=void 0===r&&void 0===n?new Uint8Array(e):void 0===n?new Uint8Array(e,r):new Uint8Array(e,r,n),Buffer.TYPED_ARRAY_SUPPORT?(t=e,t.__proto__=Buffer.prototype):t=fromArrayLike(t,e),t}function fromObject(t,e){if(Buffer.isBuffer(e)){var r=0|checked(e.length);return t=createBuffer(t,r),0===t.length?t:(e.copy(t,0,0,r),t)}if(e){if("undefined"!=typeof ArrayBuffer&&e.buffer instanceof ArrayBuffer||"length"in e)return"number"!=typeof e.length||isnan(e.length)?createBuffer(t,0):fromArrayLike(t,e);if("Buffer"===e.type&&isArray(e.data))return fromArrayLike(t,e.data)}throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.")}function checked(t){if(t>=kMaxLength())throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x"+kMaxLength().toString(16)+" bytes");return 0|t}function SlowBuffer(t){return+t!=t&&(t=0),Buffer.alloc(+t)}function byteLength(t,e){if(Buffer.isBuffer(t))return t.length;if("undefined"!=typeof ArrayBuffer&&"function"==typeof ArrayBuffer.isView&&(ArrayBuffer.isView(t)||t instanceof ArrayBuffer))return t.byteLength;"string"!=typeof t&&(t=""+t);var r=t.length;if(0===r)return 0;for(var n=!1;;)switch(e){case"ascii":case"latin1":case"binary":return r;case"utf8":case"utf-8":case void 0:return utf8ToBytes(t).length;case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return 2*r;case"hex":return r>>>1;case"base64":return base64ToBytes(t).length;default:if(n)return utf8ToBytes(t).length;e=(""+e).toLowerCase(),n=!0}}function slowToString(t,e,r){var n=!1;if((void 0===e||e<0)&&(e=0),e>this.length)return"";if((void 0===r||r>this.length)&&(r=this.length),r<=0)return"";if(r>>>=0,e>>>=0,r<=e)return"";for(t||(t="utf8");;)switch(t){case"hex":return hexSlice(this,e,r);case"utf8":case"utf-8":return utf8Slice(this,e,r);case"ascii":return asciiSlice(this,e,r);case"latin1":case"binary":return latin1Slice(this,e,r);case"base64":return base64Slice(this,e,r);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return utf16leSlice(this,e,r);default:if(n)throw new TypeError("Unknown encoding: "+t);t=(t+"").toLowerCase(),n=!0}}function swap(t,e,r){var n=t[e];t[e]=t[r],t[r]=n}function bidirectionalIndexOf(t,e,r,n,f){if(0===t.length)return-1;if("string"==typeof r?(n=r,r=0):r>2147483647?r=2147483647:r<-2147483648&&(r=-2147483648),r=+r,isNaN(r)&&(r=f?0:t.length-1),r<0&&(r=t.length+r),r>=t.length){if(f)return-1;r=t.length-1}else if(r<0){if(!f)return-1;r=0}if("string"==typeof e&&(e=Buffer.from(e,n)),Buffer.isBuffer(e))return 0===e.length?-1:arrayIndexOf(t,e,r,n,f);if("number"==typeof e)return e=255&e,Buffer.TYPED_ARRAY_SUPPORT&&"function"==typeof Uint8Array.prototype.indexOf?f?Uint8Array.prototype.indexOf.call(t,e,r):Uint8Array.prototype.lastIndexOf.call(t,e,r):arrayIndexOf(t,[e],r,n,f);throw new TypeError("val must be string, number or Buffer")}function arrayIndexOf(t,e,r,n,f){function i(t,e){return 1===o?t[e]:t.readUInt16BE(e*o)}var o=1,u=t.length,s=e.length;if(void 0!==n&&(n=String(n).toLowerCase(),"ucs2"===n||"ucs-2"===n||"utf16le"===n||"utf-16le"===n)){if(t.length<2||e.length<2)return-1;o=2,u/=2,s/=2,r/=2}var a;if(f){var h=-1;for(a=r;a<u;a++)if(i(t,a)===i(e,h===-1?0:a-h)){if(h===-1&&(h=a),a-h+1===s)return h*o}else h!==-1&&(a-=a-h),h=-1}else for(r+s>u&&(r=u-s),a=r;a>=0;a--){for(var c=!0,l=0;l<s;l++)if(i(t,a+l)!==i(e,l)){c=!1;break}if(c)return a}return-1}function hexWrite(t,e,r,n){r=Number(r)||0;var f=t.length-r;n?(n=Number(n),n>f&&(n=f)):n=f;var i=e.length;if(i%2!==0)throw new TypeError("Invalid hex string");n>i/2&&(n=i/2);for(var o=0;o<n;++o){var u=parseInt(e.substr(2*o,2),16);if(isNaN(u))return o;t[r+o]=u}return o}function utf8Write(t,e,r,n){return blitBuffer(utf8ToBytes(e,t.length-r),t,r,n)}function asciiWrite(t,e,r,n){return blitBuffer(asciiToBytes(e),t,r,n)}function latin1Write(t,e,r,n){return asciiWrite(t,e,r,n)}function base64Write(t,e,r,n){return blitBuffer(base64ToBytes(e),t,r,n)}function ucs2Write(t,e,r,n){return blitBuffer(utf16leToBytes(e,t.length-r),t,r,n)}function base64Slice(t,e,r){return 0===e&&r===t.length?base64.fromByteArray(t):base64.fromByteArray(t.slice(e,r))}function utf8Slice(t,e,r){r=Math.min(t.length,r);for(var n=[],f=e;f<r;){var i=t[f],o=null,u=i>239?4:i>223?3:i>191?2:1;if(f+u<=r){var s,a,h,c;switch(u){case 1:i<128&&(o=i);break;case 2:s=t[f+1],128===(192&s)&&(c=(31&i)<<6|63&s,c>127&&(o=c));break;case 3:s=t[f+1],a=t[f+2],128===(192&s)&&128===(192&a)&&(c=(15&i)<<12|(63&s)<<6|63&a,c>2047&&(c<55296||c>57343)&&(o=c));break;case 4:s=t[f+1],a=t[f+2],h=t[f+3],128===(192&s)&&128===(192&a)&&128===(192&h)&&(c=(15&i)<<18|(63&s)<<12|(63&a)<<6|63&h,c>65535&&c<1114112&&(o=c))}}null===o?(o=65533,u=1):o>65535&&(o-=65536,n.push(o>>>10&1023|55296),o=56320|1023&o),n.push(o),f+=u}return decodeCodePointsArray(n)}function decodeCodePointsArray(t){var e=t.length;if(e<=MAX_ARGUMENTS_LENGTH)return String.fromCharCode.apply(String,t);for(var r="",n=0;n<e;)r+=String.fromCharCode.apply(String,t.slice(n,n+=MAX_ARGUMENTS_LENGTH));return r}function asciiSlice(t,e,r){var n="";r=Math.min(t.length,r);for(var f=e;f<r;++f)n+=String.fromCharCode(127&t[f]);return n}function latin1Slice(t,e,r){var n="";r=Math.min(t.length,r);for(var f=e;f<r;++f)n+=String.fromCharCode(t[f]);return n}function hexSlice(t,e,r){var n=t.length;(!e||e<0)&&(e=0),(!r||r<0||r>n)&&(r=n);for(var f="",i=e;i<r;++i)f+=toHex(t[i]);return f}function utf16leSlice(t,e,r){for(var n=t.slice(e,r),f="",i=0;i<n.length;i+=2)f+=String.fromCharCode(n[i]+256*n[i+1]);return f}function checkOffset(t,e,r){if(t%1!==0||t<0)throw new RangeError("offset is not uint");if(t+e>r)throw new RangeError("Trying to access beyond buffer length")}function checkInt(t,e,r,n,f,i){if(!Buffer.isBuffer(t))throw new TypeError('"buffer" argument must be a Buffer instance');if(e>f||e<i)throw new RangeError('"value" argument is out of bounds');if(r+n>t.length)throw new RangeError("Index out of range")}function objectWriteUInt16(t,e,r,n){e<0&&(e=65535+e+1);for(var f=0,i=Math.min(t.length-r,2);f<i;++f)t[r+f]=(e&255<<8*(n?f:1-f))>>>8*(n?f:1-f)}function objectWriteUInt32(t,e,r,n){e<0&&(e=4294967295+e+1);for(var f=0,i=Math.min(t.length-r,4);f<i;++f)t[r+f]=e>>>8*(n?f:3-f)&255}function checkIEEE754(t,e,r,n,f,i){if(r+n>t.length)throw new RangeError("Index out of range");if(r<0)throw new RangeError("Index out of range")}function writeFloat(t,e,r,n,f){return f||checkIEEE754(t,e,r,4,3.4028234663852886e38,-3.4028234663852886e38),ieee754.write(t,e,r,n,23,4),r+4}function writeDouble(t,e,r,n,f){return f||checkIEEE754(t,e,r,8,1.7976931348623157e308,-1.7976931348623157e308),ieee754.write(t,e,r,n,52,8),r+8}function base64clean(t){if(t=stringtrim(t).replace(INVALID_BASE64_RE,""),t.length<2)return"";for(;t.length%4!==0;)t+="=";return t}function stringtrim(t){return t.trim?t.trim():t.replace(/^\s+|\s+$/g,"")}function toHex(t){return t<16?"0"+t.toString(16):t.toString(16)}function utf8ToBytes(t,e){e=e||1/0;for(var r,n=t.length,f=null,i=[],o=0;o<n;++o){if(r=t.charCodeAt(o),r>55295&&r<57344){if(!f){if(r>56319){(e-=3)>-1&&i.push(239,191,189);continue}if(o+1===n){(e-=3)>-1&&i.push(239,191,189);continue}f=r;continue}if(r<56320){(e-=3)>-1&&i.push(239,191,189),f=r;continue}r=(f-55296<<10|r-56320)+65536}else f&&(e-=3)>-1&&i.push(239,191,189);if(f=null,r<128){if((e-=1)<0)break;i.push(r)}else if(r<2048){if((e-=2)<0)break;i.push(r>>6|192,63&r|128)}else if(r<65536){if((e-=3)<0)break;i.push(r>>12|224,r>>6&63|128,63&r|128)}else{if(!(r<1114112))throw new Error("Invalid code point");if((e-=4)<0)break;i.push(r>>18|240,r>>12&63|128,r>>6&63|128,63&r|128)}}return i}function asciiToBytes(t){for(var e=[],r=0;r<t.length;++r)e.push(255&t.charCodeAt(r));return e}function utf16leToBytes(t,e){for(var r,n,f,i=[],o=0;o<t.length&&!((e-=2)<0);++o)r=t.charCodeAt(o),n=r>>8,f=r%256,i.push(f),i.push(n);return i}function base64ToBytes(t){return base64.toByteArray(base64clean(t))}function blitBuffer(t,e,r,n){for(var f=0;f<n&&!(f+r>=e.length||f>=t.length);++f)e[f+r]=t[f];return f}function isnan(t){return t!==t}var base64=require("base64-js"),ieee754=require("ieee754"),isArray=require("isarray");exports.Buffer=Buffer,exports.SlowBuffer=SlowBuffer,exports.INSPECT_MAX_BYTES=50,Buffer.TYPED_ARRAY_SUPPORT=void 0!==global.TYPED_ARRAY_SUPPORT?global.TYPED_ARRAY_SUPPORT:typedArraySupport(),exports.kMaxLength=kMaxLength(),Buffer.poolSize=8192,Buffer._augment=function(t){return t.__proto__=Buffer.prototype,t},Buffer.from=function(t,e,r){return from(null,t,e,r)},Buffer.TYPED_ARRAY_SUPPORT&&(Buffer.prototype.__proto__=Uint8Array.prototype,Buffer.__proto__=Uint8Array,"undefined"!=typeof Symbol&&Symbol.species&&Buffer[Symbol.species]===Buffer&&Object.defineProperty(Buffer,Symbol.species,{value:null,configurable:!0})),Buffer.alloc=function(t,e,r){return alloc(null,t,e,r)},Buffer.allocUnsafe=function(t){return allocUnsafe(null,t)},Buffer.allocUnsafeSlow=function(t){return allocUnsafe(null,t)},Buffer.isBuffer=function(t){return!(null==t||!t._isBuffer)},Buffer.compare=function(t,e){if(!Buffer.isBuffer(t)||!Buffer.isBuffer(e))throw new TypeError("Arguments must be Buffers");if(t===e)return 0;for(var r=t.length,n=e.length,f=0,i=Math.min(r,n);f<i;++f)if(t[f]!==e[f]){r=t[f],n=e[f];break}return r<n?-1:n<r?1:0},Buffer.isEncoding=function(t){switch(String(t).toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"latin1":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return!0;default:return!1}},Buffer.concat=function(t,e){if(!isArray(t))throw new TypeError('"list" argument must be an Array of Buffers');if(0===t.length)return Buffer.alloc(0);var r;if(void 0===e)for(e=0,r=0;r<t.length;++r)e+=t[r].length;var n=Buffer.allocUnsafe(e),f=0;for(r=0;r<t.length;++r){var i=t[r];if(!Buffer.isBuffer(i))throw new TypeError('"list" argument must be an Array of Buffers');i.copy(n,f),f+=i.length}return n},Buffer.byteLength=byteLength,Buffer.prototype._isBuffer=!0,Buffer.prototype.swap16=function(){var t=this.length;if(t%2!==0)throw new RangeError("Buffer size must be a multiple of 16-bits");for(var e=0;e<t;e+=2)swap(this,e,e+1);return this},Buffer.prototype.swap32=function(){var t=this.length;if(t%4!==0)throw new RangeError("Buffer size must be a multiple of 32-bits");for(var e=0;e<t;e+=4)swap(this,e,e+3),swap(this,e+1,e+2);return this},Buffer.prototype.swap64=function(){var t=this.length;if(t%8!==0)throw new RangeError("Buffer size must be a multiple of 64-bits");for(var e=0;e<t;e+=8)swap(this,e,e+7),swap(this,e+1,e+6),swap(this,e+2,e+5),swap(this,e+3,e+4);return this},Buffer.prototype.toString=function(){var t=0|this.length;return 0===t?"":0===arguments.length?utf8Slice(this,0,t):slowToString.apply(this,arguments)},Buffer.prototype.equals=function(t){if(!Buffer.isBuffer(t))throw new TypeError("Argument must be a Buffer");return this===t||0===Buffer.compare(this,t)},Buffer.prototype.inspect=function(){var t="",e=exports.INSPECT_MAX_BYTES;return this.length>0&&(t=this.toString("hex",0,e).match(/.{2}/g).join(" "),this.length>e&&(t+=" ... ")),"<Buffer "+t+">"},Buffer.prototype.compare=function(t,e,r,n,f){if(!Buffer.isBuffer(t))throw new TypeError("Argument must be a Buffer");if(void 0===e&&(e=0),void 0===r&&(r=t?t.length:0),void 0===n&&(n=0),void 0===f&&(f=this.length),e<0||r>t.length||n<0||f>this.length)throw new RangeError("out of range index");if(n>=f&&e>=r)return 0;if(n>=f)return-1;if(e>=r)return 1;if(e>>>=0,r>>>=0,n>>>=0,f>>>=0,this===t)return 0;for(var i=f-n,o=r-e,u=Math.min(i,o),s=this.slice(n,f),a=t.slice(e,r),h=0;h<u;++h)if(s[h]!==a[h]){i=s[h],o=a[h];break}return i<o?-1:o<i?1:0},Buffer.prototype.includes=function(t,e,r){return this.indexOf(t,e,r)!==-1},Buffer.prototype.indexOf=function(t,e,r){return bidirectionalIndexOf(this,t,e,r,!0)},Buffer.prototype.lastIndexOf=function(t,e,r){return bidirectionalIndexOf(this,t,e,r,!1)},Buffer.prototype.write=function(t,e,r,n){if(void 0===e)n="utf8",r=this.length,e=0;else if(void 0===r&&"string"==typeof e)n=e,r=this.length,e=0;else{if(!isFinite(e))throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");e=0|e,isFinite(r)?(r=0|r,void 0===n&&(n="utf8")):(n=r,r=void 0)}var f=this.length-e;if((void 0===r||r>f)&&(r=f),t.length>0&&(r<0||e<0)||e>this.length)throw new RangeError("Attempt to write outside buffer bounds");n||(n="utf8");for(var i=!1;;)switch(n){case"hex":return hexWrite(this,t,e,r);case"utf8":case"utf-8":return utf8Write(this,t,e,r);case"ascii":return asciiWrite(this,t,e,r);case"latin1":case"binary":return latin1Write(this,t,e,r);case"base64":return base64Write(this,t,e,r);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return ucs2Write(this,t,e,r);default:if(i)throw new TypeError("Unknown encoding: "+n);n=(""+n).toLowerCase(),i=!0}},Buffer.prototype.toJSON=function(){return{type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)}};var MAX_ARGUMENTS_LENGTH=4096;Buffer.prototype.slice=function(t,e){var r=this.length;t=~~t,e=void 0===e?r:~~e,t<0?(t+=r,t<0&&(t=0)):t>r&&(t=r),e<0?(e+=r,e<0&&(e=0)):e>r&&(e=r),e<t&&(e=t);var n;if(Buffer.TYPED_ARRAY_SUPPORT)n=this.subarray(t,e),n.__proto__=Buffer.prototype;else{var f=e-t;n=new Buffer(f,void 0);for(var i=0;i<f;++i)n[i]=this[i+t]}return n},Buffer.prototype.readUIntLE=function(t,e,r){t=0|t,e=0|e,r||checkOffset(t,e,this.length);for(var n=this[t],f=1,i=0;++i<e&&(f*=256);)n+=this[t+i]*f;return n},Buffer.prototype.readUIntBE=function(t,e,r){t=0|t,e=0|e,r||checkOffset(t,e,this.length);for(var n=this[t+--e],f=1;e>0&&(f*=256);)n+=this[t+--e]*f;return n},Buffer.prototype.readUInt8=function(t,e){return e||checkOffset(t,1,this.length),this[t]},Buffer.prototype.readUInt16LE=function(t,e){return e||checkOffset(t,2,this.length),this[t]|this[t+1]<<8},Buffer.prototype.readUInt16BE=function(t,e){return e||checkOffset(t,2,this.length),this[t]<<8|this[t+1]},Buffer.prototype.readUInt32LE=function(t,e){return e||checkOffset(t,4,this.length),(this[t]|this[t+1]<<8|this[t+2]<<16)+16777216*this[t+3]},Buffer.prototype.readUInt32BE=function(t,e){return e||checkOffset(t,4,this.length),16777216*this[t]+(this[t+1]<<16|this[t+2]<<8|this[t+3])},Buffer.prototype.readIntLE=function(t,e,r){t=0|t,e=0|e,r||checkOffset(t,e,this.length);for(var n=this[t],f=1,i=0;++i<e&&(f*=256);)n+=this[t+i]*f;return f*=128,n>=f&&(n-=Math.pow(2,8*e)),n},Buffer.prototype.readIntBE=function(t,e,r){t=0|t,e=0|e,r||checkOffset(t,e,this.length);for(var n=e,f=1,i=this[t+--n];n>0&&(f*=256);)i+=this[t+--n]*f;return f*=128,i>=f&&(i-=Math.pow(2,8*e)),i},Buffer.prototype.readInt8=function(t,e){return e||checkOffset(t,1,this.length),128&this[t]?(255-this[t]+1)*-1:this[t]},Buffer.prototype.readInt16LE=function(t,e){e||checkOffset(t,2,this.length);var r=this[t]|this[t+1]<<8;return 32768&r?4294901760|r:r},Buffer.prototype.readInt16BE=function(t,e){e||checkOffset(t,2,this.length);var r=this[t+1]|this[t]<<8;return 32768&r?4294901760|r:r},Buffer.prototype.readInt32LE=function(t,e){return e||checkOffset(t,4,this.length),this[t]|this[t+1]<<8|this[t+2]<<16|this[t+3]<<24},Buffer.prototype.readInt32BE=function(t,e){return e||checkOffset(t,4,this.length),this[t]<<24|this[t+1]<<16|this[t+2]<<8|this[t+3]},Buffer.prototype.readFloatLE=function(t,e){return e||checkOffset(t,4,this.length),ieee754.read(this,t,!0,23,4)},Buffer.prototype.readFloatBE=function(t,e){return e||checkOffset(t,4,this.length),ieee754.read(this,t,!1,23,4)},Buffer.prototype.readDoubleLE=function(t,e){return e||checkOffset(t,8,this.length),ieee754.read(this,t,!0,52,8)},Buffer.prototype.readDoubleBE=function(t,e){return e||checkOffset(t,8,this.length),ieee754.read(this,t,!1,52,8)},Buffer.prototype.writeUIntLE=function(t,e,r,n){if(t=+t,e=0|e,r=0|r,!n){var f=Math.pow(2,8*r)-1;checkInt(this,t,e,r,f,0)}var i=1,o=0;for(this[e]=255&t;++o<r&&(i*=256);)this[e+o]=t/i&255;return e+r},Buffer.prototype.writeUIntBE=function(t,e,r,n){if(t=+t,e=0|e,r=0|r,!n){var f=Math.pow(2,8*r)-1;checkInt(this,t,e,r,f,0)}var i=r-1,o=1;for(this[e+i]=255&t;--i>=0&&(o*=256);)this[e+i]=t/o&255;return e+r},Buffer.prototype.writeUInt8=function(t,e,r){return t=+t,e=0|e,r||checkInt(this,t,e,1,255,0),Buffer.TYPED_ARRAY_SUPPORT||(t=Math.floor(t)),this[e]=255&t,e+1},Buffer.prototype.writeUInt16LE=function(t,e,r){return t=+t,e=0|e,r||checkInt(this,t,e,2,65535,0),Buffer.TYPED_ARRAY_SUPPORT?(this[e]=255&t,this[e+1]=t>>>8):objectWriteUInt16(this,t,e,!0),e+2},Buffer.prototype.writeUInt16BE=function(t,e,r){return t=+t,e=0|e,r||checkInt(this,t,e,2,65535,0),Buffer.TYPED_ARRAY_SUPPORT?(this[e]=t>>>8,this[e+1]=255&t):objectWriteUInt16(this,t,e,!1),e+2},Buffer.prototype.writeUInt32LE=function(t,e,r){return t=+t,e=0|e,r||checkInt(this,t,e,4,4294967295,0),Buffer.TYPED_ARRAY_SUPPORT?(this[e+3]=t>>>24,this[e+2]=t>>>16,this[e+1]=t>>>8,this[e]=255&t):objectWriteUInt32(this,t,e,!0),e+4},Buffer.prototype.writeUInt32BE=function(t,e,r){return t=+t,e=0|e,r||checkInt(this,t,e,4,4294967295,0),Buffer.TYPED_ARRAY_SUPPORT?(this[e]=t>>>24,this[e+1]=t>>>16,this[e+2]=t>>>8,this[e+3]=255&t):objectWriteUInt32(this,t,e,!1),e+4},Buffer.prototype.writeIntLE=function(t,e,r,n){if(t=+t,e=0|e,!n){var f=Math.pow(2,8*r-1);checkInt(this,t,e,r,f-1,-f)}var i=0,o=1,u=0;for(this[e]=255&t;++i<r&&(o*=256);)t<0&&0===u&&0!==this[e+i-1]&&(u=1),this[e+i]=(t/o>>0)-u&255;return e+r},Buffer.prototype.writeIntBE=function(t,e,r,n){if(t=+t,e=0|e,!n){var f=Math.pow(2,8*r-1);checkInt(this,t,e,r,f-1,-f)}var i=r-1,o=1,u=0;for(this[e+i]=255&t;--i>=0&&(o*=256);)t<0&&0===u&&0!==this[e+i+1]&&(u=1),this[e+i]=(t/o>>0)-u&255;return e+r},Buffer.prototype.writeInt8=function(t,e,r){return t=+t,e=0|e,r||checkInt(this,t,e,1,127,-128),Buffer.TYPED_ARRAY_SUPPORT||(t=Math.floor(t)),t<0&&(t=255+t+1),this[e]=255&t,e+1},Buffer.prototype.writeInt16LE=function(t,e,r){return t=+t,e=0|e,r||checkInt(this,t,e,2,32767,-32768),Buffer.TYPED_ARRAY_SUPPORT?(this[e]=255&t,this[e+1]=t>>>8):objectWriteUInt16(this,t,e,!0),e+2},Buffer.prototype.writeInt16BE=function(t,e,r){return t=+t,e=0|e,r||checkInt(this,t,e,2,32767,-32768),Buffer.TYPED_ARRAY_SUPPORT?(this[e]=t>>>8,this[e+1]=255&t):objectWriteUInt16(this,t,e,!1),e+2},Buffer.prototype.writeInt32LE=function(t,e,r){return t=+t,e=0|e,r||checkInt(this,t,e,4,2147483647,-2147483648),Buffer.TYPED_ARRAY_SUPPORT?(this[e]=255&t,this[e+1]=t>>>8,this[e+2]=t>>>16,this[e+3]=t>>>24):objectWriteUInt32(this,t,e,!0),e+4},Buffer.prototype.writeInt32BE=function(t,e,r){return t=+t,e=0|e,r||checkInt(this,t,e,4,2147483647,-2147483648),t<0&&(t=4294967295+t+1),Buffer.TYPED_ARRAY_SUPPORT?(this[e]=t>>>24,this[e+1]=t>>>16,this[e+2]=t>>>8,this[e+3]=255&t):objectWriteUInt32(this,t,e,!1),e+4},Buffer.prototype.writeFloatLE=function(t,e,r){return writeFloat(this,t,e,!0,r)},Buffer.prototype.writeFloatBE=function(t,e,r){return writeFloat(this,t,e,!1,r)},Buffer.prototype.writeDoubleLE=function(t,e,r){return writeDouble(this,t,e,!0,r)},Buffer.prototype.writeDoubleBE=function(t,e,r){return writeDouble(this,t,e,!1,r)},Buffer.prototype.copy=function(t,e,r,n){if(r||(r=0),n||0===n||(n=this.length),e>=t.length&&(e=t.length),e||(e=0),n>0&&n<r&&(n=r),n===r)return 0;if(0===t.length||0===this.length)return 0;if(e<0)throw new RangeError("targetStart out of bounds");if(r<0||r>=this.length)throw new RangeError("sourceStart out of bounds");if(n<0)throw new RangeError("sourceEnd out of bounds");n>this.length&&(n=this.length),t.length-e<n-r&&(n=t.length-e+r);var f,i=n-r;if(this===t&&r<e&&e<n)for(f=i-1;f>=0;--f)t[f+e]=this[f+r];else if(i<1e3||!Buffer.TYPED_ARRAY_SUPPORT)for(f=0;f<i;++f)t[f+e]=this[f+r];else Uint8Array.prototype.set.call(t,this.subarray(r,r+i),e);return i},Buffer.prototype.fill=function(t,e,r,n){if("string"==typeof t){if("string"==typeof e?(n=e,e=0,r=this.length):"string"==typeof r&&(n=r,r=this.length),1===t.length){var f=t.charCodeAt(0);f<256&&(t=f)}if(void 0!==n&&"string"!=typeof n)throw new TypeError("encoding must be a string");if("string"==typeof n&&!Buffer.isEncoding(n))throw new TypeError("Unknown encoding: "+n)}else"number"==typeof t&&(t=255&t);if(e<0||this.length<e||this.length<r)throw new RangeError("Out of range index");if(r<=e)return this;e>>>=0,r=void 0===r?this.length:r>>>0,t||(t=0);var i;if("number"==typeof t)for(i=e;i<r;++i)this[i]=t;else{var o=Buffer.isBuffer(t)?t:utf8ToBytes(new Buffer(t,n).toString()),u=o.length;for(i=0;i<r-e;++i)this[i+e]=o[i%u]}return this};var INVALID_BASE64_RE=/[^+\/0-9A-Za-z-_]/g;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":34,"ieee754":35,"isarray":36}],34:[function(require,module,exports){
"use strict";function placeHoldersCount(o){var r=o.length;if(r%4>0)throw new Error("Invalid string. Length must be a multiple of 4");return"="===o[r-2]?2:"="===o[r-1]?1:0}function byteLength(o){return 3*o.length/4-placeHoldersCount(o)}function toByteArray(o){var r,e,t,u,n,p,a=o.length;n=placeHoldersCount(o),p=new Arr(3*a/4-n),t=n>0?a-4:a;var l=0;for(r=0,e=0;r<t;r+=4,e+=3)u=revLookup[o.charCodeAt(r)]<<18|revLookup[o.charCodeAt(r+1)]<<12|revLookup[o.charCodeAt(r+2)]<<6|revLookup[o.charCodeAt(r+3)],p[l++]=u>>16&255,p[l++]=u>>8&255,p[l++]=255&u;return 2===n?(u=revLookup[o.charCodeAt(r)]<<2|revLookup[o.charCodeAt(r+1)]>>4,p[l++]=255&u):1===n&&(u=revLookup[o.charCodeAt(r)]<<10|revLookup[o.charCodeAt(r+1)]<<4|revLookup[o.charCodeAt(r+2)]>>2,p[l++]=u>>8&255,p[l++]=255&u),p}function tripletToBase64(o){return lookup[o>>18&63]+lookup[o>>12&63]+lookup[o>>6&63]+lookup[63&o]}function encodeChunk(o,r,e){for(var t,u=[],n=r;n<e;n+=3)t=(o[n]<<16)+(o[n+1]<<8)+o[n+2],u.push(tripletToBase64(t));return u.join("")}function fromByteArray(o){for(var r,e=o.length,t=e%3,u="",n=[],p=16383,a=0,l=e-t;a<l;a+=p)n.push(encodeChunk(o,a,a+p>l?l:a+p));return 1===t?(r=o[e-1],u+=lookup[r>>2],u+=lookup[r<<4&63],u+="=="):2===t&&(r=(o[e-2]<<8)+o[e-1],u+=lookup[r>>10],u+=lookup[r>>4&63],u+=lookup[r<<2&63],u+="="),n.push(u),n.join("")}exports.byteLength=byteLength,exports.toByteArray=toByteArray,exports.fromByteArray=fromByteArray;for(var lookup=[],revLookup=[],Arr="undefined"!=typeof Uint8Array?Uint8Array:Array,code="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",i=0,len=code.length;i<len;++i)lookup[i]=code[i],revLookup[code.charCodeAt(i)]=i;revLookup["-".charCodeAt(0)]=62,revLookup["_".charCodeAt(0)]=63;
},{}],35:[function(require,module,exports){
exports.read=function(a,o,t,r,h){var M,p,w=8*h-r-1,f=(1<<w)-1,e=f>>1,i=-7,N=t?h-1:0,n=t?-1:1,s=a[o+N];for(N+=n,M=s&(1<<-i)-1,s>>=-i,i+=w;i>0;M=256*M+a[o+N],N+=n,i-=8);for(p=M&(1<<-i)-1,M>>=-i,i+=r;i>0;p=256*p+a[o+N],N+=n,i-=8);if(0===M)M=1-e;else{if(M===f)return p?NaN:(s?-1:1)*(1/0);p+=Math.pow(2,r),M-=e}return(s?-1:1)*p*Math.pow(2,M-r)},exports.write=function(a,o,t,r,h,M){var p,w,f,e=8*M-h-1,i=(1<<e)-1,N=i>>1,n=23===h?Math.pow(2,-24)-Math.pow(2,-77):0,s=r?0:M-1,u=r?1:-1,l=o<0||0===o&&1/o<0?1:0;for(o=Math.abs(o),isNaN(o)||o===1/0?(w=isNaN(o)?1:0,p=i):(p=Math.floor(Math.log(o)/Math.LN2),o*(f=Math.pow(2,-p))<1&&(p--,f*=2),o+=p+N>=1?n/f:n*Math.pow(2,1-N),o*f>=2&&(p++,f/=2),p+N>=i?(w=0,p=i):p+N>=1?(w=(o*f-1)*Math.pow(2,h),p+=N):(w=o*Math.pow(2,N-1)*Math.pow(2,h),p=0));h>=8;a[t+s]=255&w,s+=u,w/=256,h-=8);for(p=p<<h|w,e+=h;e>0;a[t+s]=255&p,s+=u,p/=256,e-=8);a[t+s-u]|=128*l};
},{}],36:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],37:[function(require,module,exports){
function EventEmitter(){this._events=this._events||{},this._maxListeners=this._maxListeners||void 0}function isFunction(e){return"function"==typeof e}function isNumber(e){return"number"==typeof e}function isObject(e){return"object"==typeof e&&null!==e}function isUndefined(e){return void 0===e}module.exports=EventEmitter,EventEmitter.EventEmitter=EventEmitter,EventEmitter.prototype._events=void 0,EventEmitter.prototype._maxListeners=void 0,EventEmitter.defaultMaxListeners=10,EventEmitter.prototype.setMaxListeners=function(e){if(!isNumber(e)||e<0||isNaN(e))throw TypeError("n must be a positive number");return this._maxListeners=e,this},EventEmitter.prototype.emit=function(e){var t,i,n,s,r,o;if(this._events||(this._events={}),"error"===e&&(!this._events.error||isObject(this._events.error)&&!this._events.error.length)){if(t=arguments[1],t instanceof Error)throw t;var h=new Error('Uncaught, unspecified "error" event. ('+t+")");throw h.context=t,h}if(i=this._events[e],isUndefined(i))return!1;if(isFunction(i))switch(arguments.length){case 1:i.call(this);break;case 2:i.call(this,arguments[1]);break;case 3:i.call(this,arguments[1],arguments[2]);break;default:s=Array.prototype.slice.call(arguments,1),i.apply(this,s)}else if(isObject(i))for(s=Array.prototype.slice.call(arguments,1),o=i.slice(),n=o.length,r=0;r<n;r++)o[r].apply(this,s);return!0},EventEmitter.prototype.addListener=function(e,t){var i;if(!isFunction(t))throw TypeError("listener must be a function");return this._events||(this._events={}),this._events.newListener&&this.emit("newListener",e,isFunction(t.listener)?t.listener:t),this._events[e]?isObject(this._events[e])?this._events[e].push(t):this._events[e]=[this._events[e],t]:this._events[e]=t,isObject(this._events[e])&&!this._events[e].warned&&(i=isUndefined(this._maxListeners)?EventEmitter.defaultMaxListeners:this._maxListeners,i&&i>0&&this._events[e].length>i&&(this._events[e].warned=!0,console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.",this._events[e].length),"function"==typeof console.trace&&console.trace())),this},EventEmitter.prototype.on=EventEmitter.prototype.addListener,EventEmitter.prototype.once=function(e,t){function i(){this.removeListener(e,i),n||(n=!0,t.apply(this,arguments))}if(!isFunction(t))throw TypeError("listener must be a function");var n=!1;return i.listener=t,this.on(e,i),this},EventEmitter.prototype.removeListener=function(e,t){var i,n,s,r;if(!isFunction(t))throw TypeError("listener must be a function");if(!this._events||!this._events[e])return this;if(i=this._events[e],s=i.length,n=-1,i===t||isFunction(i.listener)&&i.listener===t)delete this._events[e],this._events.removeListener&&this.emit("removeListener",e,t);else if(isObject(i)){for(r=s;r-- >0;)if(i[r]===t||i[r].listener&&i[r].listener===t){n=r;break}if(n<0)return this;1===i.length?(i.length=0,delete this._events[e]):i.splice(n,1),this._events.removeListener&&this.emit("removeListener",e,t)}return this},EventEmitter.prototype.removeAllListeners=function(e){var t,i;if(!this._events)return this;if(!this._events.removeListener)return 0===arguments.length?this._events={}:this._events[e]&&delete this._events[e],this;if(0===arguments.length){for(t in this._events)"removeListener"!==t&&this.removeAllListeners(t);return this.removeAllListeners("removeListener"),this._events={},this}if(i=this._events[e],isFunction(i))this.removeListener(e,i);else if(i)for(;i.length;)this.removeListener(e,i[i.length-1]);return delete this._events[e],this},EventEmitter.prototype.listeners=function(e){var t;return t=this._events&&this._events[e]?isFunction(this._events[e])?[this._events[e]]:this._events[e].slice():[]},EventEmitter.prototype.listenerCount=function(e){if(this._events){var t=this._events[e];if(isFunction(t))return 1;if(t)return t.length}return 0},EventEmitter.listenerCount=function(e,t){return e.listenerCount(t)};
},{}],38:[function(require,module,exports){
var http=require("http"),https=module.exports;for(var key in http)http.hasOwnProperty(key)&&(https[key]=http[key]);https.request=function(t,e){return t||(t={}),t.scheme="https",t.protocol="https:",http.request.call(this,t,e)};
},{"http":63}],39:[function(require,module,exports){
function isBuffer(f){return!!f.constructor&&"function"==typeof f.constructor.isBuffer&&f.constructor.isBuffer(f)}function isSlowBuffer(f){return"function"==typeof f.readFloatLE&&"function"==typeof f.slice&&isBuffer(f.slice(0,0))}module.exports=function(f){return null!=f&&(isBuffer(f)||isSlowBuffer(f)||!!f._isBuffer)};
},{}],40:[function(require,module,exports){
(function (process){
function normalizeArray(r,t){for(var e=0,n=r.length-1;n>=0;n--){var s=r[n];"."===s?r.splice(n,1):".."===s?(r.splice(n,1),e++):e&&(r.splice(n,1),e--)}if(t)for(;e--;e)r.unshift("..");return r}function filter(r,t){if(r.filter)return r.filter(t);for(var e=[],n=0;n<r.length;n++)t(r[n],n,r)&&e.push(r[n]);return e}var splitPathRe=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/,splitPath=function(r){return splitPathRe.exec(r).slice(1)};exports.resolve=function(){for(var r="",t=!1,e=arguments.length-1;e>=-1&&!t;e--){var n=e>=0?arguments[e]:process.cwd();if("string"!=typeof n)throw new TypeError("Arguments to path.resolve must be strings");n&&(r=n+"/"+r,t="/"===n.charAt(0))}return r=normalizeArray(filter(r.split("/"),function(r){return!!r}),!t).join("/"),(t?"/":"")+r||"."},exports.normalize=function(r){var t=exports.isAbsolute(r),e="/"===substr(r,-1);return r=normalizeArray(filter(r.split("/"),function(r){return!!r}),!t).join("/"),r||t||(r="."),r&&e&&(r+="/"),(t?"/":"")+r},exports.isAbsolute=function(r){return"/"===r.charAt(0)},exports.join=function(){var r=Array.prototype.slice.call(arguments,0);return exports.normalize(filter(r,function(r,t){if("string"!=typeof r)throw new TypeError("Arguments to path.join must be strings");return r}).join("/"))},exports.relative=function(r,t){function e(r){for(var t=0;t<r.length&&""===r[t];t++);for(var e=r.length-1;e>=0&&""===r[e];e--);return t>e?[]:r.slice(t,e-t+1)}r=exports.resolve(r).substr(1),t=exports.resolve(t).substr(1);for(var n=e(r.split("/")),s=e(t.split("/")),i=Math.min(n.length,s.length),o=i,u=0;u<i;u++)if(n[u]!==s[u]){o=u;break}for(var l=[],u=o;u<n.length;u++)l.push("..");return l=l.concat(s.slice(o)),l.join("/")},exports.sep="/",exports.delimiter=":",exports.dirname=function(r){var t=splitPath(r),e=t[0],n=t[1];return e||n?(n&&(n=n.substr(0,n.length-1)),e+n):"."},exports.basename=function(r,t){var e=splitPath(r)[2];return t&&e.substr(-1*t.length)===t&&(e=e.substr(0,e.length-t.length)),e},exports.extname=function(r){return splitPath(r)[3]};var substr="b"==="ab".substr(-1)?function(r,t,e){return r.substr(t,e)}:function(r,t,e){return t<0&&(t=r.length+t),r.substr(t,e)};
}).call(this,require('_process'))
},{"_process":41}],41:[function(require,module,exports){
function defaultSetTimout(){throw new Error("setTimeout has not been defined")}function defaultClearTimeout(){throw new Error("clearTimeout has not been defined")}function runTimeout(e){if(cachedSetTimeout===setTimeout)return setTimeout(e,0);if((cachedSetTimeout===defaultSetTimout||!cachedSetTimeout)&&setTimeout)return cachedSetTimeout=setTimeout,setTimeout(e,0);try{return cachedSetTimeout(e,0)}catch(t){try{return cachedSetTimeout.call(null,e,0)}catch(t){return cachedSetTimeout.call(this,e,0)}}}function runClearTimeout(e){if(cachedClearTimeout===clearTimeout)return clearTimeout(e);if((cachedClearTimeout===defaultClearTimeout||!cachedClearTimeout)&&clearTimeout)return cachedClearTimeout=clearTimeout,clearTimeout(e);try{return cachedClearTimeout(e)}catch(t){try{return cachedClearTimeout.call(null,e)}catch(t){return cachedClearTimeout.call(this,e)}}}function cleanUpNextTick(){draining&&currentQueue&&(draining=!1,currentQueue.length?queue=currentQueue.concat(queue):queueIndex=-1,queue.length&&drainQueue())}function drainQueue(){if(!draining){var e=runTimeout(cleanUpNextTick);draining=!0;for(var t=queue.length;t;){for(currentQueue=queue,queue=[];++queueIndex<t;)currentQueue&&currentQueue[queueIndex].run();queueIndex=-1,t=queue.length}currentQueue=null,draining=!1,runClearTimeout(e)}}function Item(e,t){this.fun=e,this.array=t}function noop(){}var process=module.exports={},cachedSetTimeout,cachedClearTimeout;!function(){try{cachedSetTimeout="function"==typeof setTimeout?setTimeout:defaultSetTimout}catch(e){cachedSetTimeout=defaultSetTimout}try{cachedClearTimeout="function"==typeof clearTimeout?clearTimeout:defaultClearTimeout}catch(e){cachedClearTimeout=defaultClearTimeout}}();var queue=[],draining=!1,currentQueue,queueIndex=-1;process.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var u=1;u<arguments.length;u++)t[u-1]=arguments[u];queue.push(new Item(e,t)),1!==queue.length||draining||runTimeout(drainQueue)},Item.prototype.run=function(){this.fun.apply(null,this.array)},process.title="browser",process.browser=!0,process.env={},process.argv=[],process.version="",process.versions={},process.on=noop,process.addListener=noop,process.once=noop,process.off=noop,process.removeListener=noop,process.removeAllListeners=noop,process.emit=noop,process.binding=function(e){throw new Error("process.binding is not supported")},process.cwd=function(){return"/"},process.chdir=function(e){throw new Error("process.chdir is not supported")},process.umask=function(){return 0};
},{}],42:[function(require,module,exports){
(function (global){
!function(e){function o(e){throw new RangeError(T[e])}function n(e,o){for(var n=e.length,r=[];n--;)r[n]=o(e[n]);return r}function r(e,o){var r=e.split("@"),t="";r.length>1&&(t=r[0]+"@",e=r[1]),e=e.replace(S,".");var u=e.split("."),i=n(u,o).join(".");return t+i}function t(e){for(var o,n,r=[],t=0,u=e.length;t<u;)o=e.charCodeAt(t++),o>=55296&&o<=56319&&t<u?(n=e.charCodeAt(t++),56320==(64512&n)?r.push(((1023&o)<<10)+(1023&n)+65536):(r.push(o),t--)):r.push(o);return r}function u(e){return n(e,function(e){var o="";return e>65535&&(e-=65536,o+=P(e>>>10&1023|55296),e=56320|1023&e),o+=P(e)}).join("")}function i(e){return e-48<10?e-22:e-65<26?e-65:e-97<26?e-97:b}function f(e,o){return e+22+75*(e<26)-((0!=o)<<5)}function c(e,o,n){var r=0;for(e=n?M(e/j):e>>1,e+=M(e/o);e>L*C>>1;r+=b)e=M(e/L);return M(r+(L+1)*e/(e+m))}function l(e){var n,r,t,f,l,s,d,a,p,h,v=[],g=e.length,w=0,m=I,j=A;for(r=e.lastIndexOf(E),r<0&&(r=0),t=0;t<r;++t)e.charCodeAt(t)>=128&&o("not-basic"),v.push(e.charCodeAt(t));for(f=r>0?r+1:0;f<g;){for(l=w,s=1,d=b;f>=g&&o("invalid-input"),a=i(e.charCodeAt(f++)),(a>=b||a>M((x-w)/s))&&o("overflow"),w+=a*s,p=d<=j?y:d>=j+C?C:d-j,!(a<p);d+=b)h=b-p,s>M(x/h)&&o("overflow"),s*=h;n=v.length+1,j=c(w-l,n,0==l),M(w/n)>x-m&&o("overflow"),m+=M(w/n),w%=n,v.splice(w++,0,m)}return u(v)}function s(e){var n,r,u,i,l,s,d,a,p,h,v,g,w,m,j,F=[];for(e=t(e),g=e.length,n=I,r=0,l=A,s=0;s<g;++s)v=e[s],v<128&&F.push(P(v));for(u=i=F.length,i&&F.push(E);u<g;){for(d=x,s=0;s<g;++s)v=e[s],v>=n&&v<d&&(d=v);for(w=u+1,d-n>M((x-r)/w)&&o("overflow"),r+=(d-n)*w,n=d,s=0;s<g;++s)if(v=e[s],v<n&&++r>x&&o("overflow"),v==n){for(a=r,p=b;h=p<=l?y:p>=l+C?C:p-l,!(a<h);p+=b)j=a-h,m=b-h,F.push(P(f(h+j%m,0))),a=M(j/m);F.push(P(f(a,0))),l=c(r,w,u==i),r=0,++u}++r,++n}return F.join("")}function d(e){return r(e,function(e){return F.test(e)?l(e.slice(4).toLowerCase()):e})}function a(e){return r(e,function(e){return O.test(e)?"xn--"+s(e):e})}var p="object"==typeof exports&&exports&&!exports.nodeType&&exports,h="object"==typeof module&&module&&!module.nodeType&&module,v="object"==typeof global&&global;v.global!==v&&v.window!==v&&v.self!==v||(e=v);var g,w,x=2147483647,b=36,y=1,C=26,m=38,j=700,A=72,I=128,E="-",F=/^xn--/,O=/[^\x20-\x7E]/,S=/[\x2E\u3002\uFF0E\uFF61]/g,T={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},L=b-y,M=Math.floor,P=String.fromCharCode;if(g={version:"1.4.1",ucs2:{decode:t,encode:u},decode:l,encode:s,toASCII:a,toUnicode:d},"function"==typeof define&&"object"==typeof define.amd&&define.amd)define("punycode",function(){return g});else if(p&&h)if(module.exports==p)h.exports=g;else for(w in g)g.hasOwnProperty(w)&&(p[w]=g[w]);else e.punycode=g}(this);
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],43:[function(require,module,exports){
"use strict";function hasOwnProperty(r,e){return Object.prototype.hasOwnProperty.call(r,e)}module.exports=function(r,e,t,n){e=e||"&",t=t||"=";var o={};if("string"!=typeof r||0===r.length)return o;var a=/\+/g;r=r.split(e);var s=1e3;n&&"number"==typeof n.maxKeys&&(s=n.maxKeys);var p=r.length;s>0&&p>s&&(p=s);for(var y=0;y<p;++y){var u,c,i,l,f=r[y].replace(a,"%20"),v=f.indexOf(t);v>=0?(u=f.substr(0,v),c=f.substr(v+1)):(u=f,c=""),i=decodeURIComponent(u),l=decodeURIComponent(c),hasOwnProperty(o,i)?isArray(o[i])?o[i].push(l):o[i]=[o[i],l]:o[i]=l}return o};var isArray=Array.isArray||function(r){return"[object Array]"===Object.prototype.toString.call(r)};
},{}],44:[function(require,module,exports){
"use strict";function map(r,e){if(r.map)return r.map(e);for(var t=[],n=0;n<r.length;n++)t.push(e(r[n],n));return t}var stringifyPrimitive=function(r){switch(typeof r){case"string":return r;case"boolean":return r?"true":"false";case"number":return isFinite(r)?r:"";default:return""}};module.exports=function(r,e,t,n){return e=e||"&",t=t||"=",null===r&&(r=void 0),"object"==typeof r?map(objectKeys(r),function(n){var i=encodeURIComponent(stringifyPrimitive(n))+t;return isArray(r[n])?map(r[n],function(r){return i+encodeURIComponent(stringifyPrimitive(r))}).join(e):i+encodeURIComponent(stringifyPrimitive(r[n]))}).join(e):n?encodeURIComponent(stringifyPrimitive(n))+t+encodeURIComponent(stringifyPrimitive(r)):""};var isArray=Array.isArray||function(r){return"[object Array]"===Object.prototype.toString.call(r)},objectKeys=Object.keys||function(r){var e=[];for(var t in r)Object.prototype.hasOwnProperty.call(r,t)&&e.push(t);return e};
},{}],45:[function(require,module,exports){
"use strict";exports.decode=exports.parse=require("./decode"),exports.encode=exports.stringify=require("./encode");
},{"./decode":43,"./encode":44}],46:[function(require,module,exports){
module.exports=require("./lib/_stream_duplex.js");
},{"./lib/_stream_duplex.js":47}],47:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"./_stream_readable":49,"./_stream_writable":51,"core-util-is":54,"dup":15,"inherits":77,"process-nextick-args":56}],48:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"./_stream_transform":50,"core-util-is":54,"dup":16,"inherits":77}],49:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"./_stream_duplex":47,"./internal/streams/BufferList":52,"_process":41,"buffer":33,"buffer-shims":53,"core-util-is":54,"dup":17,"events":37,"inherits":77,"isarray":55,"process-nextick-args":56,"stream":62,"string_decoder/":69,"util":32}],50:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"./_stream_duplex":47,"core-util-is":54,"dup":18,"inherits":77}],51:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"./_stream_duplex":47,"_process":41,"buffer":33,"buffer-shims":53,"core-util-is":54,"dup":19,"events":37,"inherits":77,"process-nextick-args":56,"stream":62,"util-deprecate":57}],52:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"buffer":33,"buffer-shims":53,"dup":20}],53:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"buffer":33,"dup":21}],54:[function(require,module,exports){
(function (Buffer){
function isArray(r){return Array.isArray?Array.isArray(r):"[object Array]"===objectToString(r)}function isBoolean(r){return"boolean"==typeof r}function isNull(r){return null===r}function isNullOrUndefined(r){return null==r}function isNumber(r){return"number"==typeof r}function isString(r){return"string"==typeof r}function isSymbol(r){return"symbol"==typeof r}function isUndefined(r){return void 0===r}function isRegExp(r){return"[object RegExp]"===objectToString(r)}function isObject(r){return"object"==typeof r&&null!==r}function isDate(r){return"[object Date]"===objectToString(r)}function isError(r){return"[object Error]"===objectToString(r)||r instanceof Error}function isFunction(r){return"function"==typeof r}function isPrimitive(r){return null===r||"boolean"==typeof r||"number"==typeof r||"string"==typeof r||"symbol"==typeof r||"undefined"==typeof r}function objectToString(r){return Object.prototype.toString.call(r)}exports.isArray=isArray,exports.isBoolean=isBoolean,exports.isNull=isNull,exports.isNullOrUndefined=isNullOrUndefined,exports.isNumber=isNumber,exports.isString=isString,exports.isSymbol=isSymbol,exports.isUndefined=isUndefined,exports.isRegExp=isRegExp,exports.isObject=isObject,exports.isDate=isDate,exports.isError=isError,exports.isFunction=isFunction,exports.isPrimitive=isPrimitive,exports.isBuffer=Buffer.isBuffer;
}).call(this,{"isBuffer":require("../../../../insert-module-globals/node_modules/is-buffer/index.js")})
},{"../../../../insert-module-globals/node_modules/is-buffer/index.js":39}],55:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],56:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"_process":41,"dup":24}],57:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26}],58:[function(require,module,exports){
module.exports=require("./lib/_stream_passthrough.js");
},{"./lib/_stream_passthrough.js":48}],59:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"./lib/_stream_duplex.js":47,"./lib/_stream_passthrough.js":48,"./lib/_stream_readable.js":49,"./lib/_stream_transform.js":50,"./lib/_stream_writable.js":51,"_process":41,"dup":27,"stream":62}],60:[function(require,module,exports){
module.exports=require("./lib/_stream_transform.js");
},{"./lib/_stream_transform.js":50}],61:[function(require,module,exports){
module.exports=require("./lib/_stream_writable.js");
},{"./lib/_stream_writable.js":51}],62:[function(require,module,exports){
function Stream(){EE.call(this)}module.exports=Stream;var EE=require("events").EventEmitter,inherits=require("inherits");inherits(Stream,EE),Stream.Readable=require("readable-stream/readable.js"),Stream.Writable=require("readable-stream/writable.js"),Stream.Duplex=require("readable-stream/duplex.js"),Stream.Transform=require("readable-stream/transform.js"),Stream.PassThrough=require("readable-stream/passthrough.js"),Stream.Stream=Stream,Stream.prototype.pipe=function(e,r){function t(r){e.writable&&!1===e.write(r)&&m.pause&&m.pause()}function n(){m.readable&&m.resume&&m.resume()}function a(){u||(u=!0,e.end())}function o(){u||(u=!0,"function"==typeof e.destroy&&e.destroy())}function i(e){if(s(),0===EE.listenerCount(this,"error"))throw e}function s(){m.removeListener("data",t),e.removeListener("drain",n),m.removeListener("end",a),m.removeListener("close",o),m.removeListener("error",i),e.removeListener("error",i),m.removeListener("end",s),m.removeListener("close",s),e.removeListener("close",s)}var m=this;m.on("data",t),e.on("drain",n),e._isStdio||r&&r.end===!1||(m.on("end",a),m.on("close",o));var u=!1;return m.on("error",i),e.on("error",i),m.on("end",s),m.on("close",s),e.on("close",s),e.emit("pipe",m),e};
},{"events":37,"inherits":77,"readable-stream/duplex.js":46,"readable-stream/passthrough.js":58,"readable-stream/readable.js":59,"readable-stream/transform.js":60,"readable-stream/writable.js":61}],63:[function(require,module,exports){
(function (global){
var ClientRequest=require("./lib/request"),extend=require("xtend"),statusCodes=require("builtin-status-codes"),url=require("url"),http=exports;http.request=function(t,e){t="string"==typeof t?url.parse(t):extend(t);var r=global.location.protocol.search(/^https?:$/)===-1?"http:":"",s=t.protocol||r,o=t.hostname||t.host,n=t.port,u=t.path||"/";o&&o.indexOf(":")!==-1&&(o="["+o+"]"),t.url=(o?s+"//"+o:"")+(n?":"+n:"")+u,t.method=(t.method||"GET").toUpperCase(),t.headers=t.headers||{};var C=new ClientRequest(t);return e&&C.on("response",e),C},http.get=function(t,e){var r=http.request(t,e);return r.end(),r},http.Agent=function(){},http.Agent.defaultMaxSockets=4,http.STATUS_CODES=statusCodes,http.METHODS=["CHECKOUT","CONNECT","COPY","DELETE","GET","HEAD","LOCK","M-SEARCH","MERGE","MKACTIVITY","MKCOL","MOVE","NOTIFY","OPTIONS","PATCH","POST","PROPFIND","PROPPATCH","PURGE","PUT","REPORT","SEARCH","SUBSCRIBE","TRACE","UNLOCK","UNSUBSCRIBE"];
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./lib/request":65,"builtin-status-codes":67,"url":70,"xtend":72}],64:[function(require,module,exports){
(function (global){
function checkTypeSupport(r){try{return xhr.responseType=r,xhr.responseType===r}catch(r){}return!1}function isFunction(r){return"function"==typeof r}exports.fetch=isFunction(global.fetch)&&isFunction(global.ReadableStream),exports.blobConstructor=!1;try{new Blob([new ArrayBuffer(1)]),exports.blobConstructor=!0}catch(r){}var xhr=new global.XMLHttpRequest;xhr.open("GET",global.location.host?"/":"https://example.com");var haveArrayBuffer="undefined"!=typeof global.ArrayBuffer,haveSlice=haveArrayBuffer&&isFunction(global.ArrayBuffer.prototype.slice);exports.arraybuffer=haveArrayBuffer&&checkTypeSupport("arraybuffer"),exports.msstream=!exports.fetch&&haveSlice&&checkTypeSupport("ms-stream"),exports.mozchunkedarraybuffer=!exports.fetch&&haveArrayBuffer&&checkTypeSupport("moz-chunked-arraybuffer"),exports.overrideMimeType=isFunction(xhr.overrideMimeType),exports.vbArray=isFunction(global.VBArray),xhr=null;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],65:[function(require,module,exports){
(function (process,global,Buffer){
function decideMode(e,t){return capability.fetch&&t?"fetch":capability.mozchunkedarraybuffer?"moz-chunked-arraybuffer":capability.msstream?"ms-stream":capability.arraybuffer&&e?"arraybuffer":capability.vbArray&&e?"text:vbarray":"text"}function statusValid(e){try{var t=e.status;return null!==t&&0!==t}catch(e){return!1}}var capability=require("./capability"),inherits=require("inherits"),response=require("./response"),stream=require("readable-stream"),toArrayBuffer=require("to-arraybuffer"),IncomingMessage=response.IncomingMessage,rStates=response.readyStates,ClientRequest=module.exports=function(e){var t=this;stream.Writable.call(t),t._opts=e,t._body=[],t._headers={},e.auth&&t.setHeader("Authorization","Basic "+new Buffer(e.auth).toString("base64")),Object.keys(e.headers).forEach(function(r){t.setHeader(r,e.headers[r])});var r,o=!0;if("disable-fetch"===e.mode)o=!1,r=!0;else if("prefer-streaming"===e.mode)r=!1;else if("allow-wrong-content-type"===e.mode)r=!capability.overrideMimeType;else{if(e.mode&&"default"!==e.mode&&"prefer-fast"!==e.mode)throw new Error("Invalid value for opts.mode");r=!0}t._mode=decideMode(r,o),t.on("finish",function(){t._onFinish()})};inherits(ClientRequest,stream.Writable),ClientRequest.prototype.setHeader=function(e,t){var r=this,o=e.toLowerCase();unsafeHeaders.indexOf(o)===-1&&(r._headers[o]={name:e,value:t})},ClientRequest.prototype.getHeader=function(e){var t=this;return t._headers[e.toLowerCase()].value},ClientRequest.prototype.removeHeader=function(e){var t=this;delete t._headers[e.toLowerCase()]},ClientRequest.prototype._onFinish=function(){var e=this;if(!e._destroyed){var t,r=e._opts,o=e._headers;if("POST"!==r.method&&"PUT"!==r.method&&"PATCH"!==r.method||(t=capability.blobConstructor?new global.Blob(e._body.map(function(e){return toArrayBuffer(e)}),{type:(o["content-type"]||{}).value||""}):Buffer.concat(e._body).toString()),"fetch"===e._mode){var n=Object.keys(o).map(function(e){return[o[e].name,o[e].value]});global.fetch(e._opts.url,{method:e._opts.method,headers:n,body:t,mode:"cors",credentials:r.withCredentials?"include":"same-origin"}).then(function(t){e._fetchResponse=t,e._connect()},function(t){e.emit("error",t)})}else{var s=e._xhr=new global.XMLHttpRequest;try{s.open(e._opts.method,e._opts.url,!0)}catch(t){return void process.nextTick(function(){e.emit("error",t)})}"responseType"in s&&(s.responseType=e._mode.split(":")[0]),"withCredentials"in s&&(s.withCredentials=!!r.withCredentials),"text"===e._mode&&"overrideMimeType"in s&&s.overrideMimeType("text/plain; charset=x-user-defined"),Object.keys(o).forEach(function(e){s.setRequestHeader(o[e].name,o[e].value)}),e._response=null,s.onreadystatechange=function(){switch(s.readyState){case rStates.LOADING:case rStates.DONE:e._onXHRProgress()}},"moz-chunked-arraybuffer"===e._mode&&(s.onprogress=function(){e._onXHRProgress()}),s.onerror=function(){e._destroyed||e.emit("error",new Error("XHR error"))};try{s.send(t)}catch(t){return void process.nextTick(function(){e.emit("error",t)})}}}},ClientRequest.prototype._onXHRProgress=function(){var e=this;statusValid(e._xhr)&&!e._destroyed&&(e._response||e._connect(),e._response._onXHRProgress())},ClientRequest.prototype._connect=function(){var e=this;e._destroyed||(e._response=new IncomingMessage(e._xhr,e._fetchResponse,e._mode),e.emit("response",e._response))},ClientRequest.prototype._write=function(e,t,r){var o=this;o._body.push(e),r()},ClientRequest.prototype.abort=ClientRequest.prototype.destroy=function(){var e=this;e._destroyed=!0,e._response&&(e._response._destroyed=!0),e._xhr&&e._xhr.abort()},ClientRequest.prototype.end=function(e,t,r){var o=this;"function"==typeof e&&(r=e,e=void 0),stream.Writable.prototype.end.call(o,e,t,r)},ClientRequest.prototype.flushHeaders=function(){},ClientRequest.prototype.setTimeout=function(){},ClientRequest.prototype.setNoDelay=function(){},ClientRequest.prototype.setSocketKeepAlive=function(){};var unsafeHeaders=["accept-charset","accept-encoding","access-control-request-headers","access-control-request-method","connection","content-length","cookie","cookie2","date","dnt","expect","host","keep-alive","origin","referer","te","trailer","transfer-encoding","upgrade","user-agent","via"];
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"./capability":64,"./response":66,"_process":41,"buffer":33,"inherits":77,"readable-stream":59,"to-arraybuffer":68}],66:[function(require,module,exports){
(function (process,global,Buffer){
var capability=require("./capability"),inherits=require("inherits"),stream=require("readable-stream"),rStates=exports.readyStates={UNSENT:0,OPENED:1,HEADERS_RECEIVED:2,LOADING:3,DONE:4},IncomingMessage=exports.IncomingMessage=function(e,r,s){function a(){u.read().then(function(e){if(!t._destroyed){if(e.done)return void t.push(null);t.push(new Buffer(e.value)),a()}})}var t=this;if(stream.Readable.call(t),t._mode=s,t.headers={},t.rawHeaders=[],t.trailers={},t.rawTrailers=[],t.on("end",function(){process.nextTick(function(){t.emit("close")})}),"fetch"===s){t._fetchResponse=r,t.url=r.url,t.statusCode=r.status,t.statusMessage=r.statusText;for(var n,o,i=r.headers[Symbol.iterator]();n=(o=i.next()).value,!o.done;)t.headers[n[0].toLowerCase()]=n[1],t.rawHeaders.push(n[0],n[1]);var u=r.body.getReader();a()}else{t._xhr=e,t._pos=0,t.url=e.responseURL,t.statusCode=e.status,t.statusMessage=e.statusText;var h=e.getAllResponseHeaders().split(/\r?\n/);if(h.forEach(function(e){var r=e.match(/^([^:]+):\s*(.*)/);if(r){var s=r[1].toLowerCase();"set-cookie"===s?(void 0===t.headers[s]&&(t.headers[s]=[]),t.headers[s].push(r[2])):void 0!==t.headers[s]?t.headers[s]+=", "+r[2]:t.headers[s]=r[2],t.rawHeaders.push(r[1],r[2])}}),t._charset="x-user-defined",!capability.overrideMimeType){var d=t.rawHeaders["mime-type"];if(d){var f=d.match(/;\s*charset=([^;])(;|$)/);f&&(t._charset=f[1].toLowerCase())}t._charset||(t._charset="utf-8")}}};inherits(IncomingMessage,stream.Readable),IncomingMessage.prototype._read=function(){},IncomingMessage.prototype._onXHRProgress=function(){var e=this,r=e._xhr,s=null;switch(e._mode){case"text:vbarray":if(r.readyState!==rStates.DONE)break;try{s=new global.VBArray(r.responseBody).toArray()}catch(e){}if(null!==s){e.push(new Buffer(s));break}case"text":try{s=r.responseText}catch(r){e._mode="text:vbarray";break}if(s.length>e._pos){var a=s.substr(e._pos);if("x-user-defined"===e._charset){for(var t=new Buffer(a.length),n=0;n<a.length;n++)t[n]=255&a.charCodeAt(n);e.push(t)}else e.push(a,e._charset);e._pos=s.length}break;case"arraybuffer":if(r.readyState!==rStates.DONE||!r.response)break;s=r.response,e.push(new Buffer(new Uint8Array(s)));break;case"moz-chunked-arraybuffer":if(s=r.response,r.readyState!==rStates.LOADING||!s)break;e.push(new Buffer(new Uint8Array(s)));break;case"ms-stream":if(s=r.response,r.readyState!==rStates.LOADING)break;var o=new global.MSStreamReader;o.onprogress=function(){o.result.byteLength>e._pos&&(e.push(new Buffer(new Uint8Array(o.result.slice(e._pos)))),e._pos=o.result.byteLength)},o.onload=function(){e.push(null)},o.readAsArrayBuffer(s)}e._xhr.readyState===rStates.DONE&&"ms-stream"!==e._mode&&e.push(null)};
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"./capability":64,"_process":41,"buffer":33,"inherits":77,"readable-stream":59}],67:[function(require,module,exports){
module.exports={100:"Continue",101:"Switching Protocols",102:"Processing",200:"OK",201:"Created",202:"Accepted",203:"Non-Authoritative Information",204:"No Content",205:"Reset Content",206:"Partial Content",207:"Multi-Status",208:"Already Reported",226:"IM Used",300:"Multiple Choices",301:"Moved Permanently",302:"Found",303:"See Other",304:"Not Modified",305:"Use Proxy",307:"Temporary Redirect",308:"Permanent Redirect",400:"Bad Request",401:"Unauthorized",402:"Payment Required",403:"Forbidden",404:"Not Found",405:"Method Not Allowed",406:"Not Acceptable",407:"Proxy Authentication Required",408:"Request Timeout",409:"Conflict",410:"Gone",411:"Length Required",412:"Precondition Failed",413:"Payload Too Large",414:"URI Too Long",415:"Unsupported Media Type",416:"Range Not Satisfiable",417:"Expectation Failed",418:"I'm a teapot",421:"Misdirected Request",422:"Unprocessable Entity",423:"Locked",424:"Failed Dependency",425:"Unordered Collection",426:"Upgrade Required",428:"Precondition Required",429:"Too Many Requests",431:"Request Header Fields Too Large",500:"Internal Server Error",501:"Not Implemented",502:"Bad Gateway",503:"Service Unavailable",504:"Gateway Timeout",505:"HTTP Version Not Supported",506:"Variant Also Negotiates",507:"Insufficient Storage",508:"Loop Detected",509:"Bandwidth Limit Exceeded",510:"Not Extended",511:"Network Authentication Required"};
},{}],68:[function(require,module,exports){
var Buffer=require("buffer").Buffer;module.exports=function(e){if(e instanceof Uint8Array){if(0===e.byteOffset&&e.byteLength===e.buffer.byteLength)return e.buffer;if("function"==typeof e.buffer.slice)return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength)}if(Buffer.isBuffer(e)){for(var f=new Uint8Array(e.length),r=e.length,t=0;t<r;t++)f[t]=e[t];return f.buffer}throw new Error("Argument must be a Buffer")};
},{"buffer":33}],69:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"buffer":33,"dup":25}],70:[function(require,module,exports){
"use strict";function Url(){this.protocol=null,this.slashes=null,this.auth=null,this.host=null,this.port=null,this.hostname=null,this.hash=null,this.search=null,this.query=null,this.pathname=null,this.path=null,this.href=null}function urlParse(t,s,e){if(t&&util.isObject(t)&&t instanceof Url)return t;var h=new Url;return h.parse(t,s,e),h}function urlFormat(t){return util.isString(t)&&(t=urlParse(t)),t instanceof Url?t.format():Url.prototype.format.call(t)}function urlResolve(t,s){return urlParse(t,!1,!0).resolve(s)}function urlResolveObject(t,s){return t?urlParse(t,!1,!0).resolveObject(s):s}var punycode=require("punycode"),util=require("./util");exports.parse=urlParse,exports.resolve=urlResolve,exports.resolveObject=urlResolveObject,exports.format=urlFormat,exports.Url=Url;var protocolPattern=/^([a-z0-9.+-]+:)/i,portPattern=/:[0-9]*$/,simplePathPattern=/^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,delims=["<",">",'"',"`"," ","\r","\n","\t"],unwise=["{","}","|","\\","^","`"].concat(delims),autoEscape=["'"].concat(unwise),nonHostChars=["%","/","?",";","#"].concat(autoEscape),hostEndingChars=["/","?","#"],hostnameMaxLen=255,hostnamePartPattern=/^[+a-z0-9A-Z_-]{0,63}$/,hostnamePartStart=/^([+a-z0-9A-Z_-]{0,63})(.*)$/,unsafeProtocol={javascript:!0,"javascript:":!0},hostlessProtocol={javascript:!0,"javascript:":!0},slashedProtocol={http:!0,https:!0,ftp:!0,gopher:!0,file:!0,"http:":!0,"https:":!0,"ftp:":!0,"gopher:":!0,"file:":!0},querystring=require("querystring");Url.prototype.parse=function(t,s,e){if(!util.isString(t))throw new TypeError("Parameter 'url' must be a string, not "+typeof t);var h=t.indexOf("?"),r=h!==-1&&h<t.indexOf("#")?"?":"#",a=t.split(r),o=/\\/g;a[0]=a[0].replace(o,"/"),t=a.join(r);var n=t;if(n=n.trim(),!e&&1===t.split("#").length){var i=simplePathPattern.exec(n);if(i)return this.path=n,this.href=n,this.pathname=i[1],i[2]?(this.search=i[2],s?this.query=querystring.parse(this.search.substr(1)):this.query=this.search.substr(1)):s&&(this.search="",this.query={}),this}var l=protocolPattern.exec(n);if(l){l=l[0];var u=l.toLowerCase();this.protocol=u,n=n.substr(l.length)}if(e||l||n.match(/^\/\/[^@\/]+@[^@\/]+/)){var p="//"===n.substr(0,2);!p||l&&hostlessProtocol[l]||(n=n.substr(2),this.slashes=!0)}if(!hostlessProtocol[l]&&(p||l&&!slashedProtocol[l])){for(var c=-1,f=0;f<hostEndingChars.length;f++){var m=n.indexOf(hostEndingChars[f]);m!==-1&&(c===-1||m<c)&&(c=m)}var v,g;g=c===-1?n.lastIndexOf("@"):n.lastIndexOf("@",c),g!==-1&&(v=n.slice(0,g),n=n.slice(g+1),this.auth=decodeURIComponent(v)),c=-1;for(var f=0;f<nonHostChars.length;f++){var m=n.indexOf(nonHostChars[f]);m!==-1&&(c===-1||m<c)&&(c=m)}c===-1&&(c=n.length),this.host=n.slice(0,c),n=n.slice(c),this.parseHost(),this.hostname=this.hostname||"";var y="["===this.hostname[0]&&"]"===this.hostname[this.hostname.length-1];if(!y)for(var P=this.hostname.split(/\./),f=0,d=P.length;f<d;f++){var q=P[f];if(q&&!q.match(hostnamePartPattern)){for(var b="",O=0,j=q.length;O<j;O++)b+=q.charCodeAt(O)>127?"x":q[O];if(!b.match(hostnamePartPattern)){var x=P.slice(0,f),U=P.slice(f+1),C=q.match(hostnamePartStart);C&&(x.push(C[1]),U.unshift(C[2])),U.length&&(n="/"+U.join(".")+n),this.hostname=x.join(".");break}}}this.hostname.length>hostnameMaxLen?this.hostname="":this.hostname=this.hostname.toLowerCase(),y||(this.hostname=punycode.toASCII(this.hostname));var A=this.port?":"+this.port:"",w=this.hostname||"";this.host=w+A,this.href+=this.host,y&&(this.hostname=this.hostname.substr(1,this.hostname.length-2),"/"!==n[0]&&(n="/"+n))}if(!unsafeProtocol[u])for(var f=0,d=autoEscape.length;f<d;f++){var E=autoEscape[f];if(n.indexOf(E)!==-1){var I=encodeURIComponent(E);I===E&&(I=escape(E)),n=n.split(E).join(I)}}var R=n.indexOf("#");R!==-1&&(this.hash=n.substr(R),n=n.slice(0,R));var S=n.indexOf("?");if(S!==-1?(this.search=n.substr(S),this.query=n.substr(S+1),s&&(this.query=querystring.parse(this.query)),n=n.slice(0,S)):s&&(this.search="",this.query={}),n&&(this.pathname=n),slashedProtocol[u]&&this.hostname&&!this.pathname&&(this.pathname="/"),this.pathname||this.search){var A=this.pathname||"",k=this.search||"";this.path=A+k}return this.href=this.format(),this},Url.prototype.format=function(){var t=this.auth||"";t&&(t=encodeURIComponent(t),t=t.replace(/%3A/i,":"),t+="@");var s=this.protocol||"",e=this.pathname||"",h=this.hash||"",r=!1,a="";this.host?r=t+this.host:this.hostname&&(r=t+(this.hostname.indexOf(":")===-1?this.hostname:"["+this.hostname+"]"),this.port&&(r+=":"+this.port)),this.query&&util.isObject(this.query)&&Object.keys(this.query).length&&(a=querystring.stringify(this.query));var o=this.search||a&&"?"+a||"";return s&&":"!==s.substr(-1)&&(s+=":"),this.slashes||(!s||slashedProtocol[s])&&r!==!1?(r="//"+(r||""),e&&"/"!==e.charAt(0)&&(e="/"+e)):r||(r=""),h&&"#"!==h.charAt(0)&&(h="#"+h),o&&"?"!==o.charAt(0)&&(o="?"+o),e=e.replace(/[?#]/g,function(t){return encodeURIComponent(t)}),o=o.replace("#","%23"),s+r+e+o+h},Url.prototype.resolve=function(t){return this.resolveObject(urlParse(t,!1,!0)).format()},Url.prototype.resolveObject=function(t){if(util.isString(t)){var s=new Url;s.parse(t,!1,!0),t=s}for(var e=new Url,h=Object.keys(this),r=0;r<h.length;r++){var a=h[r];e[a]=this[a]}if(e.hash=t.hash,""===t.href)return e.href=e.format(),e;if(t.slashes&&!t.protocol){for(var o=Object.keys(t),n=0;n<o.length;n++){var i=o[n];"protocol"!==i&&(e[i]=t[i])}return slashedProtocol[e.protocol]&&e.hostname&&!e.pathname&&(e.path=e.pathname="/"),e.href=e.format(),e}if(t.protocol&&t.protocol!==e.protocol){if(!slashedProtocol[t.protocol]){for(var l=Object.keys(t),u=0;u<l.length;u++){var p=l[u];e[p]=t[p]}return e.href=e.format(),e}if(e.protocol=t.protocol,t.host||hostlessProtocol[t.protocol])e.pathname=t.pathname;else{for(var c=(t.pathname||"").split("/");c.length&&!(t.host=c.shift()););t.host||(t.host=""),t.hostname||(t.hostname=""),""!==c[0]&&c.unshift(""),c.length<2&&c.unshift(""),e.pathname=c.join("/")}if(e.search=t.search,e.query=t.query,e.host=t.host||"",e.auth=t.auth,e.hostname=t.hostname||t.host,e.port=t.port,e.pathname||e.search){var f=e.pathname||"",m=e.search||"";e.path=f+m}return e.slashes=e.slashes||t.slashes,e.href=e.format(),e}var v=e.pathname&&"/"===e.pathname.charAt(0),g=t.host||t.pathname&&"/"===t.pathname.charAt(0),y=g||v||e.host&&t.pathname,P=y,d=e.pathname&&e.pathname.split("/")||[],c=t.pathname&&t.pathname.split("/")||[],q=e.protocol&&!slashedProtocol[e.protocol];if(q&&(e.hostname="",e.port=null,e.host&&(""===d[0]?d[0]=e.host:d.unshift(e.host)),e.host="",t.protocol&&(t.hostname=null,t.port=null,t.host&&(""===c[0]?c[0]=t.host:c.unshift(t.host)),t.host=null),y=y&&(""===c[0]||""===d[0])),g)e.host=t.host||""===t.host?t.host:e.host,e.hostname=t.hostname||""===t.hostname?t.hostname:e.hostname,e.search=t.search,e.query=t.query,d=c;else if(c.length)d||(d=[]),d.pop(),d=d.concat(c),e.search=t.search,e.query=t.query;else if(!util.isNullOrUndefined(t.search)){if(q){e.hostname=e.host=d.shift();var b=!!(e.host&&e.host.indexOf("@")>0)&&e.host.split("@");b&&(e.auth=b.shift(),e.host=e.hostname=b.shift())}return e.search=t.search,e.query=t.query,util.isNull(e.pathname)&&util.isNull(e.search)||(e.path=(e.pathname?e.pathname:"")+(e.search?e.search:"")),e.href=e.format(),e}if(!d.length)return e.pathname=null,e.search?e.path="/"+e.search:e.path=null,e.href=e.format(),e;for(var O=d.slice(-1)[0],j=(e.host||t.host||d.length>1)&&("."===O||".."===O)||""===O,x=0,U=d.length;U>=0;U--)O=d[U],"."===O?d.splice(U,1):".."===O?(d.splice(U,1),x++):x&&(d.splice(U,1),x--);if(!y&&!P)for(;x--;x)d.unshift("..");!y||""===d[0]||d[0]&&"/"===d[0].charAt(0)||d.unshift(""),j&&"/"!==d.join("/").substr(-1)&&d.push("");var C=""===d[0]||d[0]&&"/"===d[0].charAt(0);if(q){e.hostname=e.host=C?"":d.length?d.shift():"";var b=!!(e.host&&e.host.indexOf("@")>0)&&e.host.split("@");b&&(e.auth=b.shift(),e.host=e.hostname=b.shift())}return y=y||e.host&&d.length,y&&!C&&d.unshift(""),d.length?e.pathname=d.join("/"):(e.pathname=null,e.path=null),util.isNull(e.pathname)&&util.isNull(e.search)||(e.path=(e.pathname?e.pathname:"")+(e.search?e.search:"")),e.auth=t.auth||e.auth,e.slashes=e.slashes||t.slashes,e.href=e.format(),e},Url.prototype.parseHost=function(){var t=this.host,s=portPattern.exec(t);s&&(s=s[0],":"!==s&&(this.port=s.substr(1)),t=t.substr(0,t.length-s.length)),t&&(this.hostname=t)};
},{"./util":71,"punycode":42,"querystring":45}],71:[function(require,module,exports){
"use strict";module.exports={isString:function(n){return"string"==typeof n},isObject:function(n){return"object"==typeof n&&null!==n},isNull:function(n){return null===n},isNullOrUndefined:function(n){return null==n}};
},{}],72:[function(require,module,exports){
arguments[4][29][0].apply(exports,arguments)
},{"dup":29}],73:[function(require,module,exports){
function dragDrop(e,r){function t(t){if(t.stopPropagation(),t.preventDefault(),t.dataTransfer.items){var n=toArray(t.dataTransfer.items),a=n.filter(function(e){return"file"===e.kind}),o=n.filter(function(e){return"string"===e.kind});if(0===a.length&&!r.onDropText)return;if(0===o.length&&!r.onDrop)return;if(0===a.length&&0===o.length)return}return e.classList.add("drag"),clearTimeout(i),r.onDragOver&&r.onDragOver(t),t.dataTransfer.dropEffect="copy",!1}function n(e){return e.stopPropagation(),e.preventDefault(),r.onDragLeave&&r.onDragLeave(e),clearTimeout(i),i=setTimeout(o,50),!1}function a(e){e.stopPropagation(),e.preventDefault(),r.onDragLeave&&r.onDragLeave(e),clearTimeout(i),o();var t={x:e.clientX,y:e.clientY},n=e.dataTransfer.getData("text");if(n&&r.onDropText&&r.onDropText(n,t),e.dataTransfer.items){var a=toArray(e.dataTransfer.items).filter(function(e){return"file"===e.kind});if(0===a.length)return;parallel(a.map(function(e){return function(r){processEntry(e.webkitGetAsEntry(),r)}}),function(e,n){if(e)throw e;r.onDrop&&r.onDrop(flatten(n),t)})}else{var f=toArray(e.dataTransfer.files);if(0===f.length)return;f.forEach(function(e){e.fullPath="/"+e.name}),r.onDrop&&r.onDrop(f,t)}return!1}function o(){e.classList.remove("drag")}"string"==typeof e&&(e=window.document.querySelector(e)),"function"==typeof r&&(r={onDrop:r});var i;return e.addEventListener("dragenter",stopEvent,!1),e.addEventListener("dragover",t,!1),e.addEventListener("dragleave",n,!1),e.addEventListener("drop",a,!1),function(){o(),e.removeEventListener("dragenter",stopEvent,!1),e.removeEventListener("dragover",t,!1),e.removeEventListener("dragleave",n,!1),e.removeEventListener("drop",a,!1)}}function stopEvent(e){return e.stopPropagation(),e.preventDefault(),!1}function processEntry(e,r){function t(){o.readEntries(function(e){e.length>0?(a=a.concat(toArray(e)),t()):n()})}function n(){parallel(a.map(function(e){return function(r){processEntry(e,r)}}),r)}var a=[];if(e.isFile)e.file(function(t){t.fullPath=e.fullPath,r(null,t)},function(e){r(e)});else if(e.isDirectory){var o=e.createReader();t()}}function toArray(e){return Array.prototype.slice.call(e||[],0)}module.exports=dragDrop;var flatten=require("flatten"),parallel=require("run-parallel");
},{"flatten":74,"run-parallel":75}],74:[function(require,module,exports){
module.exports=function(r,n){function t(r,u){return r.reduce(function(r,e){return Array.isArray(e)&&u<n?r.concat(t(e,u+1)):r.concat(e)},[])}return n="number"==typeof n?n:1/0,n?t(r,1):Array.isArray(r)?r.map(function(r){return r}):r};
},{}],75:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"_process":41,"dup":12}],76:[function(require,module,exports){
var hat=module.exports=function(t,r){if(r||(r=16),void 0===t&&(t=128),t<=0)return"0";for(var o=Math.log(Math.pow(2,t))/Math.log(r),a=2;o===1/0;a*=2)o=Math.log(Math.pow(2,t/a))/Math.log(r)*a;for(var n=o-Math.floor(o),h="",a=0;a<Math.floor(o);a++){var e=Math.floor(Math.random()*r).toString(r);h=e+h}if(n){var i=Math.pow(r,n),e=Math.floor(Math.random()*i).toString(r);h=e+h}var f=parseInt(h,r);return f!==1/0&&f>=Math.pow(2,t)?hat(t,r):h};hat.rack=function(t,r,o){var a=function(a){var h=0;do{if(h++>10){if(!o)throw new Error("too many ID collisions, use more bits");t+=o}var e=hat(t,r)}while(Object.hasOwnProperty.call(n,e));return n[e]=a,e},n=a.hats={};return a.get=function(t){return a.hats[t]},a.set=function(t,r){return a.hats[t]=r,a},a.bits=t||128,a.base=r||16,a};
},{}],77:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],78:[function(require,module,exports){
(function (Buffer){
'use strict';

var MediaFileReader = require('./MediaFileReader');

class ArrayFileReader extends MediaFileReader {

  constructor(array) {
    super();
    this._array = array;
    this._size = array.length;
    this._isInitialized = true;
  }

  static canReadFile(file) {
    return Array.isArray(file) || typeof Buffer === 'function' && Buffer.isBuffer(file);
  }

  init(callbacks) {
    setTimeout(callbacks.onSuccess, 0);
  }

  loadRange(range, callbacks) {
    setTimeout(callbacks.onSuccess, 0);
  }

  getByteAt(offset) {
    return this._array[offset];
  }
}

module.exports = ArrayFileReader;
}).call(this,require("buffer").Buffer)
},{"./MediaFileReader":85,"buffer":33}],79:[function(require,module,exports){
'use strict';

const ChunkedFileData = require('./ChunkedFileData');
const MediaFileReader = require('./MediaFileReader');

class BlobFileReader extends MediaFileReader {

  constructor(blob) {
    super();
    this._blob = blob;
    this._fileData = new ChunkedFileData();
  }

  static canReadFile(file) {
    return typeof Blob !== "undefined" && file instanceof Blob ||
    // File extends Blob but it seems that File instanceof Blob doesn't
    // quite work as expected in Cordova/PhoneGap.
    typeof File !== "undefined" && file instanceof File;
  }

  _init(callbacks) {
    this._size = this._blob.size;
    setTimeout(callbacks.onSuccess, 1);
  }

  loadRange(range, callbacks) {
    var self = this;
    // $FlowIssue - flow isn't aware of mozSlice or webkitSlice
    var blobSlice = this._blob.slice || this._blob.mozSlice || this._blob.webkitSlice;
    var blob = blobSlice.call(this._blob, range[0], range[1] + 1);
    var browserFileReader = new FileReader();

    browserFileReader.onloadend = function (event) {
      var intArray = new Uint8Array(browserFileReader.result);
      self._fileData.addData(range[0], intArray);
      callbacks.onSuccess();
    };
    browserFileReader.onerror = browserFileReader.onabort = function (event) {
      if (callbacks.onError) {
        callbacks.onError({ "type": "blob", "info": browserFileReader.error });
      }
    };

    browserFileReader.readAsArrayBuffer(blob);
  }

  getByteAt(offset) {
    return this._fileData.getByteAt(offset);
  }
}

module.exports = BlobFileReader;
},{"./ChunkedFileData":80,"./MediaFileReader":85}],80:[function(require,module,exports){
/**
 * This class represents a file that might not have all its data loaded yet.
 * It is used when loading the entire file is not an option because it's too
 * expensive. Instead, parts of the file are loaded and added only when needed.
 * From a reading point of view is as if the entire file is loaded. The
 * exception is when the data is not available yet, an error will be thrown.
 * This class does not load the data, it just manages it. It provides operations
 * to add and read data from the file.
 *
 * 
 */
'use strict';

const NOT_FOUND = -1;

class ChunkedFileData {
  // $FlowIssue - get/set properties not yet supported
  static get NOT_FOUND() {
    return NOT_FOUND;
  }


  constructor() {
    this._fileData = [];
  }

  /**
   * Adds data to the file storage at a specific offset.
   */
  addData(offset, data) {
    var offsetEnd = offset + data.length - 1;
    var chunkRange = this._getChunkRange(offset, offsetEnd);

    if (chunkRange.startIx === NOT_FOUND) {
      this._fileData.splice(chunkRange.insertIx || 0, 0, {
        offset: offset,
        data: data
      });
    } else {
      // If the data to add collides with existing chunks we prepend and
      // append data from the half colliding chunks to make the collision at
      // 100%. The new data can then replace all the colliding chunkes.
      var firstChunk = this._fileData[chunkRange.startIx];
      var lastChunk = this._fileData[chunkRange.endIx];
      var needsPrepend = offset > firstChunk.offset;
      var needsAppend = offsetEnd < lastChunk.offset + lastChunk.data.length - 1;

      var chunk = {
        offset: Math.min(offset, firstChunk.offset),
        data: data
      };

      if (needsPrepend) {
        var slicedData = this._sliceData(firstChunk.data, 0, offset - firstChunk.offset);
        chunk.data = this._concatData(slicedData, data);
      }

      if (needsAppend) {
        // Use the lastChunk because the slice logic is easier to handle.
        var slicedData = this._sliceData(chunk.data, 0, lastChunk.offset - chunk.offset);
        chunk.data = this._concatData(slicedData, lastChunk.data);
      }

      this._fileData.splice(chunkRange.startIx, chunkRange.endIx - chunkRange.startIx + 1, chunk);
    }
  }

  _concatData(dataA, dataB) {
    // TypedArrays don't support concat.
    if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(dataA)) {
      // $FlowIssue - flow thinks dataAandB is a string but it's not
      var dataAandB = new dataA.constructor(dataA.length + dataB.length);
      // $FlowIssue - flow thinks dataAandB is a string but it's not
      dataAandB.set(dataA, 0);
      // $FlowIssue - flow thinks dataAandB is a string but it's not
      dataAandB.set(dataB, dataA.length);
      return dataAandB;
    } else {
      // $FlowIssue - flow thinks dataAandB is a TypedArray but it's not
      return dataA.concat(dataB);
    }
  }

  _sliceData(data, begin, end) {
    // Some TypeArray implementations do not support slice yet.
    if (data.slice) {
      return data.slice(begin, end);
    } else {
      // $FlowIssue - flow thinks data is a string but it's not
      return data.subarray(begin, end);
    }
  }

  /**
   * Finds the chunk range that overlaps the [offsetStart-1,offsetEnd+1] range.
   * When a chunk is adjacent to the offset we still consider it part of the
   * range (this is the situation of offsetStart-1 or offsetEnd+1).
   * When no chunks are found `insertIx` denotes the index where the data
   * should be inserted in the data list (startIx == NOT_FOUND and endIX ==
   * NOT_FOUND).
   */
  _getChunkRange(offsetStart, offsetEnd) {
    var startChunkIx = NOT_FOUND;
    var endChunkIx = NOT_FOUND;
    var insertIx = 0;

    // Could use binary search but not expecting that many blocks to exist.
    for (var i = 0; i < this._fileData.length; i++, insertIx = i) {
      var chunkOffsetStart = this._fileData[i].offset;
      var chunkOffsetEnd = chunkOffsetStart + this._fileData[i].data.length;

      if (offsetEnd < chunkOffsetStart - 1) {
        // This offset range doesn't overlap with any chunks.
        break;
      }
      // If it is adjacent we still consider it part of the range because
      // we're going end up with a single block with all contiguous data.
      if (offsetStart <= chunkOffsetEnd + 1 && offsetEnd >= chunkOffsetStart - 1) {
        startChunkIx = i;
        break;
      }
    }

    // No starting chunk was found, meaning that the offset is either before
    // or after the current stored chunks.
    if (startChunkIx === NOT_FOUND) {
      return {
        startIx: NOT_FOUND,
        endIx: NOT_FOUND,
        insertIx: insertIx
      };
    }

    // Find the ending chunk.
    for (var i = startChunkIx; i < this._fileData.length; i++) {
      var chunkOffsetStart = this._fileData[i].offset;
      var chunkOffsetEnd = chunkOffsetStart + this._fileData[i].data.length;

      if (offsetEnd >= chunkOffsetStart - 1) {
        // Candidate for the end chunk, it doesn't mean it is yet.
        endChunkIx = i;
      }
      if (offsetEnd <= chunkOffsetEnd + 1) {
        break;
      }
    }

    if (endChunkIx === NOT_FOUND) {
      endChunkIx = startChunkIx;
    }

    return {
      startIx: startChunkIx,
      endIx: endChunkIx
    };
  }

  hasDataRange(offsetStart, offsetEnd) {
    for (var i = 0; i < this._fileData.length; i++) {
      var chunk = this._fileData[i];
      if (offsetEnd < chunk.offset) {
        return false;
      }

      if (offsetStart >= chunk.offset && offsetEnd < chunk.offset + chunk.data.length) {
        return true;
      }
    }

    return false;
  }

  getByteAt(offset) {
    var dataChunk;

    for (var i = 0; i < this._fileData.length; i++) {
      var dataChunkStart = this._fileData[i].offset;
      var dataChunkEnd = dataChunkStart + this._fileData[i].data.length - 1;

      if (offset >= dataChunkStart && offset <= dataChunkEnd) {
        dataChunk = this._fileData[i];
        break;
      }
    }

    if (dataChunk) {
      return dataChunk.data[offset - dataChunk.offset];
    }

    throw new Error("Offset " + offset + " hasn't been loaded yet.");
  }
}

module.exports = ChunkedFileData;
},{}],81:[function(require,module,exports){
'use strict';

var MediaTagReader = require('./MediaTagReader');
var MediaFileReader = require('./MediaFileReader');

class ID3v1TagReader extends MediaTagReader {
  static getTagIdentifierByteRange() {
    // The identifier is TAG and is at offset: -128. However, to avoid a
    // fetch for the tag identifier and another for the data, we load the
    // entire data since it's so small.
    return {
      offset: -128,
      length: 128
    };
  }

  static canReadTagFormat(tagIdentifier) {
    var id = String.fromCharCode.apply(String, tagIdentifier.slice(0, 3));
    return id === "TAG";
  }

  _loadData(mediaFileReader, callbacks) {
    var fileSize = mediaFileReader.getSize();
    mediaFileReader.loadRange([fileSize - 128, fileSize - 1], callbacks);
  }

  _parseData(data, tags) {
    var offset = data.getSize() - 128;

    var title = data.getStringWithCharsetAt(offset + 3, 30).toString();
    var artist = data.getStringWithCharsetAt(offset + 33, 30).toString();
    var album = data.getStringWithCharsetAt(offset + 63, 30).toString();
    var year = data.getStringWithCharsetAt(offset + 93, 4).toString();

    var trackFlag = data.getByteAt(offset + 97 + 28);
    var track = data.getByteAt(offset + 97 + 29);
    if (trackFlag == 0 && track != 0) {
      var version = "1.1";
      var comment = data.getStringWithCharsetAt(offset + 97, 28).toString();
    } else {
      var version = "1.0";
      var comment = data.getStringWithCharsetAt(offset + 97, 30).toString();
      track = 0;
    }

    var genreIdx = data.getByteAt(offset + 97 + 30);
    if (genreIdx < 255) {
      var genre = GENRES[genreIdx];
    } else {
      var genre = "";
    }

    var tag = {
      "type": "ID3",
      "version": version,
      "tags": {
        "title": title,
        "artist": artist,
        "album": album,
        "year": year,
        "comment": comment,
        "genre": genre
      }
    };

    if (track) {
      // $FlowIssue - flow is not happy with adding properties
      tag.tags.track = track;
    }

    return tag;
  }
}

var GENRES = ["Blues", "Classic Rock", "Country", "Dance", "Disco", "Funk", "Grunge", "Hip-Hop", "Jazz", "Metal", "New Age", "Oldies", "Other", "Pop", "R&B", "Rap", "Reggae", "Rock", "Techno", "Industrial", "Alternative", "Ska", "Death Metal", "Pranks", "Soundtrack", "Euro-Techno", "Ambient", "Trip-Hop", "Vocal", "Jazz+Funk", "Fusion", "Trance", "Classical", "Instrumental", "Acid", "House", "Game", "Sound Clip", "Gospel", "Noise", "AlternRock", "Bass", "Soul", "Punk", "Space", "Meditative", "Instrumental Pop", "Instrumental Rock", "Ethnic", "Gothic", "Darkwave", "Techno-Industrial", "Electronic", "Pop-Folk", "Eurodance", "Dream", "Southern Rock", "Comedy", "Cult", "Gangsta", "Top 40", "Christian Rap", "Pop/Funk", "Jungle", "Native American", "Cabaret", "New Wave", "Psychadelic", "Rave", "Showtunes", "Trailer", "Lo-Fi", "Tribal", "Acid Punk", "Acid Jazz", "Polka", "Retro", "Musical", "Rock & Roll", "Hard Rock", "Folk", "Folk-Rock", "National Folk", "Swing", "Fast Fusion", "Bebob", "Latin", "Revival", "Celtic", "Bluegrass", "Avantgarde", "Gothic Rock", "Progressive Rock", "Psychedelic Rock", "Symphonic Rock", "Slow Rock", "Big Band", "Chorus", "Easy Listening", "Acoustic", "Humour", "Speech", "Chanson", "Opera", "Chamber Music", "Sonata", "Symphony", "Booty Bass", "Primus", "Porn Groove", "Satire", "Slow Jam", "Club", "Tango", "Samba", "Folklore", "Ballad", "Power Ballad", "Rhythmic Soul", "Freestyle", "Duet", "Punk Rock", "Drum Solo", "Acapella", "Euro-House", "Dance Hall"];

module.exports = ID3v1TagReader;
},{"./MediaFileReader":85,"./MediaTagReader":86}],82:[function(require,module,exports){
'use strict';

var MediaFileReader = require('./MediaFileReader');

var ID3v2FrameReader = {
  getFrameReaderFunction: function (frameId) {
    if (frameId in frameReaderFunctions) {
      return frameReaderFunctions[frameId];
    } else if (frameId[0] === "T") {
      // All frame ids starting with T are text tags.
      return frameReaderFunctions["T*"];
    } else if (frameId[0] === "W") {
      // All frame ids starting with W are url tags.
      return frameReaderFunctions["W*"];
    } else {
      return null;
    }
  }
};

var frameReaderFunctions = {};

frameReaderFunctions['APIC'] = function readPictureFrame(offset, length, data, flags, majorVersion) {
  majorVersion = majorVersion || '3';

  var start = offset;
  var charset = getTextEncoding(data.getByteAt(offset));
  switch (majorVersion) {
    case '2':
      var format = data.getStringAt(offset + 1, 3);
      offset += 4;
      break;

    case '3':
    case '4':
      var format = data.getStringWithCharsetAt(offset + 1, length - 1);
      offset += 1 + format.bytesReadCount;
      break;

    default:
      throw new Error("Couldn't read ID3v2 major version.");
  }
  var bite = data.getByteAt(offset, 1);
  var type = PICTURE_TYPE[bite];
  var desc = data.getStringWithCharsetAt(offset + 1, length - (offset - start) - 1, charset);

  offset += 1 + desc.bytesReadCount;

  return {
    "format": format.toString(),
    "type": type,
    "description": desc.toString(),
    "data": data.getBytesAt(offset, start + length - offset)
  };
};

frameReaderFunctions['COMM'] = function readCommentsFrame(offset, length, data, flags, majorVersion) {
  var start = offset;
  var charset = getTextEncoding(data.getByteAt(offset));
  var language = data.getStringAt(offset + 1, 3);
  var shortdesc = data.getStringWithCharsetAt(offset + 4, length - 4, charset);

  offset += 4 + shortdesc.bytesReadCount;
  var text = data.getStringWithCharsetAt(offset, start + length - offset, charset);

  return {
    language: language,
    short_description: shortdesc.toString(),
    text: text.toString()
  };
};

frameReaderFunctions['COM'] = frameReaderFunctions['COMM'];

frameReaderFunctions['PIC'] = function (offset, length, data, flags, majorVersion) {
  return frameReaderFunctions['APIC'](offset, length, data, flags, '2');
};

frameReaderFunctions['PCNT'] = function readCounterFrame(offset, length, data, flags, majorVersion) {
  // FIXME: implement the rest of the spec
  return data.getLongAt(offset, false);
};

frameReaderFunctions['CNT'] = frameReaderFunctions['PCNT'];

frameReaderFunctions['T*'] = function readTextFrame(offset, length, data, flags, majorVersion) {
  var charset = getTextEncoding(data.getByteAt(offset));

  return data.getStringWithCharsetAt(offset + 1, length - 1, charset).toString();
};

frameReaderFunctions['W*'] = function readUrlFrame(offset, length, data, flags, majorVersion) {
  // charset is only defined for user-defined URL link frames (http://id3.org/id3v2.3.0#User_defined_URL_link_frame)
  // for the other URL link frames it is always iso-8859-1
  var charset = getTextEncoding(data.getByteAt(offset));

  if (charset !== undefined) {
    return data.getStringWithCharsetAt(offset + 1, length - 1, charset).toString();
  } else {
    return data.getStringWithCharsetAt(offset, length, charset).toString();
  }
};

frameReaderFunctions['TCON'] = function readGenreFrame(offset, length, data, flags) {
  var text = frameReaderFunctions['T*'].apply(this, arguments);
  return text.replace(/^\(\d+\)/, '');
};

frameReaderFunctions['TCO'] = frameReaderFunctions['TCON'];

frameReaderFunctions['USLT'] = function readLyricsFrame(offset, length, data, flags, majorVersion) {
  var start = offset;
  var charset = getTextEncoding(data.getByteAt(offset));
  var language = data.getStringAt(offset + 1, 3);
  var descriptor = data.getStringWithCharsetAt(offset + 4, length - 4, charset);

  offset += 4 + descriptor.bytesReadCount;
  var lyrics = data.getStringWithCharsetAt(offset, start + length - offset, charset);

  return {
    language: language,
    descriptor: descriptor.toString(),
    lyrics: lyrics.toString()
  };
};

frameReaderFunctions['ULT'] = frameReaderFunctions['USLT'];

function getTextEncoding(bite) {
  var charset;

  switch (bite) {
    case 0x00:
      charset = 'iso-8859-1';
      break;

    case 0x01:
      charset = 'utf-16';
      break;

    case 0x02:
      charset = 'utf-16be';
      break;

    case 0x03:
      charset = 'utf-8';
      break;
  }

  return charset;
}

var PICTURE_TYPE = ["Other", "32x32 pixels 'file icon' (PNG only)", "Other file icon", "Cover (front)", "Cover (back)", "Leaflet page", "Media (e.g. label side of CD)", "Lead artist/lead performer/soloist", "Artist/performer", "Conductor", "Band/Orchestra", "Composer", "Lyricist/text writer", "Recording Location", "During recording", "During performance", "Movie/video screen capture", "A bright coloured fish", "Illustration", "Band/artist logotype", "Publisher/Studio logotype"];

module.exports = ID3v2FrameReader;
},{"./MediaFileReader":85}],83:[function(require,module,exports){
'use strict';

var MediaTagReader = require('./MediaTagReader');
var MediaFileReader = require('./MediaFileReader');
var ArrayFileReader = require('./ArrayFileReader');
var ID3v2FrameReader = require('./ID3v2FrameReader');

const ID3_HEADER_SIZE = 10;

class ID3v2TagReader extends MediaTagReader {
  static getTagIdentifierByteRange() {
    // ID3 header
    return {
      offset: 0,
      length: ID3_HEADER_SIZE
    };
  }

  static canReadTagFormat(tagIdentifier) {
    var id = String.fromCharCode.apply(String, tagIdentifier.slice(0, 3));
    return id === 'ID3';
  }

  _loadData(mediaFileReader, callbacks) {
    mediaFileReader.loadRange([6, 9], {
      onSuccess: function () {
        mediaFileReader.loadRange(
        // The tag size does not include the header size.
        [0, ID3_HEADER_SIZE + mediaFileReader.getSynchsafeInteger32At(6) - 1], callbacks);
      },
      onError: callbacks.onError
    });
  }

  _parseData(data, tags) {
    var offset = 0;
    var major = data.getByteAt(offset + 3);
    if (major > 4) {
      return { "type": "ID3", "version": ">2.4", "tags": {} };
    }
    var revision = data.getByteAt(offset + 4);
    var unsynch = data.isBitSetAt(offset + 5, 7);
    var xheader = data.isBitSetAt(offset + 5, 6);
    var xindicator = data.isBitSetAt(offset + 5, 5);
    var size = data.getSynchsafeInteger32At(offset + 6);
    offset += 10;

    if (xheader) {
      // TODO: support 2.4
      var xheadersize = data.getLongAt(offset, true);
      // The 'Extended header size', currently 6 or 10 bytes, excludes itself.
      offset += xheadersize + 4;
    }

    var id3 = {
      "type": "ID3",
      "version": '2.' + major + '.' + revision,
      "major": major,
      "revision": revision,
      "flags": {
        "unsynchronisation": unsynch,
        "extended_header": xheader,
        "experimental_indicator": xindicator,
        // TODO: footer_present
        "footer_present": false
      },
      "size": size,
      "tags": {}
    };

    var frames = this._readFrames(offset, size - 10, data, id3, tags);
    // create shortcuts for most common data.
    for (var name in SHORTCUTS) if (SHORTCUTS.hasOwnProperty(name)) {
      var frameData = this._getFrameData(frames, SHORTCUTS[name]);
      if (frameData) {
        id3.tags[name] = frameData;
      }
    }

    for (var frame in frames) if (frames.hasOwnProperty(frame)) {
      id3.tags[frame] = frames[frame];
    }

    return id3;
  }

  _getUnsyncFileReader(data, offset, size) {
    var frameData = data.getBytesAt(offset, size);
    for (var i = 0; i < frameData.length - 1; i++) {
      if (frameData[i] === 0xff && frameData[i + 1] === 0x00) {
        frameData.splice(i + 1, 1);
      }
    }

    return new ArrayFileReader(frameData);
  }

  /**
   * All the frames consists of a frame header followed by one or more fields
   * containing the actual information.
   * The frame ID made out of the characters capital A-Z and 0-9. Identifiers
   * beginning with "X", "Y" and "Z" are for experimental use and free for
   * everyone to use, without the need to set the experimental bit in the tag
   * header. Have in mind that someone else might have used the same identifier
   * as you. All other identifiers are either used or reserved for future use.
   * The frame ID is followed by a size descriptor, making a total header size
   * of ten bytes in every frame. The size is calculated as frame size excluding
   * frame header (frame size - 10).
   */
  _readFrames(offset, end, data, id3header, tags) {
    var frames = {};

    if (tags) {
      tags = this._expandShortcutTags(tags);
    }

    while (offset < end) {
      var header = this._readFrameHeader(data, offset, id3header);
      var frameId = header.id;

      // If the header size is 0 then we're probably hit the padding if it
      // exists.
      if (header.size === 0) {
        break;
      }
      // No frame ID sometimes means it's the last frame (GTFO).
      if (!frameId) {
        break;
      }

      var flags = header.flags;
      var frameSize = header.size;
      var frameDataOffset = offset + header.headerSize;
      var frameData = data;

      // advance data offset to the next frame data
      offset += header.headerSize + header.size;

      // skip unwanted tags
      if (tags && tags.indexOf(frameId) === -1) {
        continue;
      }

      var unsyncData;
      if (id3header.flags.unsynchronisation || flags && flags.format.unsynchronisation) {
        frameData = this._getUnsyncFileReader(frameData, frameDataOffset, frameSize);
        frameDataOffset = 0;
        frameSize = frameData.getSize();
      }

      // the first 4 bytes are the real data size
      // (after unsynchronisation && encryption)
      if (flags && flags.format.data_length_indicator) {
        // var frameDataSize = frameData.getSynchsafeInteger32At(frameDataOffset);
        frameDataOffset += 4;
        frameSize -= 4;
      }

      var readFrameFunc = ID3v2FrameReader.getFrameReaderFunction(frameId);
      var parsedData = readFrameFunc ? readFrameFunc(frameDataOffset, frameSize, frameData, flags) : null;
      var desc = this._getFrameDescription(frameId);

      var frame = {
        id: frameId,
        size: frameSize,
        description: desc,
        data: parsedData
      };

      if (frameId in frames) {
        if (frames[frameId].id) {
          frames[frameId] = [frames[frameId]];
        }
        frames[frameId].push(frame);
      } else {
        frames[frameId] = frame;
      }
    }

    return frames;
  }

  _readFrameHeader(data, offset, id3header) {
    var major = id3header.major;
    var flags = null;

    switch (major) {
      case 2:
        var frameId = data.getStringAt(offset, 3);
        var frameSize = data.getInteger24At(offset + 3, true);
        var frameHeaderSize = 6;
        break;

      case 3:
        var frameId = data.getStringAt(offset, 4);
        var frameSize = data.getLongAt(offset + 4, true);
        var frameHeaderSize = 10;
        break;

      case 4:
        var frameId = data.getStringAt(offset, 4);
        var frameSize = data.getSynchsafeInteger32At(offset + 4);
        var frameHeaderSize = 10;
        break;
    }

    // if frameId is empty then it's the last frame
    if (frameId) {
      // read frame message and format flags
      if (major > 2) {
        flags = this._readFrameFlags(data, offset + 8);
      }
    }

    return {
      "id": frameId || "",
      "size": frameSize || 0,
      "headerSize": frameHeaderSize || 0,
      "flags": flags
    };
  }

  _readFrameFlags(data, offset) {
    return {
      message: {
        tag_alter_preservation: data.isBitSetAt(offset, 6),
        file_alter_preservation: data.isBitSetAt(offset, 5),
        read_only: data.isBitSetAt(offset, 4)
      },
      format: {
        grouping_identity: data.isBitSetAt(offset + 1, 7),
        compression: data.isBitSetAt(offset + 1, 3),
        encryption: data.isBitSetAt(offset + 1, 2),
        unsynchronisation: data.isBitSetAt(offset + 1, 1),
        data_length_indicator: data.isBitSetAt(offset + 1, 0)
      }
    };
  }

  _getFrameData(frames, ids) {
    for (var i = 0, id; id = ids[i]; i++) {
      if (id in frames) {
        return frames[id].data;
      }
    }
  }

  _getFrameDescription(frameId) {
    if (frameId in FRAME_DESCRIPTIONS) {
      return FRAME_DESCRIPTIONS[frameId];
    } else {
      return 'Unknown';
    }
  }

  getShortcuts() {
    return SHORTCUTS;
  }
}

const FRAME_DESCRIPTIONS = {
  // v2.2
  "BUF": "Recommended buffer size",
  "CNT": "Play counter",
  "COM": "Comments",
  "CRA": "Audio encryption",
  "CRM": "Encrypted meta frame",
  "ETC": "Event timing codes",
  "EQU": "Equalization",
  "GEO": "General encapsulated object",
  "IPL": "Involved people list",
  "LNK": "Linked information",
  "MCI": "Music CD Identifier",
  "MLL": "MPEG location lookup table",
  "PIC": "Attached picture",
  "POP": "Popularimeter",
  "REV": "Reverb",
  "RVA": "Relative volume adjustment",
  "SLT": "Synchronized lyric/text",
  "STC": "Synced tempo codes",
  "TAL": "Album/Movie/Show title",
  "TBP": "BPM (Beats Per Minute)",
  "TCM": "Composer",
  "TCO": "Content type",
  "TCR": "Copyright message",
  "TDA": "Date",
  "TDY": "Playlist delay",
  "TEN": "Encoded by",
  "TFT": "File type",
  "TIM": "Time",
  "TKE": "Initial key",
  "TLA": "Language(s)",
  "TLE": "Length",
  "TMT": "Media type",
  "TOA": "Original artist(s)/performer(s)",
  "TOF": "Original filename",
  "TOL": "Original Lyricist(s)/text writer(s)",
  "TOR": "Original release year",
  "TOT": "Original album/Movie/Show title",
  "TP1": "Lead artist(s)/Lead performer(s)/Soloist(s)/Performing group",
  "TP2": "Band/Orchestra/Accompaniment",
  "TP3": "Conductor/Performer refinement",
  "TP4": "Interpreted, remixed, or otherwise modified by",
  "TPA": "Part of a set",
  "TPB": "Publisher",
  "TRC": "ISRC (International Standard Recording Code)",
  "TRD": "Recording dates",
  "TRK": "Track number/Position in set",
  "TSI": "Size",
  "TSS": "Software/hardware and settings used for encoding",
  "TT1": "Content group description",
  "TT2": "Title/Songname/Content description",
  "TT3": "Subtitle/Description refinement",
  "TXT": "Lyricist/text writer",
  "TXX": "User defined text information frame",
  "TYE": "Year",
  "UFI": "Unique file identifier",
  "ULT": "Unsychronized lyric/text transcription",
  "WAF": "Official audio file webpage",
  "WAR": "Official artist/performer webpage",
  "WAS": "Official audio source webpage",
  "WCM": "Commercial information",
  "WCP": "Copyright/Legal information",
  "WPB": "Publishers official webpage",
  "WXX": "User defined URL link frame",
  // v2.3
  "AENC": "Audio encryption",
  "APIC": "Attached picture",
  "ASPI": "Audio seek point index",
  "COMM": "Comments",
  "COMR": "Commercial frame",
  "ENCR": "Encryption method registration",
  "EQU2": "Equalisation (2)",
  "EQUA": "Equalization",
  "ETCO": "Event timing codes",
  "GEOB": "General encapsulated object",
  "GRID": "Group identification registration",
  "IPLS": "Involved people list",
  "LINK": "Linked information",
  "MCDI": "Music CD identifier",
  "MLLT": "MPEG location lookup table",
  "OWNE": "Ownership frame",
  "PRIV": "Private frame",
  "PCNT": "Play counter",
  "POPM": "Popularimeter",
  "POSS": "Position synchronisation frame",
  "RBUF": "Recommended buffer size",
  "RVA2": "Relative volume adjustment (2)",
  "RVAD": "Relative volume adjustment",
  "RVRB": "Reverb",
  "SEEK": "Seek frame",
  "SYLT": "Synchronized lyric/text",
  "SYTC": "Synchronized tempo codes",
  "TALB": "Album/Movie/Show title",
  "TBPM": "BPM (beats per minute)",
  "TCOM": "Composer",
  "TCON": "Content type",
  "TCOP": "Copyright message",
  "TDAT": "Date",
  "TDLY": "Playlist delay",
  "TDRC": "Recording time",
  "TDRL": "Release time",
  "TDTG": "Tagging time",
  "TENC": "Encoded by",
  "TEXT": "Lyricist/Text writer",
  "TFLT": "File type",
  "TIME": "Time",
  "TIPL": "Involved people list",
  "TIT1": "Content group description",
  "TIT2": "Title/songname/content description",
  "TIT3": "Subtitle/Description refinement",
  "TKEY": "Initial key",
  "TLAN": "Language(s)",
  "TLEN": "Length",
  "TMCL": "Musician credits list",
  "TMED": "Media type",
  "TMOO": "Mood",
  "TOAL": "Original album/movie/show title",
  "TOFN": "Original filename",
  "TOLY": "Original lyricist(s)/text writer(s)",
  "TOPE": "Original artist(s)/performer(s)",
  "TORY": "Original release year",
  "TOWN": "File owner/licensee",
  "TPE1": "Lead performer(s)/Soloist(s)",
  "TPE2": "Band/orchestra/accompaniment",
  "TPE3": "Conductor/performer refinement",
  "TPE4": "Interpreted, remixed, or otherwise modified by",
  "TPOS": "Part of a set",
  "TPRO": "Produced notice",
  "TPUB": "Publisher",
  "TRCK": "Track number/Position in set",
  "TRDA": "Recording dates",
  "TRSN": "Internet radio station name",
  "TRSO": "Internet radio station owner",
  "TSOA": "Album sort order",
  "TSOP": "Performer sort order",
  "TSOT": "Title sort order",
  "TSIZ": "Size",
  "TSRC": "ISRC (international standard recording code)",
  "TSSE": "Software/Hardware and settings used for encoding",
  "TSST": "Set subtitle",
  "TYER": "Year",
  "TXXX": "User defined text information frame",
  "UFID": "Unique file identifier",
  "USER": "Terms of use",
  "USLT": "Unsychronized lyric/text transcription",
  "WCOM": "Commercial information",
  "WCOP": "Copyright/Legal information",
  "WOAF": "Official audio file webpage",
  "WOAR": "Official artist/performer webpage",
  "WOAS": "Official audio source webpage",
  "WORS": "Official internet radio station homepage",
  "WPAY": "Payment",
  "WPUB": "Publishers official webpage",
  "WXXX": "User defined URL link frame"
};

const SHORTCUTS = {
  "title": ["TIT2", "TT2"],
  "artist": ["TPE1", "TP1"],
  "album": ["TALB", "TAL"],
  "year": ["TYER", "TYE"],
  "comment": ["COMM", "COM"],
  "track": ["TRCK", "TRK"],
  "genre": ["TCON", "TCO"],
  "picture": ["APIC", "PIC"],
  "lyrics": ["USLT", "ULT"]
};

module.exports = ID3v2TagReader;
},{"./ArrayFileReader":78,"./ID3v2FrameReader":82,"./MediaFileReader":85,"./MediaTagReader":86}],84:[function(require,module,exports){
/**
 * Support for iTunes-style m4a tags
 * See:
 *   http://atomicparsley.sourceforge.net/mpeg-4files.html
 *   http://developer.apple.com/mac/library/documentation/QuickTime/QTFF/Metadata/Metadata.html
 * Authored by Joshua Kifer <joshua.kifer gmail.com>
 * 
 */
'use strict';

var MediaTagReader = require('./MediaTagReader');
var MediaFileReader = require('./MediaFileReader');

class MP4TagReader extends MediaTagReader {
  static getTagIdentifierByteRange() {
    // The tag identifier is located in [4, 8] but since we'll need to reader
    // the header of the first block anyway, we load it instead to avoid
    // making two requests.
    return {
      offset: 0,
      length: 16
    };
  }

  static canReadTagFormat(tagIdentifier) {
    var id = String.fromCharCode.apply(String, tagIdentifier.slice(4, 8));
    return id === "ftyp";
  }

  _loadData(mediaFileReader, callbacks) {
    // MP4 metadata isn't located in a specific location of the file. Roughly
    // speaking, it's composed of blocks chained together like a linked list.
    // These blocks are called atoms (or boxes).
    // Each atom of the list can have its own child linked list. Atoms in this
    // situation do not possess any data and are called "container" as they only
    // contain other atoms.
    // Other atoms represent a particular set of data, like audio, video or
    // metadata. In order to find and load all the interesting atoms we need
    // to traverse the entire linked list of atoms and only load the ones
    // associated with metadata.
    // The metadata atoms can be find under the "moov.udta.meta.ilst" hierarchy.

    var self = this;
    // Load the header of the first atom
    mediaFileReader.loadRange([0, 16], {
      onSuccess: function () {
        self._loadAtom(mediaFileReader, 0, "", callbacks);
      },
      onError: callbacks.onError
    });
  }

  _loadAtom(mediaFileReader, offset, parentAtomFullName, callbacks) {
    if (offset >= mediaFileReader.getSize()) {
      callbacks.onSuccess();
      return;
    }

    var self = this;
    // 8 is the size of the atomSize and atomName fields.
    // When reading the current block we always read 8 more bytes in order
    // to also read the header of the next block.
    var atomSize = mediaFileReader.getLongAt(offset, true);
    if (atomSize == 0 || isNaN(atomSize)) {
      callbacks.onSuccess();
      return;
    }
    var atomName = mediaFileReader.getStringAt(offset + 4, 4);
    // console.log(parentAtomFullName, atomName, atomSize);
    // Container atoms (no actual data)
    if (this._isContainerAtom(atomName)) {
      if (atomName == "meta") {
        // The "meta" atom breaks convention and is a container with data.
        offset += 4; // next_item_id (uint32)
      }
      var atomFullName = (parentAtomFullName ? parentAtomFullName + "." : "") + atomName;
      if (atomFullName === "moov.udta.meta.ilst") {
        mediaFileReader.loadRange([offset, offset + atomSize], callbacks);
      } else {
        mediaFileReader.loadRange([offset + 8, offset + 8 + 8], {
          onSuccess: function () {
            self._loadAtom(mediaFileReader, offset + 8, atomFullName, callbacks);
          },
          onError: callbacks.onError
        });
      }
    } else {
      mediaFileReader.loadRange([offset + atomSize, offset + atomSize + 8], {
        onSuccess: function () {
          self._loadAtom(mediaFileReader, offset + atomSize, parentAtomFullName, callbacks);
        },
        onError: callbacks.onError
      });
    }
  }

  _isContainerAtom(atomName) {
    return ["moov", "udta", "meta", "ilst"].indexOf(atomName) >= 0;
  }

  _canReadAtom(atomName) {
    return atomName !== "----";
  }

  _parseData(data, tagsToRead) {
    var tags = {};

    tagsToRead = this._expandShortcutTags(tagsToRead);
    this._readAtom(tags, data, 0, data.getSize(), tagsToRead);

    // create shortcuts for most common data.
    for (var name in SHORTCUTS) if (SHORTCUTS.hasOwnProperty(name)) {
      var tag = tags[SHORTCUTS[name]];
      if (tag) {
        if (name === "track") {
          tags[name] = tag.data.track;
        } else {
          tags[name] = tag.data;
        }
      }
    }

    return {
      "type": "MP4",
      "ftyp": data.getStringAt(8, 4),
      "version": data.getLongAt(12, true),
      "tags": tags
    };
  }

  _readAtom(tags, data, offset, length, tagsToRead, parentAtomFullName, indent) {
    indent = indent === undefined ? "" : indent + "  ";

    var seek = offset;
    while (seek < offset + length) {
      var atomSize = data.getLongAt(seek, true);
      if (atomSize == 0) {
        return;
      }
      var atomName = data.getStringAt(seek + 4, 4);

      // console.log(seek, parentAtomFullName, atomName, atomSize);
      if (this._isContainerAtom(atomName)) {
        if (atomName == "meta") {
          seek += 4; // next_item_id (uint32)
        }
        var atomFullName = (parentAtomFullName ? parentAtomFullName + "." : "") + atomName;
        this._readAtom(tags, data, seek + 8, atomSize - 8, tagsToRead, atomFullName, indent);
        return;
      }

      // Value atoms
      if ((!tagsToRead || tagsToRead.indexOf(atomName) >= 0) && parentAtomFullName === "moov.udta.meta.ilst" && this._canReadAtom(atomName)) {
        tags[atomName] = this._readMetadataAtom(data, seek);
      }

      seek += atomSize;
    }
  }

  _readMetadataAtom(data, offset) {
    // 16: name + size + "data" + size (4 bytes each)
    const METADATA_HEADER = 16;

    var atomSize = data.getLongAt(offset, true);
    var atomName = data.getStringAt(offset + 4, 4);

    var klass = data.getInteger24At(offset + METADATA_HEADER + 1, true);
    var type = TYPES[klass];
    var atomData;

    if (atomName == "trkn") {
      atomData = {
        "track": data.getByteAt(offset + METADATA_HEADER + 11),
        "total": data.getByteAt(offset + METADATA_HEADER + 13)
      };
    } else {
      // 4: atom version (1 byte) + atom flags (3 bytes)
      // 4: NULL (usually locale indicator)
      var atomHeader = METADATA_HEADER + 4 + 4;
      var dataStart = offset + atomHeader;
      var dataLength = atomSize - atomHeader;
      var atomData;

      switch (type) {
        case "text":
          atomData = data.getStringWithCharsetAt(dataStart, dataLength, "utf-8").toString();
          break;

        case "uint8":
          atomData = data.getShortAt(dataStart, false);
          break;

        case "jpeg":
        case "png":
          atomData = {
            "format": "image/" + type,
            "data": data.getBytesAt(dataStart, dataLength)
          };
          break;
      }
    }

    return {
      id: atomName,
      size: atomSize,
      description: ATOM_DESCRIPTIONS[atomName] || "Unknown",
      data: atomData
    };
  }

  getShortcuts() {
    return SHORTCUTS;
  }
}

const TYPES = {
  "0": "uint8",
  "1": "text",
  "13": "jpeg",
  "14": "png",
  "21": "uint8"
};

const ATOM_DESCRIPTIONS = {
  "©alb": "Album",
  "©ART": "Artist",
  "aART": "Album Artist",
  "©day": "Release Date",
  "©nam": "Title",
  "©gen": "Genre",
  "gnre": "Genre",
  "trkn": "Track Number",
  "©wrt": "Composer",
  "©too": "Encoding Tool",
  "©enc": "Encoded By",
  "cprt": "Copyright",
  "covr": "Cover Art",
  "©grp": "Grouping",
  "keyw": "Keywords",
  "©lyr": "Lyrics",
  "©cmt": "Comment",
  "tmpo": "Tempo",
  "cpil": "Compilation",
  "disk": "Disc Number",
  "tvsh": "TV Show Name",
  "tven": "TV Episode ID",
  "tvsn": "TV Season",
  "tves": "TV Episode",
  "tvnn": "TV Network",
  "desc": "Description",
  "ldes": "Long Description",
  "sonm": "Sort Name",
  "soar": "Sort Artist",
  "soaa": "Sort Album",
  "soco": "Sort Composer",
  "sosn": "Sort Show",
  "purd": "Purchase Date",
  "pcst": "Podcast",
  "purl": "Podcast URL",
  "catg": "Category",
  "hdvd": "HD Video",
  "stik": "Media Type",
  "rtng": "Content Rating",
  "pgap": "Gapless Playback",
  "apID": "Purchase Account",
  "sfID": "Country Code"
};

const UNSUPPORTED_ATOMS = {
  "----": 1
};

const SHORTCUTS = {
  "title": "©nam",
  "artist": "©ART",
  "album": "©alb",
  "year": "©day",
  "comment": "©cmt",
  "track": "trkn",
  "genre": "©gen",
  "picture": "covr",
  "lyrics": "©lyr"
};

module.exports = MP4TagReader;
},{"./MediaFileReader":85,"./MediaTagReader":86}],85:[function(require,module,exports){
'use strict';

const StringUtils = require('./StringUtils');

class MediaFileReader {

  constructor() {
    this._isInitialized = false;
    this._size = 0;
  }

  /**
   * Decides if this media file reader is able to read the given file.
   */
  static canReadFile(file) {
    throw new Error("Must implement canReadFile function");
  }

  /**
   * This function needs to be called before any other function.
   * Loads the necessary initial information from the file.
   */
  init(callbacks) {
    var self = this;

    if (this._isInitialized) {
      setTimeout(callbacks.onSuccess, 1);
    } else {
      return this._init({
        onSuccess: function () {
          self._isInitialized = true;
          callbacks.onSuccess();
        },
        onError: callbacks.onError
      });
    }
  }

  _init(callbacks) {
    throw new Error("Must implement init function");
  }

  /**
   * @param range The start and end indexes of the range to load.
   *        Ex: [0, 7] load bytes 0 to 7 inclusive.
   */
  loadRange(range, callbacks) {
    throw new Error("Must implement loadRange function");
  }

  /**
   * @return The size of the file in bytes.
   */
  getSize() {
    if (!this._isInitialized) {
      throw new Error("init() must be called first.");
    }

    return this._size;
  }

  getByteAt(offset) {
    throw new Error("Must implement getByteAt function");
  }

  getBytesAt(offset, length) {
    var bytes = new Array(length);
    for (var i = 0; i < length; i++) {
      bytes[i] = this.getByteAt(offset + i);
    }
    return bytes;
  }

  isBitSetAt(offset, bit) {
    var iByte = this.getByteAt(offset);
    return (iByte & 1 << bit) != 0;
  }

  getSByteAt(offset) {
    var iByte = this.getByteAt(offset);
    if (iByte > 127) {
      return iByte - 256;
    } else {
      return iByte;
    }
  }

  getShortAt(offset, isBigEndian) {
    var iShort = isBigEndian ? (this.getByteAt(offset) << 8) + this.getByteAt(offset + 1) : (this.getByteAt(offset + 1) << 8) + this.getByteAt(offset);
    if (iShort < 0) {
      iShort += 65536;
    }
    return iShort;
  }

  getSShortAt(offset, isBigEndian) {
    var iUShort = this.getShortAt(offset, isBigEndian);
    if (iUShort > 32767) {
      return iUShort - 65536;
    } else {
      return iUShort;
    }
  }

  getLongAt(offset, isBigEndian) {
    var iByte1 = this.getByteAt(offset),
        iByte2 = this.getByteAt(offset + 1),
        iByte3 = this.getByteAt(offset + 2),
        iByte4 = this.getByteAt(offset + 3);

    var iLong = isBigEndian ? (((iByte1 << 8) + iByte2 << 8) + iByte3 << 8) + iByte4 : (((iByte4 << 8) + iByte3 << 8) + iByte2 << 8) + iByte1;

    if (iLong < 0) {
      iLong += 4294967296;
    }

    return iLong;
  }

  getSLongAt(offset, isBigEndian) {
    var iULong = this.getLongAt(offset, isBigEndian);

    if (iULong > 2147483647) {
      return iULong - 4294967296;
    } else {
      return iULong;
    }
  }

  getInteger24At(offset, isBigEndian) {
    var iByte1 = this.getByteAt(offset),
        iByte2 = this.getByteAt(offset + 1),
        iByte3 = this.getByteAt(offset + 2);

    var iInteger = isBigEndian ? ((iByte1 << 8) + iByte2 << 8) + iByte3 : ((iByte3 << 8) + iByte2 << 8) + iByte1;

    if (iInteger < 0) {
      iInteger += 16777216;
    }

    return iInteger;
  }

  getStringAt(offset, length) {
    var string = [];
    for (var i = offset, j = 0; i < offset + length; i++, j++) {
      string[j] = String.fromCharCode(this.getByteAt(i));
    }
    return string.join("");
  }

  getStringWithCharsetAt(offset, length, charset) {
    var bytes = this.getBytesAt(offset, length);
    var string;

    switch ((charset || '').toLowerCase()) {
      case "utf-16":
      case "utf-16le":
      case "utf-16be":
        string = StringUtils.readUTF16String(bytes, charset === "utf-16be");
        break;

      case "utf-8":
        string = StringUtils.readUTF8String(bytes);
        break;

      default:
        string = StringUtils.readNullTerminatedString(bytes);
        break;
    }

    return string;
  }

  getCharAt(offset) {
    return String.fromCharCode(this.getByteAt(offset));
  }

  /**
   * The ID3v2 tag/frame size is encoded with four bytes where the most
   * significant bit (bit 7) is set to zero in every byte, making a total of 28
   * bits. The zeroed bits are ignored, so a 257 bytes long tag is represented
   * as $00 00 02 01.
   */
  getSynchsafeInteger32At(offset) {
    var size1 = this.getByteAt(offset);
    var size2 = this.getByteAt(offset + 1);
    var size3 = this.getByteAt(offset + 2);
    var size4 = this.getByteAt(offset + 3);
    // 0x7f = 0b01111111
    var size = size4 & 0x7f | (size3 & 0x7f) << 7 | (size2 & 0x7f) << 14 | (size1 & 0x7f) << 21;

    return size;
  }
}

module.exports = MediaFileReader;
},{"./StringUtils":88}],86:[function(require,module,exports){
'use strict';

const MediaFileReader = require('./MediaFileReader');

class MediaTagReader {

  constructor(mediaFileReader) {
    this._mediaFileReader = mediaFileReader;
    this._tags = null;
  }

  /**
   * Returns the byte range that needs to be loaded and fed to
   * _canReadTagFormat in order to identify if the file contains tag
   * information that can be read.
   */
  static getTagIdentifierByteRange() {
    throw new Error("Must implement");
  }

  /**
   * Given a tag identifier (read from the file byte positions speficied by
   * getTagIdentifierByteRange) this function checks if it can read the tag
   * format or not.
   */
  static canReadTagFormat(tagIdentifier) {
    throw new Error("Must implement");
  }

  setTagsToRead(tags) {
    this._tags = tags;
    return this;
  }

  read(callbacks) {
    var self = this;

    this._mediaFileReader.init({
      onSuccess: function () {
        self._loadData(self._mediaFileReader, {
          onSuccess: function () {
            var tags = self._parseData(self._mediaFileReader, self._tags);
            // TODO: destroy mediaFileReader
            callbacks.onSuccess(tags);
          },
          onError: callbacks.onError
        });
      },
      onError: callbacks.onError
    });
  }

  getShortcuts() {
    return {};
  }

  /**
   * Load the necessary bytes from the media file.
   */
  _loadData(mediaFileReader, callbacks) {
    throw new Error("Must implement _loadData function");
  }

  /**
   * Parse the loaded data to read the media tags.
   */
  _parseData(mediaFileReader, tags) {
    throw new Error("Must implement _parseData function");
  }

  _expandShortcutTags(tagsWithShortcuts) {
    if (!tagsWithShortcuts) {
      return null;
    }

    var tags = [];
    var shortcuts = this.getShortcuts();
    for (var i = 0, tagOrShortcut; tagOrShortcut = tagsWithShortcuts[i]; i++) {
      tags = tags.concat(shortcuts[tagOrShortcut] || [tagOrShortcut]);
    }

    return tags;
  }
}

module.exports = MediaTagReader;
},{"./MediaFileReader":85}],87:[function(require,module,exports){
(function (process,Buffer){
'use strict';

const fs = require('fs');

const ChunkedFileData = require('./ChunkedFileData');
const MediaFileReader = require('./MediaFileReader');

class NodeFileReader extends MediaFileReader {

  constructor(path) {
    super();
    this._path = path;
    this._fileData = new ChunkedFileData();
  }

  static canReadFile(file) {
    return typeof file === 'string' && !/^[a-z]+:\/\//i.test(file);
  }

  getByteAt(offset) {
    return this._fileData.getByteAt(offset);
  }

  _init(callbacks) {
    var self = this;

    fs.stat(self._path, function (err, stats) {
      if (err) {
        if (callbacks.onError) {
          callbacks.onError({ "type": "fs", "info": err });
        }
      } else {
        self._size = stats.size;
        callbacks.onSuccess();
      }
    });
  }

  loadRange(range, callbacks) {
    var fd = -1;
    var self = this;
    var fileData = this._fileData;

    var length = range[1] - range[0] + 1;
    var onSuccess = callbacks.onSuccess;
    var onError = callbacks.onError || function () {};

    if (fileData.hasDataRange(range[0], range[1])) {
      process.nextTick(onSuccess);
      return;
    }

    var readData = function (err, _fd) {
      if (err) {
        onError({ "type": "fs", "info": err });
        return;
      }

      fd = _fd;
      // TODO: Should create a pool of Buffer objects across all instances of
      //       NodeFileReader. This is fine for now.
      var buffer = new Buffer(length);
      fs.read(_fd, buffer, 0, length, range[0], processData);
    };

    var processData = function (err, bytesRead, buffer) {
      fs.close(fd, function (err) {
        if (err) {
          console.error(err);
        }
      });

      if (err) {
        onError({ "type": "fs", "info": err });
        return;
      }

      storeBuffer(buffer);
      onSuccess();
    };

    var storeBuffer = function (buffer) {
      var data = Array.prototype.slice.call(buffer, 0, length);
      fileData.addData(range[0], data);
    };

    fs.open(this._path, "r", undefined, readData);
  }
}

module.exports = NodeFileReader;
}).call(this,require('_process'),require("buffer").Buffer)
},{"./ChunkedFileData":80,"./MediaFileReader":85,"_process":41,"buffer":33,"fs":31}],88:[function(require,module,exports){
'use strict';

class InternalDecodedString {

  constructor(value, bytesReadCount) {
    this._value = value;
    this.bytesReadCount = bytesReadCount;
    this.length = value.length;
  }

  toString() {
    return this._value;
  }
}

var StringUtils = {
  readUTF16String: function (bytes, bigEndian, maxBytes) {
    var ix = 0;
    var offset1 = 1,
        offset2 = 0;

    maxBytes = Math.min(maxBytes || bytes.length, bytes.length);

    if (bytes[0] == 0xFE && bytes[1] == 0xFF) {
      bigEndian = true;
      ix = 2;
    } else if (bytes[0] == 0xFF && bytes[1] == 0xFE) {
      bigEndian = false;
      ix = 2;
    }
    if (bigEndian) {
      offset1 = 0;
      offset2 = 1;
    }

    var arr = [];
    for (var j = 0; ix < maxBytes; j++) {
      var byte1 = bytes[ix + offset1];
      var byte2 = bytes[ix + offset2];
      var word1 = (byte1 << 8) + byte2;
      ix += 2;
      if (word1 == 0x0000) {
        break;
      } else if (byte1 < 0xD8 || byte1 >= 0xE0) {
        arr[j] = String.fromCharCode(word1);
      } else {
        var byte3 = bytes[ix + offset1];
        var byte4 = bytes[ix + offset2];
        var word2 = (byte3 << 8) + byte4;
        ix += 2;
        arr[j] = String.fromCharCode(word1, word2);
      }
    }
    return new InternalDecodedString(arr.join(""), ix);
  },

  readUTF8String: function (bytes, maxBytes) {
    var ix = 0;
    maxBytes = Math.min(maxBytes || bytes.length, bytes.length);

    if (bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF) {
      ix = 3;
    }

    var arr = [];
    for (var j = 0; ix < maxBytes; j++) {
      var byte1 = bytes[ix++];
      if (byte1 == 0x00) {
        break;
      } else if (byte1 < 0x80) {
        arr[j] = String.fromCharCode(byte1);
      } else if (byte1 >= 0xC2 && byte1 < 0xE0) {
        var byte2 = bytes[ix++];
        arr[j] = String.fromCharCode(((byte1 & 0x1F) << 6) + (byte2 & 0x3F));
      } else if (byte1 >= 0xE0 && byte1 < 0xF0) {
        var byte2 = bytes[ix++];
        var byte3 = bytes[ix++];
        arr[j] = String.fromCharCode(((byte1 & 0xFF) << 12) + ((byte2 & 0x3F) << 6) + (byte3 & 0x3F));
      } else if (byte1 >= 0xF0 && byte1 < 0xF5) {
        var byte2 = bytes[ix++];
        var byte3 = bytes[ix++];
        var byte4 = bytes[ix++];
        var codepoint = ((byte1 & 0x07) << 18) + ((byte2 & 0x3F) << 12) + ((byte3 & 0x3F) << 6) + (byte4 & 0x3F) - 0x10000;
        arr[j] = String.fromCharCode((codepoint >> 10) + 0xD800, (codepoint & 0x3FF) + 0xDC00);
      }
    }
    return new InternalDecodedString(arr.join(""), ix);
  },

  readNullTerminatedString: function (bytes, maxBytes) {
    var arr = [];
    maxBytes = maxBytes || bytes.length;
    for (var i = 0; i < maxBytes;) {
      var byte1 = bytes[i++];
      if (byte1 == 0x00) {
        break;
      }
      arr[i - 1] = String.fromCharCode(byte1);
    }
    return new InternalDecodedString(arr.join(""), i);
  }
};

module.exports = StringUtils;
},{}],89:[function(require,module,exports){
'use strict';

const ChunkedFileData = require('./ChunkedFileData');
const MediaFileReader = require('./MediaFileReader');

const CHUNK_SIZE = 1024;

class XhrFileReader extends MediaFileReader {

  constructor(url) {
    super();
    this._url = url;
    this._fileData = new ChunkedFileData();
  }

  static canReadFile(file) {
    return typeof file === 'string' && /^[a-z]+:\/\//i.test(file);
  }

  static setConfig(config) {
    for (var key in config) if (config.hasOwnProperty(key)) {
      this._config[key] = config[key];
    }

    var disallowedXhrHeaders = this._config.disallowedXhrHeaders;
    for (var i = 0; i < disallowedXhrHeaders.length; i++) {
      disallowedXhrHeaders[i] = disallowedXhrHeaders[i].toLowerCase();
    }
  }

  _init(callbacks) {
    if (XhrFileReader._config.avoidHeadRequests) {
      this._fetchSizeWithGetRequest(callbacks);
    } else {
      this._fetchSizeWithHeadRequest(callbacks);
    }
  }

  _fetchSizeWithHeadRequest(callbacks) {
    var self = this;

    this._makeXHRRequest("HEAD", null, {
      onSuccess: function (xhr) {
        var contentLength = self._parseContentLength(xhr);
        if (contentLength) {
          self._size = contentLength;
          callbacks.onSuccess();
        } else {
          // Content-Length not provided by the server, fallback to
          // GET requests.
          self._fetchSizeWithGetRequest(callbacks);
        }
      },
      onError: callbacks.onError
    });
  }

  _fetchSizeWithGetRequest(callbacks) {
    var self = this;
    var range = this._roundRangeToChunkMultiple([0, 0]);

    this._makeXHRRequest("GET", range, {
      onSuccess: function (xhr) {
        var contentRange = self._parseContentRange(xhr);
        var data = self._getXhrResponseContent(xhr);

        if (contentRange) {
          if (contentRange.instanceLength == null) {
            // Last resort, server is not able to tell us the content length,
            // need to fetch entire file then.
            self._fetchEntireFile(callbacks);
            return;
          }
          self._size = contentRange.instanceLength;
        } else {
          // Range request not supported, we got the entire file
          self._size = data.length;
        }

        self._fileData.addData(0, data);
        callbacks.onSuccess();
      },
      onError: callbacks.onError
    });
  }

  _fetchEntireFile(callbacks) {
    var self = this;
    this._makeXHRRequest("GET", null, {
      onSuccess: function (xhr) {
        var data = self._getXhrResponseContent(xhr);
        self._size = data.length;
        self._fileData.addData(0, data);
        callbacks.onSuccess();
      },
      onError: callbacks.onError
    });
  }

  _getXhrResponseContent(xhr) {
    return xhr.responseBody || xhr.responseText || "";
  }

  _parseContentLength(xhr) {
    var contentLength = this._getResponseHeader(xhr, "Content-Length");

    if (contentLength == null) {
      return contentLength;
    } else {
      return parseInt(contentLength, 10);
    }
  }

  _parseContentRange(xhr) {
    var contentRange = this._getResponseHeader(xhr, "Content-Range");

    if (contentRange) {
      var parsedContentRange = contentRange.match(/bytes (\d+)-(\d+)\/(?:(\d+)|\*)/i);
      if (!parsedContentRange) {
        throw new Error("FIXME: Unknown Content-Range syntax: ", contentRange);
      }

      return {
        firstBytePosition: parseInt(parsedContentRange[1], 10),
        lastBytePosition: parseInt(parsedContentRange[2], 10),
        instanceLength: parsedContentRange[3] ? parseInt(parsedContentRange[3], 10) : null
      };
    } else {
      return null;
    }
  }

  loadRange(range, callbacks) {
    var self = this;

    if (self._fileData.hasDataRange(range[0], Math.min(self._size, range[1]))) {
      setTimeout(callbacks.onSuccess, 1);
      return;
    }

    // Always download in multiples of CHUNK_SIZE. If we're going to make a
    // request might as well get a chunk that makes sense. The big cost is
    // establishing the connection so getting 10bytes or 1K doesn't really
    // make a difference.
    range = this._roundRangeToChunkMultiple(range);

    // Upper range should not be greater than max file size
    range[1] = Math.min(self._size, range[1]);

    this._makeXHRRequest("GET", range, {
      onSuccess: function (xhr) {
        var data = self._getXhrResponseContent(xhr);
        self._fileData.addData(range[0], data);
        callbacks.onSuccess();
      },
      onError: callbacks.onError
    });
  }

  _roundRangeToChunkMultiple(range) {
    var length = range[1] - range[0] + 1;
    var newLength = Math.ceil(length / CHUNK_SIZE) * CHUNK_SIZE;
    return [range[0], range[0] + newLength - 1];
  }

  _makeXHRRequest(method, range, callbacks) {
    var xhr = this._createXHRObject();

    var onXHRLoad = function () {
      // 200 - OK
      // 206 - Partial Content
      // $FlowIssue - xhr will not be null here
      if (xhr.status === 200 || xhr.status === 206) {
        callbacks.onSuccess(xhr);
      } else if (callbacks.onError) {
        callbacks.onError({
          "type": "xhr",
          "info": "Unexpected HTTP status " + xhr.status + ".",
          "xhr": xhr
        });
      }
      xhr = null;
    };

    if (typeof xhr.onload !== 'undefined') {
      xhr.onload = onXHRLoad;
      xhr.onerror = function () {
        if (callbacks.onError) {
          callbacks.onError({
            "type": "xhr",
            "info": "Generic XHR error, check xhr object.",
            "xhr": xhr
          });
        }
      };
    } else {
      xhr.onreadystatechange = function () {
        // $FlowIssue - xhr will not be null here
        if (xhr.readyState === 4) {
          onXHRLoad();
        }
      };
    }

    if (XhrFileReader._config.timeoutInSec) {
      xhr.timeout = XhrFileReader._config.timeoutInSec * 1000;
      xhr.ontimeout = function () {
        if (callbacks.onError) {
          callbacks.onError({
            "type": "xhr",
            // $FlowIssue - xhr.timeout will not be null
            "info": "Timeout after " + xhr.timeout / 1000 + "s. Use jsmediatags.Config.setXhrTimeout to override.",
            "xhr": xhr
          });
        }
      };
    }

    xhr.open(method, this._url);
    xhr.overrideMimeType("text/plain; charset=x-user-defined");
    if (range) {
      this._setRequestHeader(xhr, "Range", "bytes=" + range[0] + "-" + range[1]);
    }
    this._setRequestHeader(xhr, "If-Modified-Since", "Sat, 01 Jan 1970 00:00:00 GMT");
    xhr.send(null);
  }

  _setRequestHeader(xhr, headerName, headerValue) {
    if (XhrFileReader._config.disallowedXhrHeaders.indexOf(headerName.toLowerCase()) < 0) {
      xhr.setRequestHeader(headerName, headerValue);
    }
  }

  _hasResponseHeader(xhr, headerName) {
    var allResponseHeaders = xhr.getAllResponseHeaders();

    if (!allResponseHeaders) {
      return false;
    }

    var headers = allResponseHeaders.split("\r\n");
    var headerNames = [];
    for (var i = 0; i < headers.length; i++) {
      headerNames[i] = headers[i].split(":")[0].toLowerCase();
    }

    return headerNames.indexOf(headerName.toLowerCase()) >= 0;
  }

  _getResponseHeader(xhr, headerName) {
    if (!this._hasResponseHeader(xhr, headerName)) {
      return null;
    }

    return xhr.getResponseHeader(headerName);
  }

  getByteAt(offset) {
    var character = this._fileData.getByteAt(offset);
    return character.charCodeAt(0) & 0xff;
  }

  _createXHRObject() {
    if (typeof window === "undefined") {
      // $FlowIssue - flow is not able to recognize this module.
      return new (require("xhr2").XMLHttpRequest)();
    }

    if (window.XMLHttpRequest) {
      return new window.XMLHttpRequest();
    }

    throw new Error("XMLHttpRequest is not supported");
  }
}

XhrFileReader._config = {
  avoidHeadRequests: false,
  disallowedXhrHeaders: [],
  timeoutInSec: 30
};

module.exports = XhrFileReader;
},{"./ChunkedFileData":80,"./MediaFileReader":85,"xhr2":91}],90:[function(require,module,exports){
(function (process){
'use strict';

const MediaFileReader = require("./MediaFileReader");
const NodeFileReader = require("./NodeFileReader");
const XhrFileReader = require("./XhrFileReader");
const BlobFileReader = require("./BlobFileReader");
const ArrayFileReader = require("./ArrayFileReader");
const MediaTagReader = require("./MediaTagReader");
const ID3v1TagReader = require("./ID3v1TagReader");
const ID3v2TagReader = require("./ID3v2TagReader");
const MP4TagReader = require("./MP4TagReader");

var mediaFileReaders = [];
var mediaTagReaders = [];

function read(location, callbacks) {
  new Reader(location).read(callbacks);
}

class Reader {

  constructor(file) {
    this._file = file;
  }

  setTagsToRead(tagsToRead) {
    this._tagsToRead = tagsToRead;
    return this;
  }

  setFileReader(fileReader) {
    this._fileReader = fileReader;
    return this;
  }

  setTagReader(tagReader) {
    this._tagReader = tagReader;
    return this;
  }

  read(callbacks) {
    var FileReader = this._getFileReader();
    var fileReader = new FileReader(this._file);
    var self = this;

    fileReader.init({
      onSuccess: function () {
        self._getTagReader(fileReader, {
          onSuccess: function (TagReader) {
            new TagReader(fileReader).setTagsToRead(self._tagsToRead).read(callbacks);
          },
          onError: callbacks.onError
        });
      },
      onError: callbacks.onError
    });
  }

  _getFileReader() {
    if (this._fileReader) {
      return this._fileReader;
    } else {
      return this._findFileReader();
    }
  }

  _findFileReader() {
    for (var i = 0; i < mediaFileReaders.length; i++) {
      if (mediaFileReaders[i].canReadFile(this._file)) {
        return mediaFileReaders[i];
      }
    }

    throw new Error("No suitable file reader found for ", this._file);
  }

  _getTagReader(fileReader, callbacks) {
    if (this._tagReader) {
      var tagReader = this._tagReader;
      setTimeout(function () {
        callbacks.onSuccess(tagReader);
      }, 1);
    } else {
      this._findTagReader(fileReader, callbacks);
    }
  }

  _findTagReader(fileReader, callbacks) {
    // We don't want to make multiple fetches per tag reader to get the tag
    // identifier. The strategy here is to combine all the tag identifier
    // ranges into one and make a single fetch. This is particularly important
    // in file readers that have expensive loads like the XHR one.
    // However, with this strategy we run into the problem of loading the
    // entire file because tag identifiers might be at the start or end of
    // the file.
    // To get around this we divide the tag readers into two categories, the
    // ones that read their tag identifiers from the start of the file and the
    // ones that read from the end of the file.
    var tagReadersAtFileStart = [];
    var tagReadersAtFileEnd = [];
    var fileSize = fileReader.getSize();

    for (var i = 0; i < mediaTagReaders.length; i++) {
      var range = mediaTagReaders[i].getTagIdentifierByteRange();
      if (range.offset >= 0 && range.offset < fileSize / 2 || range.offset < 0 && range.offset < -fileSize / 2) {
        tagReadersAtFileStart.push(mediaTagReaders[i]);
      } else {
        tagReadersAtFileEnd.push(mediaTagReaders[i]);
      }
    }

    var tagsLoaded = false;
    var loadTagIdentifiersCallbacks = {
      onSuccess: function () {
        if (!tagsLoaded) {
          // We're expecting to load two sets of tag identifiers. This flag
          // indicates when the first one has been loaded.
          tagsLoaded = true;
          return;
        }

        for (var i = 0; i < mediaTagReaders.length; i++) {
          var range = mediaTagReaders[i].getTagIdentifierByteRange();
          var tagIndentifier = fileReader.getBytesAt(range.offset >= 0 ? range.offset : range.offset + fileSize, range.length);

          if (mediaTagReaders[i].canReadTagFormat(tagIndentifier)) {
            callbacks.onSuccess(mediaTagReaders[i]);
            return;
          }
        }

        if (callbacks.onError) {
          callbacks.onError({
            "type": "tagFormat",
            "info": "No suitable tag reader found"
          });
        }
      },
      onError: callbacks.onError
    };

    this._loadTagIdentifierRanges(fileReader, tagReadersAtFileStart, loadTagIdentifiersCallbacks);
    this._loadTagIdentifierRanges(fileReader, tagReadersAtFileEnd, loadTagIdentifiersCallbacks);
  }

  _loadTagIdentifierRanges(fileReader, tagReaders, callbacks) {
    if (tagReaders.length === 0) {
      // Force async
      setTimeout(callbacks.onSuccess, 1);
      return;
    }

    var tagIdentifierRange = [Number.MAX_VALUE, 0];
    var fileSize = fileReader.getSize();

    // Create a super set of all ranges so we can load them all at once.
    // Might need to rethink this approach if there are tag ranges too far
    // a part from each other. We're good for now though.
    for (var i = 0; i < tagReaders.length; i++) {
      var range = tagReaders[i].getTagIdentifierByteRange();
      var start = range.offset >= 0 ? range.offset : range.offset + fileSize;
      var end = start + range.length - 1;

      tagIdentifierRange[0] = Math.min(start, tagIdentifierRange[0]);
      tagIdentifierRange[1] = Math.max(end, tagIdentifierRange[1]);
    }

    fileReader.loadRange(tagIdentifierRange, callbacks);
  }
}

class Config {
  static addFileReader(fileReader) {
    mediaFileReaders.push(fileReader);
    return Config;
  }

  static addTagReader(tagReader) {
    mediaTagReaders.push(tagReader);
    return Config;
  }

  static removeTagReader(tagReader) {
    var tagReaderIx = mediaTagReaders.indexOf(tagReader);

    if (tagReaderIx >= 0) {
      mediaTagReaders.splice(tagReaderIx, 1);
    }

    return Config;
  }

  static EXPERIMENTAL_avoidHeadRequests() {
    XhrFileReader.setConfig({
      avoidHeadRequests: true
    });
  }

  static setDisallowedXhrHeaders(disallowedXhrHeaders) {
    XhrFileReader.setConfig({
      disallowedXhrHeaders: disallowedXhrHeaders
    });
  }

  static setXhrTimeoutInSec(timeoutInSec) {
    XhrFileReader.setConfig({
      timeoutInSec: timeoutInSec
    });
  }
}

Config.addFileReader(XhrFileReader).addFileReader(BlobFileReader).addFileReader(ArrayFileReader).addTagReader(ID3v2TagReader).addTagReader(ID3v1TagReader).addTagReader(MP4TagReader);

if (typeof process !== "undefined") {
  Config.addFileReader(NodeFileReader);
}

module.exports = {
  "read": read,
  "Reader": Reader,
  "Config": Config
};
}).call(this,require('_process'))
},{"./ArrayFileReader":78,"./BlobFileReader":79,"./ID3v1TagReader":81,"./ID3v2TagReader":83,"./MP4TagReader":84,"./MediaFileReader":85,"./MediaTagReader":86,"./NodeFileReader":87,"./XhrFileReader":89,"_process":41}],91:[function(require,module,exports){
module.exports = XMLHttpRequest;

},{}],92:[function(require,module,exports){
(function (global){
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var t;t="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,t.localforage=e()}}(function(){return function e(t,r,n){function o(a,u){if(!r[a]){if(!t[a]){var c="function"==typeof require&&require;if(!u&&c)return c(a,!0);if(i)return i(a,!0);var f=new Error("Cannot find module '"+a+"'");throw f.code="MODULE_NOT_FOUND",f}var s=r[a]={exports:{}};t[a][0].call(s.exports,function(e){var r=t[a][1][e];return o(r?r:e)},s,s.exports,e,t,r,n)}return r[a].exports}for(var i="function"==typeof require&&require,a=0;a<n.length;a++)o(n[a]);return o}({1:[function(e,t,r){"use strict";function n(){}function o(e){if("function"!=typeof e)throw new TypeError("resolver must be a function");this.state=b,this.queue=[],this.outcome=void 0,e!==n&&c(this,e)}function i(e,t,r){this.promise=e,"function"==typeof t&&(this.onFulfilled=t,this.callFulfilled=this.otherCallFulfilled),"function"==typeof r&&(this.onRejected=r,this.callRejected=this.otherCallRejected)}function a(e,t,r){h(function(){var n;try{n=t(r)}catch(t){return y.reject(e,t)}n===e?y.reject(e,new TypeError("Cannot resolve promise with itself")):y.resolve(e,n)})}function u(e){var t=e&&e.then;if(e&&"object"==typeof e&&"function"==typeof t)return function(){t.apply(e,arguments)}}function c(e,t){function r(t){i||(i=!0,y.reject(e,t))}function n(t){i||(i=!0,y.resolve(e,t))}function o(){t(n,r)}var i=!1,a=f(o);"error"===a.status&&r(a.value)}function f(e,t){var r={};try{r.value=e(t),r.status="success"}catch(e){r.status="error",r.value=e}return r}function s(e){return e instanceof this?e:y.resolve(new this(n),e)}function l(e){var t=new this(n);return y.reject(t,e)}function d(e){function t(e,t){function n(e){a[t]=e,++u!==o||i||(i=!0,y.resolve(f,a))}r.resolve(e).then(n,function(e){i||(i=!0,y.reject(f,e))})}var r=this;if("[object Array]"!==Object.prototype.toString.call(e))return this.reject(new TypeError("must be an array"));var o=e.length,i=!1;if(!o)return this.resolve([]);for(var a=new Array(o),u=0,c=-1,f=new this(n);++c<o;)t(e[c],c);return f}function v(e){function t(e){r.resolve(e).then(function(e){i||(i=!0,y.resolve(u,e))},function(e){i||(i=!0,y.reject(u,e))})}var r=this;if("[object Array]"!==Object.prototype.toString.call(e))return this.reject(new TypeError("must be an array"));var o=e.length,i=!1;if(!o)return this.resolve([]);for(var a=-1,u=new this(n);++a<o;)t(e[a]);return u}var h=e(2),y={},p=["REJECTED"],g=["FULFILLED"],b=["PENDING"];t.exports=r=o,o.prototype.catch=function(e){return this.then(null,e)},o.prototype.then=function(e,t){if("function"!=typeof e&&this.state===g||"function"!=typeof t&&this.state===p)return this;var r=new this.constructor(n);if(this.state!==b){var o=this.state===g?e:t;a(r,o,this.outcome)}else this.queue.push(new i(r,e,t));return r},i.prototype.callFulfilled=function(e){y.resolve(this.promise,e)},i.prototype.otherCallFulfilled=function(e){a(this.promise,this.onFulfilled,e)},i.prototype.callRejected=function(e){y.reject(this.promise,e)},i.prototype.otherCallRejected=function(e){a(this.promise,this.onRejected,e)},y.resolve=function(e,t){var r=f(u,t);if("error"===r.status)return y.reject(e,r.value);var n=r.value;if(n)c(e,n);else{e.state=g,e.outcome=t;for(var o=-1,i=e.queue.length;++o<i;)e.queue[o].callFulfilled(t)}return e},y.reject=function(e,t){e.state=p,e.outcome=t;for(var r=-1,n=e.queue.length;++r<n;)e.queue[r].callRejected(t);return e},r.resolve=s,r.reject=l,r.all=d,r.race=v},{2:2}],2:[function(e,t,r){(function(e){"use strict";function r(){s=!0;for(var e,t,r=l.length;r;){for(t=l,l=[],e=-1;++e<r;)t[e]();r=l.length}s=!1}function n(e){1!==l.push(e)||s||o()}var o,i=e.MutationObserver||e.WebKitMutationObserver;if(i){var a=0,u=new i(r),c=e.document.createTextNode("");u.observe(c,{characterData:!0}),o=function(){c.data=a=++a%2}}else if(e.setImmediate||"undefined"==typeof e.MessageChannel)o="document"in e&&"onreadystatechange"in e.document.createElement("script")?function(){var t=e.document.createElement("script");t.onreadystatechange=function(){r(),t.onreadystatechange=null,t.parentNode.removeChild(t),t=null},e.document.documentElement.appendChild(t)}:function(){setTimeout(r,0)};else{var f=new e.MessageChannel;f.port1.onmessage=r,o=function(){f.port2.postMessage(0)}}var s,l=[];t.exports=n}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],3:[function(e,t,r){(function(t){"use strict";"function"!=typeof t.Promise&&(t.Promise=e(1))}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{1:1}],4:[function(e,t,r){"use strict";function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(){return"undefined"!=typeof indexedDB?indexedDB:"undefined"!=typeof webkitIndexedDB?webkitIndexedDB:"undefined"!=typeof mozIndexedDB?mozIndexedDB:"undefined"!=typeof OIndexedDB?OIndexedDB:"undefined"!=typeof msIndexedDB?msIndexedDB:void 0}function i(){try{return!!ie&&(!("undefined"!=typeof openDatabase&&"undefined"!=typeof navigator&&navigator.userAgent&&/Safari/.test(navigator.userAgent)&&!/Chrome/.test(navigator.userAgent))&&(ie&&"function"==typeof ie.open&&"undefined"!=typeof IDBKeyRange))}catch(e){return!1}}function a(){return"function"==typeof openDatabase}function u(){try{return"undefined"!=typeof localStorage&&"setItem"in localStorage&&localStorage.setItem}catch(e){return!1}}function c(e,t){e=e||[],t=t||{};try{return new Blob(e,t)}catch(i){if("TypeError"!==i.name)throw i;for(var r="undefined"!=typeof BlobBuilder?BlobBuilder:"undefined"!=typeof MSBlobBuilder?MSBlobBuilder:"undefined"!=typeof MozBlobBuilder?MozBlobBuilder:WebKitBlobBuilder,n=new r,o=0;o<e.length;o+=1)n.append(e[o]);return n.getBlob(t.type)}}function f(e,t){t&&e.then(function(e){t(null,e)},function(e){t(e)})}function s(e){for(var t=e.length,r=new ArrayBuffer(t),n=new Uint8Array(r),o=0;o<t;o++)n[o]=e.charCodeAt(o);return r}function l(e){return new ce(function(t){var r=c([""]);e.objectStore(fe).put(r,"key"),e.onabort=function(e){e.preventDefault(),e.stopPropagation(),t(!1)},e.oncomplete=function(){var e=navigator.userAgent.match(/Chrome\/(\d+)/),r=navigator.userAgent.match(/Edge\//);t(r||!e||parseInt(e[1],10)>=43)}}).catch(function(){return!1})}function d(e){return"boolean"==typeof ae?ce.resolve(ae):l(e).then(function(e){return ae=e})}function v(e){var t=ue[e.name],r={};r.promise=new ce(function(e){r.resolve=e}),t.deferredOperations.push(r),t.dbReady?t.dbReady=t.dbReady.then(function(){return r.promise}):t.dbReady=r.promise}function h(e){var t=ue[e.name],r=t.deferredOperations.pop();r&&r.resolve()}function y(e,t){return new ce(function(r,n){if(e.db){if(!t)return r(e.db);v(e),e.db.close()}var o=[e.name];t&&o.push(e.version);var i=ie.open.apply(ie,o);t&&(i.onupgradeneeded=function(t){var r=i.result;try{r.createObjectStore(e.storeName),t.oldVersion<=1&&r.createObjectStore(fe)}catch(r){if("ConstraintError"!==r.name)throw r;console.warn('The database "'+e.name+'" has been upgraded from version '+t.oldVersion+" to version "+t.newVersion+', but the storage "'+e.storeName+'" already exists.')}}),i.onerror=function(){n(i.error)},i.onsuccess=function(){r(i.result),h(e)}})}function p(e){return y(e,!1)}function g(e){return y(e,!0)}function b(e,t){if(!e.db)return!0;var r=!e.db.objectStoreNames.contains(e.storeName),n=e.version<e.db.version,o=e.version>e.db.version;if(n&&(e.version!==t&&console.warn('The database "'+e.name+"\" can't be downgraded from version "+e.db.version+" to version "+e.version+"."),e.version=e.db.version),o||r){if(r){var i=e.db.version+1;i>e.version&&(e.version=i)}return!0}return!1}function m(e){return new ce(function(t,r){var n=new FileReader;n.onerror=r,n.onloadend=function(r){var n=btoa(r.target.result||"");t({__local_forage_encoded_blob:!0,data:n,type:e.type})},n.readAsBinaryString(e)})}function _(e){var t=s(atob(e.data));return c([t],{type:e.type})}function w(e){return e&&e.__local_forage_encoded_blob}function S(e){var t=this,r=t._initReady().then(function(){var e=ue[t._dbInfo.name];if(e&&e.dbReady)return e.dbReady});return r.then(e,e),r}function E(e){function t(){return ce.resolve()}var r=this,n={db:null};if(e)for(var o in e)n[o]=e[o];ue||(ue={});var i=ue[n.name];i||(i={forages:[],db:null,dbReady:null,deferredOperations:[]},ue[n.name]=i),i.forages.push(r),r._initReady||(r._initReady=r.ready,r.ready=S);for(var a=[],u=0;u<i.forages.length;u++){var c=i.forages[u];c!==r&&a.push(c._initReady().catch(t))}var f=i.forages.slice(0);return ce.all(a).then(function(){return n.db=i.db,p(n)}).then(function(e){return n.db=e,b(n,r._defaultConfig.version)?g(n):e}).then(function(e){n.db=i.db=e,r._dbInfo=n;for(var t=0;t<f.length;t++){var o=f[t];o!==r&&(o._dbInfo.db=n.db,o._dbInfo.version=n.version)}})}function I(e,t){var r=this;"string"!=typeof e&&(console.warn(e+" used as a key, but it is not a string."),e=String(e));var n=new ce(function(t,n){r.ready().then(function(){var o=r._dbInfo,i=o.db.transaction(o.storeName,"readonly").objectStore(o.storeName),a=i.get(e);a.onsuccess=function(){var e=a.result;void 0===e&&(e=null),w(e)&&(e=_(e)),t(e)},a.onerror=function(){n(a.error)}}).catch(n)});return f(n,t),n}function A(e,t){var r=this,n=new ce(function(t,n){r.ready().then(function(){var o=r._dbInfo,i=o.db.transaction(o.storeName,"readonly").objectStore(o.storeName),a=i.openCursor(),u=1;a.onsuccess=function(){var r=a.result;if(r){var n=r.value;w(n)&&(n=_(n));var o=e(n,r.key,u++);void 0!==o?t(o):r.continue()}else t()},a.onerror=function(){n(a.error)}}).catch(n)});return f(n,t),n}function N(e,t,r){var n=this;"string"!=typeof e&&(console.warn(e+" used as a key, but it is not a string."),e=String(e));var o=new ce(function(r,o){var i;n.ready().then(function(){return i=n._dbInfo,t instanceof Blob?d(i.db).then(function(e){return e?t:m(t)}):t}).then(function(t){var n=i.db.transaction(i.storeName,"readwrite"),a=n.objectStore(i.storeName);null===t&&(t=void 0),n.oncomplete=function(){void 0===t&&(t=null),r(t)},n.onabort=n.onerror=function(){var e=u.error?u.error:u.transaction.error;o(e)};var u=a.put(t,e)}).catch(o)});return f(o,r),o}function D(e,t){var r=this;"string"!=typeof e&&(console.warn(e+" used as a key, but it is not a string."),e=String(e));var n=new ce(function(t,n){r.ready().then(function(){var o=r._dbInfo,i=o.db.transaction(o.storeName,"readwrite"),a=i.objectStore(o.storeName),u=a.delete(e);i.oncomplete=function(){t()},i.onerror=function(){n(u.error)},i.onabort=function(){var e=u.error?u.error:u.transaction.error;n(e)}}).catch(n)});return f(n,t),n}function j(e){var t=this,r=new ce(function(e,r){t.ready().then(function(){var n=t._dbInfo,o=n.db.transaction(n.storeName,"readwrite"),i=o.objectStore(n.storeName),a=i.clear();o.oncomplete=function(){e()},o.onabort=o.onerror=function(){var e=a.error?a.error:a.transaction.error;r(e)}}).catch(r)});return f(r,e),r}function O(e){var t=this,r=new ce(function(e,r){t.ready().then(function(){var n=t._dbInfo,o=n.db.transaction(n.storeName,"readonly").objectStore(n.storeName),i=o.count();i.onsuccess=function(){e(i.result)},i.onerror=function(){r(i.error)}}).catch(r)});return f(r,e),r}function R(e,t){var r=this,n=new ce(function(t,n){return e<0?void t(null):void r.ready().then(function(){var o=r._dbInfo,i=o.db.transaction(o.storeName,"readonly").objectStore(o.storeName),a=!1,u=i.openCursor();u.onsuccess=function(){var r=u.result;return r?void(0===e?t(r.key):a?t(r.key):(a=!0,r.advance(e))):void t(null)},u.onerror=function(){n(u.error)}}).catch(n)});return f(n,t),n}function k(e){var t=this,r=new ce(function(e,r){t.ready().then(function(){var n=t._dbInfo,o=n.db.transaction(n.storeName,"readonly").objectStore(n.storeName),i=o.openCursor(),a=[];i.onsuccess=function(){var t=i.result;return t?(a.push(t.key),void t.continue()):void e(a)},i.onerror=function(){r(i.error)}}).catch(r)});return f(r,e),r}function B(e){var t,r,n,o,i,a=.75*e.length,u=e.length,c=0;"="===e[e.length-1]&&(a--,"="===e[e.length-2]&&a--);var f=new ArrayBuffer(a),s=new Uint8Array(f);for(t=0;t<u;t+=4)r=le.indexOf(e[t]),n=le.indexOf(e[t+1]),o=le.indexOf(e[t+2]),i=le.indexOf(e[t+3]),s[c++]=r<<2|n>>4,s[c++]=(15&n)<<4|o>>2,s[c++]=(3&o)<<6|63&i;return f}function x(e){var t,r=new Uint8Array(e),n="";for(t=0;t<r.length;t+=3)n+=le[r[t]>>2],n+=le[(3&r[t])<<4|r[t+1]>>4],n+=le[(15&r[t+1])<<2|r[t+2]>>6],n+=le[63&r[t+2]];return r.length%3===2?n=n.substring(0,n.length-1)+"=":r.length%3===1&&(n=n.substring(0,n.length-2)+"=="),n}function C(e,t){var r="";if(e&&(r=e.toString()),e&&("[object ArrayBuffer]"===e.toString()||e.buffer&&"[object ArrayBuffer]"===e.buffer.toString())){var n,o=he;e instanceof ArrayBuffer?(n=e,o+=pe):(n=e.buffer,"[object Int8Array]"===r?o+=be:"[object Uint8Array]"===r?o+=me:"[object Uint8ClampedArray]"===r?o+=_e:"[object Int16Array]"===r?o+=we:"[object Uint16Array]"===r?o+=Ee:"[object Int32Array]"===r?o+=Se:"[object Uint32Array]"===r?o+=Ie:"[object Float32Array]"===r?o+=Ae:"[object Float64Array]"===r?o+=Ne:t(new Error("Failed to get type for BinaryArray"))),t(o+x(n))}else if("[object Blob]"===r){var i=new FileReader;i.onload=function(){var r=de+e.type+"~"+x(this.result);t(he+ge+r)},i.readAsArrayBuffer(e)}else try{t(JSON.stringify(e))}catch(r){console.error("Couldn't convert value into a JSON string: ",e),t(null,r)}}function L(e){if(e.substring(0,ye)!==he)return JSON.parse(e);var t,r=e.substring(De),n=e.substring(ye,De);if(n===ge&&ve.test(r)){var o=r.match(ve);t=o[1],r=r.substring(o[0].length)}var i=B(r);switch(n){case pe:return i;case ge:return c([i],{type:t});case be:return new Int8Array(i);case me:return new Uint8Array(i);case _e:return new Uint8ClampedArray(i);case we:return new Int16Array(i);case Ee:return new Uint16Array(i);case Se:return new Int32Array(i);case Ie:return new Uint32Array(i);case Ae:return new Float32Array(i);case Ne:return new Float64Array(i);default:throw new Error("Unkown type: "+n)}}function T(e){var t=this,r={db:null};if(e)for(var n in e)r[n]="string"!=typeof e[n]?e[n].toString():e[n];var o=new ce(function(e,n){try{r.db=openDatabase(r.name,String(r.version),r.description,r.size)}catch(e){return n(e)}r.db.transaction(function(o){o.executeSql("CREATE TABLE IF NOT EXISTS "+r.storeName+" (id INTEGER PRIMARY KEY, key unique, value)",[],function(){t._dbInfo=r,e()},function(e,t){n(t)})})});return r.serializer=je,o}function F(e,t){var r=this;"string"!=typeof e&&(console.warn(e+" used as a key, but it is not a string."),e=String(e));var n=new ce(function(t,n){r.ready().then(function(){var o=r._dbInfo;o.db.transaction(function(r){r.executeSql("SELECT * FROM "+o.storeName+" WHERE key = ? LIMIT 1",[e],function(e,r){var n=r.rows.length?r.rows.item(0).value:null;n&&(n=o.serializer.deserialize(n)),t(n)},function(e,t){n(t)})})}).catch(n)});return f(n,t),n}function z(e,t){var r=this,n=new ce(function(t,n){r.ready().then(function(){var o=r._dbInfo;o.db.transaction(function(r){r.executeSql("SELECT * FROM "+o.storeName,[],function(r,n){for(var i=n.rows,a=i.length,u=0;u<a;u++){var c=i.item(u),f=c.value;if(f&&(f=o.serializer.deserialize(f)),f=e(f,c.key,u+1),void 0!==f)return void t(f)}t()},function(e,t){n(t)})})}).catch(n)});return f(n,t),n}function M(e,t,r){var n=this;"string"!=typeof e&&(console.warn(e+" used as a key, but it is not a string."),e=String(e));var o=new ce(function(r,o){n.ready().then(function(){void 0===t&&(t=null);var i=t,a=n._dbInfo;a.serializer.serialize(t,function(t,n){n?o(n):a.db.transaction(function(n){n.executeSql("INSERT OR REPLACE INTO "+a.storeName+" (key, value) VALUES (?, ?)",[e,t],function(){r(i)},function(e,t){o(t)})},function(e){e.code===e.QUOTA_ERR&&o(e)})})}).catch(o)});return f(o,r),o}function q(e,t){var r=this;"string"!=typeof e&&(console.warn(e+" used as a key, but it is not a string."),e=String(e));var n=new ce(function(t,n){r.ready().then(function(){var o=r._dbInfo;o.db.transaction(function(r){r.executeSql("DELETE FROM "+o.storeName+" WHERE key = ?",[e],function(){t()},function(e,t){n(t)})})}).catch(n)});return f(n,t),n}function P(e){var t=this,r=new ce(function(e,r){t.ready().then(function(){var n=t._dbInfo;n.db.transaction(function(t){t.executeSql("DELETE FROM "+n.storeName,[],function(){e()},function(e,t){r(t)})})}).catch(r)});return f(r,e),r}function U(e){var t=this,r=new ce(function(e,r){t.ready().then(function(){var n=t._dbInfo;n.db.transaction(function(t){t.executeSql("SELECT COUNT(key) as c FROM "+n.storeName,[],function(t,r){var n=r.rows.item(0).c;e(n)},function(e,t){r(t)})})}).catch(r)});return f(r,e),r}function W(e,t){var r=this,n=new ce(function(t,n){r.ready().then(function(){var o=r._dbInfo;o.db.transaction(function(r){r.executeSql("SELECT key FROM "+o.storeName+" WHERE id = ? LIMIT 1",[e+1],function(e,r){var n=r.rows.length?r.rows.item(0).key:null;t(n)},function(e,t){n(t)})})}).catch(n)});return f(n,t),n}function Q(e){var t=this,r=new ce(function(e,r){t.ready().then(function(){var n=t._dbInfo;n.db.transaction(function(t){t.executeSql("SELECT key FROM "+n.storeName,[],function(t,r){for(var n=[],o=0;o<r.rows.length;o++)n.push(r.rows.item(o).key);e(n)},function(e,t){r(t)})})}).catch(r)});return f(r,e),r}function G(e){var t=this,r={};if(e)for(var n in e)r[n]=e[n];return r.keyPrefix=r.name+"/",r.storeName!==t._defaultConfig.storeName&&(r.keyPrefix+=r.storeName+"/"),t._dbInfo=r,r.serializer=je,ce.resolve()}function X(e){var t=this,r=t.ready().then(function(){for(var e=t._dbInfo.keyPrefix,r=localStorage.length-1;r>=0;r--){var n=localStorage.key(r);0===n.indexOf(e)&&localStorage.removeItem(n)}});return f(r,e),r}function H(e,t){var r=this;"string"!=typeof e&&(console.warn(e+" used as a key, but it is not a string."),e=String(e));var n=r.ready().then(function(){var t=r._dbInfo,n=localStorage.getItem(t.keyPrefix+e);return n&&(n=t.serializer.deserialize(n)),n});return f(n,t),n}function J(e,t){var r=this,n=r.ready().then(function(){for(var t=r._dbInfo,n=t.keyPrefix,o=n.length,i=localStorage.length,a=1,u=0;u<i;u++){var c=localStorage.key(u);if(0===c.indexOf(n)){var f=localStorage.getItem(c);if(f&&(f=t.serializer.deserialize(f)),f=e(f,c.substring(o),a++),void 0!==f)return f}}});return f(n,t),n}function K(e,t){var r=this,n=r.ready().then(function(){var t,n=r._dbInfo;try{t=localStorage.key(e)}catch(e){t=null}return t&&(t=t.substring(n.keyPrefix.length)),t});return f(n,t),n}function V(e){var t=this,r=t.ready().then(function(){for(var e=t._dbInfo,r=localStorage.length,n=[],o=0;o<r;o++)0===localStorage.key(o).indexOf(e.keyPrefix)&&n.push(localStorage.key(o).substring(e.keyPrefix.length));return n});return f(r,e),r}function Y(e){var t=this,r=t.keys().then(function(e){return e.length});return f(r,e),r}function Z(e,t){var r=this;"string"!=typeof e&&(console.warn(e+" used as a key, but it is not a string."),e=String(e));var n=r.ready().then(function(){var t=r._dbInfo;localStorage.removeItem(t.keyPrefix+e)});return f(n,t),n}function $(e,t,r){var n=this;"string"!=typeof e&&(console.warn(e+" used as a key, but it is not a string."),e=String(e));var o=n.ready().then(function(){void 0===t&&(t=null);var r=t;return new ce(function(o,i){var a=n._dbInfo;a.serializer.serialize(t,function(t,n){if(n)i(n);else try{localStorage.setItem(a.keyPrefix+e,t),o(r)}catch(e){"QuotaExceededError"!==e.name&&"NS_ERROR_DOM_QUOTA_REACHED"!==e.name||i(e),i(e)}})})});return f(o,r),o}function ee(e,t,r){"function"==typeof t&&e.then(t),"function"==typeof r&&e.catch(r)}function te(e,t){e[t]=function(){var r=arguments;return e.ready().then(function(){return e[t].apply(e,r)})}}function re(){for(var e=1;e<arguments.length;e++){var t=arguments[e];if(t)for(var r in t)t.hasOwnProperty(r)&&(Fe(t[r])?arguments[0][r]=t[r].slice():arguments[0][r]=t[r])}return arguments[0]}function ne(e){for(var t in Be)if(Be.hasOwnProperty(t)&&Be[t]===e)return!0;return!1}var oe="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol?"symbol":typeof e},ie=o();"undefined"==typeof Promise&&"undefined"!=typeof e&&e(3);var ae,ue,ce=Promise,fe="local-forage-detect-blob-support",se={_driver:"asyncStorage",_initStorage:E,iterate:A,getItem:I,setItem:N,removeItem:D,clear:j,length:O,key:R,keys:k},le="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",de="~~local_forage_type~",ve=/^~~local_forage_type~([^~]+)~/,he="__lfsc__:",ye=he.length,pe="arbf",ge="blob",be="si08",me="ui08",_e="uic8",we="si16",Se="si32",Ee="ur16",Ie="ui32",Ae="fl32",Ne="fl64",De=ye+pe.length,je={serialize:C,deserialize:L,stringToBuffer:B,bufferToString:x},Oe={_driver:"webSQLStorage",_initStorage:T,iterate:z,getItem:F,setItem:M,removeItem:q,clear:P,length:U,key:W,keys:Q},Re={_driver:"localStorageWrapper",_initStorage:G,iterate:J,getItem:H,setItem:$,removeItem:Z,clear:X,length:Y,key:K,keys:V},ke={},Be={INDEXEDDB:"asyncStorage",LOCALSTORAGE:"localStorageWrapper",WEBSQL:"webSQLStorage"},xe=[Be.INDEXEDDB,Be.WEBSQL,Be.LOCALSTORAGE],Ce=["clear","getItem","iterate","key","keys","length","removeItem","setItem"],Le={description:"",driver:xe.slice(),name:"localforage",size:4980736,storeName:"keyvaluepairs",version:1},Te={};Te[Be.INDEXEDDB]=i(),Te[Be.WEBSQL]=a(),Te[Be.LOCALSTORAGE]=u();var Fe=Array.isArray||function(e){return"[object Array]"===Object.prototype.toString.call(e)},ze=function(){function e(t){n(this,e),this.INDEXEDDB=Be.INDEXEDDB,this.LOCALSTORAGE=Be.LOCALSTORAGE,this.WEBSQL=Be.WEBSQL,this._defaultConfig=re({},Le),this._config=re({},this._defaultConfig,t),this._driverSet=null,this._initDriver=null,this._ready=!1,this._dbInfo=null,this._wrapLibraryMethodsWithReady(),this.setDriver(this._config.driver)}return e.prototype.config=function(e){if("object"===("undefined"==typeof e?"undefined":oe(e))){if(this._ready)return new Error("Can't call config() after localforage has been used.");for(var t in e)"storeName"===t&&(e[t]=e[t].replace(/\W/g,"_")),this._config[t]=e[t];return"driver"in e&&e.driver&&this.setDriver(this._config.driver),!0}return"string"==typeof e?this._config[e]:this._config},e.prototype.defineDriver=function(e,t,r){var n=new ce(function(t,r){try{var n=e._driver,o=new Error("Custom driver not compliant; see https://mozilla.github.io/localForage/#definedriver"),i=new Error("Custom driver name already in use: "+e._driver);if(!e._driver)return void r(o);if(ne(e._driver))return void r(i);for(var a=Ce.concat("_initStorage"),u=0;u<a.length;u++){var c=a[u];if(!c||!e[c]||"function"!=typeof e[c])return void r(o)}var f=ce.resolve(!0);"_support"in e&&(f=e._support&&"function"==typeof e._support?e._support():ce.resolve(!!e._support)),f.then(function(r){Te[n]=r,ke[n]=e,t()},r)}catch(e){r(e)}});return ee(n,t,r),n},e.prototype.driver=function(){return this._driver||null},e.prototype.getDriver=function(e,t,r){var n=this,o=ce.resolve().then(function(){if(!ne(e)){if(ke[e])return ke[e];throw new Error("Driver not found.")}switch(e){case n.INDEXEDDB:return se;case n.LOCALSTORAGE:return Re;case n.WEBSQL:return Oe}});return ee(o,t,r),o},e.prototype.getSerializer=function(e){var t=ce.resolve(je);return ee(t,e),t},e.prototype.ready=function(e){var t=this,r=t._driverSet.then(function(){return null===t._ready&&(t._ready=t._initDriver()),t._ready});return ee(r,e,e),r},e.prototype.setDriver=function(e,t,r){function n(){i._config.driver=i.driver()}function o(e){return function(){function t(){for(;r<e.length;){var o=e[r];return r++,i._dbInfo=null,i._ready=null,i.getDriver(o).then(function(e){return i._extend(e),n(),i._ready=i._initStorage(i._config),i._ready}).catch(t)}n();var a=new Error("No available storage method found.");return i._driverSet=ce.reject(a),i._driverSet}var r=0;return t()}}var i=this;Fe(e)||(e=[e]);var a=this._getSupportedDrivers(e),u=null!==this._driverSet?this._driverSet.catch(function(){return ce.resolve()}):ce.resolve();return this._driverSet=u.then(function(){var e=a[0];return i._dbInfo=null,i._ready=null,i.getDriver(e).then(function(e){i._driver=e._driver,n(),i._wrapLibraryMethodsWithReady(),i._initDriver=o(a)})}).catch(function(){n();var e=new Error("No available storage method found.");return i._driverSet=ce.reject(e),i._driverSet}),ee(this._driverSet,t,r),this._driverSet},e.prototype.supports=function(e){return!!Te[e]},e.prototype._extend=function(e){re(this,e)},e.prototype._getSupportedDrivers=function(e){for(var t=[],r=0,n=e.length;r<n;r++){var o=e[r];this.supports(o)&&t.push(o)}return t},e.prototype._wrapLibraryMethodsWithReady=function(){for(var e=0;e<Ce.length;e++)te(this,Ce[e])},e.prototype.createInstance=function(t){return new e(t)},e}(),Me=new ze;t.exports=Me},{3:3}]},{},[4])(4)});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],93:[function(require,module,exports){
!function(e,t){"object"==typeof exports&&exports&&"string"!=typeof exports.nodeName?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):(e.Mustache={},t(e.Mustache))}(this,function(e){function t(e){return"function"==typeof e}function n(e){return g(e)?"array":typeof e}function r(e){return e.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&")}function i(e,t){return null!=e&&"object"==typeof e&&t in e}function o(e,t){return v.call(e,t)}function s(e){return!o(w,e)}function a(e){return String(e).replace(/[&<>"'`=\/]/g,function(e){return y[e]})}function u(t,n){function i(){if(w&&!y)for(;v.length;)delete d[v.pop()];else v=[];w=!1,y=!1}function o(e){if("string"==typeof e&&(e=e.split(k,2)),!g(e)||2!==e.length)throw new Error("Invalid tags: "+e);a=new RegExp(r(e[0])+"\\s*"),u=new RegExp("\\s*"+r(e[1])),h=new RegExp("\\s*"+r("}"+e[1]))}if(!t)return[];var a,u,h,f=[],d=[],v=[],w=!1,y=!1;o(n||e.tags);for(var U,T,j,S,V,C,A=new l(t);!A.eos();){if(U=A.pos,j=A.scanUntil(a))for(var I=0,R=j.length;I<R;++I)S=j.charAt(I),s(S)?v.push(d.length):y=!0,d.push(["text",S,U,U+1]),U+=1,"\n"===S&&i();if(!A.scan(a))break;if(w=!0,T=A.scan(E)||"name",A.scan(x),"="===T?(j=A.scanUntil(b),A.scan(b),A.scanUntil(u)):"{"===T?(j=A.scanUntil(h),A.scan(m),A.scanUntil(u),T="&"):j=A.scanUntil(u),!A.scan(u))throw new Error("Unclosed tag at "+A.pos);if(V=[T,j,U,A.pos],d.push(V),"#"===T||"^"===T)f.push(V);else if("/"===T){if(C=f.pop(),!C)throw new Error('Unopened section "'+j+'" at '+U);if(C[1]!==j)throw new Error('Unclosed section "'+C[1]+'" at '+U)}else"name"===T||"{"===T||"&"===T?y=!0:"="===T&&o(j)}if(C=f.pop())throw new Error('Unclosed section "'+C[1]+'" at '+A.pos);return p(c(d))}function c(e){for(var t,n,r=[],i=0,o=e.length;i<o;++i)t=e[i],t&&("text"===t[0]&&n&&"text"===n[0]?(n[1]+=t[1],n[3]=t[3]):(r.push(t),n=t));return r}function p(e){for(var t,n,r=[],i=r,o=[],s=0,a=e.length;s<a;++s)switch(t=e[s],t[0]){case"#":case"^":i.push(t),o.push(t),i=t[4]=[];break;case"/":n=o.pop(),n[5]=t[2],i=o.length>0?o[o.length-1][4]:r;break;default:i.push(t)}return r}function l(e){this.string=e,this.tail=e,this.pos=0}function h(e,t){this.view=e,this.cache={".":this.view},this.parent=t}function f(){this.cache={}}var d=Object.prototype.toString,g=Array.isArray||function(e){return"[object Array]"===d.call(e)},v=RegExp.prototype.test,w=/\S/,y={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;","`":"&#x60;","=":"&#x3D;"},x=/\s*/,k=/\s+/,b=/\s*=/,m=/\s*\}/,E=/#|\^|\/|>|\{|&|=|!/;l.prototype.eos=function(){return""===this.tail},l.prototype.scan=function(e){var t=this.tail.match(e);if(!t||0!==t.index)return"";var n=t[0];return this.tail=this.tail.substring(n.length),this.pos+=n.length,n},l.prototype.scanUntil=function(e){var t,n=this.tail.search(e);switch(n){case-1:t=this.tail,this.tail="";break;case 0:t="";break;default:t=this.tail.substring(0,n),this.tail=this.tail.substring(n)}return this.pos+=t.length,t},h.prototype.push=function(e){return new h(e,this)},h.prototype.lookup=function(e){var n,r=this.cache;if(r.hasOwnProperty(e))n=r[e];else{for(var o,s,a=this,u=!1;a;){if(e.indexOf(".")>0)for(n=a.view,o=e.split("."),s=0;null!=n&&s<o.length;)s===o.length-1&&(u=i(n,o[s])),n=n[o[s++]];else n=a.view[e],u=i(a.view,e);if(u)break;a=a.parent}r[e]=n}return t(n)&&(n=n.call(this.view)),n},f.prototype.clearCache=function(){this.cache={}},f.prototype.parse=function(e,t){var n=this.cache,r=n[e];return null==r&&(r=n[e]=u(e,t)),r},f.prototype.render=function(e,t,n){var r=this.parse(e),i=t instanceof h?t:new h(t);return this.renderTokens(r,i,n,e)},f.prototype.renderTokens=function(e,t,n,r){for(var i,o,s,a="",u=0,c=e.length;u<c;++u)s=void 0,i=e[u],o=i[0],"#"===o?s=this.renderSection(i,t,n,r):"^"===o?s=this.renderInverted(i,t,n,r):">"===o?s=this.renderPartial(i,t,n,r):"&"===o?s=this.unescapedValue(i,t):"name"===o?s=this.escapedValue(i,t):"text"===o&&(s=this.rawValue(i)),void 0!==s&&(a+=s);return a},f.prototype.renderSection=function(e,n,r,i){function o(e){return s.render(e,n,r)}var s=this,a="",u=n.lookup(e[1]);if(u){if(g(u))for(var c=0,p=u.length;c<p;++c)a+=this.renderTokens(e[4],n.push(u[c]),r,i);else if("object"==typeof u||"string"==typeof u||"number"==typeof u)a+=this.renderTokens(e[4],n.push(u),r,i);else if(t(u)){if("string"!=typeof i)throw new Error("Cannot use higher-order sections without the original template");u=u.call(n.view,i.slice(e[3],e[5]),o),null!=u&&(a+=u)}else a+=this.renderTokens(e[4],n,r,i);return a}},f.prototype.renderInverted=function(e,t,n,r){var i=t.lookup(e[1]);if(!i||g(i)&&0===i.length)return this.renderTokens(e[4],t,n,r)},f.prototype.renderPartial=function(e,n,r){if(r){var i=t(r)?r(e[1]):r[e[1]];return null!=i?this.renderTokens(this.parse(i),n,r,i):void 0}},f.prototype.unescapedValue=function(e,t){var n=t.lookup(e[1]);if(null!=n)return n},f.prototype.escapedValue=function(t,n){var r=n.lookup(t[1]);if(null!=r)return e.escape(r)},f.prototype.rawValue=function(e){return e[1]},e.name="mustache.js",e.version="2.2.1",e.tags=["{{","}}"];var U=new f;e.clearCache=function(){return U.clearCache()},e.parse=function(e,t){return U.parse(e,t)},e.render=function(e,t,r){if("string"!=typeof e)throw new TypeError('Invalid template! Template should be a "string" but "'+n(e)+'" was given as the first argument for mustache#render(template, view, partials)');return U.render(e,t,r)},e.to_html=function(n,r,i,o){var s=e.render(n,r,i);return t(o)?void o(s):s},e.escape=a,e.Scanner=l,e.Context=h,e.Writer=f});
},{}],94:[function(require,module,exports){
"use strict";function encode(e,r){return r.encode?r.strict?strictUriEncode(e):encodeURIComponent(e):e}var strictUriEncode=require("strict-uri-encode"),objectAssign=require("object-assign");exports.extract=function(e){return e.split("?")[1]||""},exports.parse=function(e){var r=Object.create(null);return"string"!=typeof e?r:(e=e.trim().replace(/^(\?|#|&)/,""))?(e.split("&").forEach(function(e){var n=e.replace(/\+/g," ").split("="),t=n.shift(),o=n.length>0?n.join("="):void 0;t=decodeURIComponent(t),o=void 0===o?null:decodeURIComponent(o),void 0===r[t]?r[t]=o:Array.isArray(r[t])?r[t].push(o):r[t]=[r[t],o]}),r):r},exports.stringify=function(e,r){var n={encode:!0,strict:!0};return r=objectAssign(n,r),e?Object.keys(e).sort().map(function(n){var t=e[n];if(void 0===t)return"";if(null===t)return encode(n,r);if(Array.isArray(t)){var o=[];return t.slice().forEach(function(e){void 0!==e&&(null===e?o.push(encode(n,r)):o.push(encode(n,r)+"="+encode(e,r)))}),o.join("&")}return encode(n,r)+"="+encode(t,r)}).filter(function(e){return e.length>0}).join("&"):""};
},{"object-assign":95,"strict-uri-encode":96}],95:[function(require,module,exports){
"use strict";function toObject(e){if(null===e||void 0===e)throw new TypeError("Object.assign cannot be called with null or undefined");return Object(e)}function shouldUseNative(){try{if(!Object.assign)return!1;var e=new String("abc");if(e[5]="de","5"===Object.getOwnPropertyNames(e)[0])return!1;for(var r={},t=0;t<10;t++)r["_"+String.fromCharCode(t)]=t;var n=Object.getOwnPropertyNames(r).map(function(e){return r[e]});if("0123456789"!==n.join(""))return!1;var o={};return"abcdefghijklmnopqrst".split("").forEach(function(e){o[e]=e}),"abcdefghijklmnopqrst"===Object.keys(Object.assign({},o)).join("")}catch(e){return!1}}var hasOwnProperty=Object.prototype.hasOwnProperty,propIsEnumerable=Object.prototype.propertyIsEnumerable;module.exports=shouldUseNative()?Object.assign:function(e,r){for(var t,n,o=toObject(e),a=1;a<arguments.length;a++){t=Object(arguments[a]);for(var c in t)hasOwnProperty.call(t,c)&&(o[c]=t[c]);if(Object.getOwnPropertySymbols){n=Object.getOwnPropertySymbols(t);for(var s=0;s<n.length;s++)propIsEnumerable.call(t,n[s])&&(o[n[s]]=t[n[s]])}}return o};
},{}],96:[function(require,module,exports){
"use strict";module.exports=function(e){return encodeURIComponent(e).replace(/[!'()*]/g,function(e){return"%"+e.charCodeAt(0).toString(16).toUpperCase()})};
},{}],97:[function(require,module,exports){
(function (Buffer){
function Peer(e){var n=this;if(!(n instanceof Peer))return new Peer(e);if(n.channelName=e.initiator?e.channelName||randombytes(20).toString("hex"):null,n._debug("new peer %o",e),e||(e={}),e.allowHalfOpen=!1,null==e.highWaterMark&&(e.highWaterMark=1048576),stream.Duplex.call(n,e),n.initiator=e.initiator||!1,n.channelConfig=e.channelConfig||Peer.channelConfig,n.config=e.config||Peer.config,n.constraints=e.constraints||Peer.constraints,n.offerConstraints=e.offerConstraints||{},n.answerConstraints=e.answerConstraints||{},n.reconnectTimer=e.reconnectTimer||!1,n.sdpTransform=e.sdpTransform||function(e){return e},n.stream=e.stream||!1,n.trickle=void 0===e.trickle||e.trickle,n.destroyed=!1,n.connected=!1,n.remoteAddress=void 0,n.remoteFamily=void 0,n.remotePort=void 0,n.localAddress=void 0,n.localPort=void 0,n._isWrtc=!!e.wrtc,n._wrtc=e.wrtc&&"object"==typeof e.wrtc?e.wrtc:getBrowserRTC(),!n._wrtc)throw"undefined"==typeof window?new Error("No WebRTC support: Specify `opts.wrtc` option in this environment"):new Error("No WebRTC support: Not a supported browser");if(n._maxBufferedAmount=e.highWaterMark,n._pcReady=!1,n._channelReady=!1,n._iceComplete=!1,n._channel=null,n._pendingCandidates=[],n._chunk=null,n._cb=null,n._interval=null,n._reconnectTimeout=null,n._pc=new n._wrtc.RTCPeerConnection(n.config,n.constraints),n._pc.oniceconnectionstatechange=function(){n._onIceConnectionStateChange()},n._pc.onsignalingstatechange=function(){n._onSignalingStateChange()},n._pc.onicecandidate=function(e){n._onIceCandidate(e)},n.stream&&n._pc.addStream(n.stream),"ontrack"in n._pc?n._pc.ontrack=function(e){n._onTrack(e)}:n._pc.onaddstream=function(e){n._onAddStream(e)},n.initiator){n._setupData({channel:n._pc.createDataChannel(n.channelName,n.channelConfig)});var t=!1;n._pc.onnegotiationneeded=function(){t||n._createOffer(),t=!0},"undefined"!=typeof window&&window.webkitRTCPeerConnection||n._pc.onnegotiationneeded()}else n._pc.ondatachannel=function(e){n._setupData(e)};n.on("finish",function(){n.connected?setTimeout(function(){n._destroy()},100):n.once("connect",function(){setTimeout(function(){n._destroy()},100)})})}function noop(){}module.exports=Peer;var debug=require("debug")("simple-peer"),getBrowserRTC=require("get-browser-rtc"),inherits=require("inherits"),randombytes=require("randombytes"),stream=require("readable-stream");inherits(Peer,stream.Duplex),Peer.WEBRTC_SUPPORT=!!getBrowserRTC(),Peer.config={iceServers:[{url:"stun:23.21.150.121",urls:"stun:23.21.150.121"}]},Peer.constraints={},Peer.channelConfig={},Object.defineProperty(Peer.prototype,"bufferSize",{get:function(){var e=this;return e._channel&&e._channel.bufferedAmount||0}}),Peer.prototype.address=function(){var e=this;return{port:e.localPort,family:"IPv4",address:e.localAddress}},Peer.prototype.signal=function(e){function n(e){try{t._pc.addIceCandidate(new t._wrtc.RTCIceCandidate(e),noop,function(e){t._onError(e)})}catch(e){t._destroy(new Error("error adding candidate: "+e.message))}}var t=this;if(t.destroyed)throw new Error("cannot signal after peer is destroyed");if("string"==typeof e)try{e=JSON.parse(e)}catch(n){e={}}t._debug("signal()"),e.sdp&&t._pc.setRemoteDescription(new t._wrtc.RTCSessionDescription(e),function(){t.destroyed||("offer"===t._pc.remoteDescription.type&&t._createAnswer(),t._pendingCandidates.forEach(n),t._pendingCandidates=[])},function(e){t._onError(e)}),e.candidate&&(t._pc.remoteDescription?n(e.candidate):t._pendingCandidates.push(e.candidate)),e.sdp||e.candidate||t._destroy(new Error("signal() called with invalid signal data"))},Peer.prototype.send=function(e){var n=this;Buffer.isBuffer(e)&&n._isWrtc&&(e=new Uint8Array(e));var t=e.length||e.byteLength||e.size;n._channel.send(e),n._debug("write: %d bytes",t)},Peer.prototype.destroy=function(e){var n=this;n._destroy(null,e)},Peer.prototype._destroy=function(e,n){var t=this;if(!t.destroyed){if(n&&t.once("close",n),t._debug("destroy (error: %s)",e&&e.message),t.readable=t.writable=!1,t._readableState.ended||t.push(null),t._writableState.finished||t.end(),t.destroyed=!0,t.connected=!1,t._pcReady=!1,t._channelReady=!1,t._chunk=null,t._cb=null,clearInterval(t._interval),clearTimeout(t._reconnectTimeout),t._pc){try{t._pc.close()}catch(e){}t._pc.oniceconnectionstatechange=null,t._pc.onsignalingstatechange=null,t._pc.onicecandidate=null,"ontrack"in t._pc?t._pc.ontrack=null:t._pc.onaddstream=null,t._pc.onnegotiationneeded=null,t._pc.ondatachannel=null}if(t._channel){try{t._channel.close()}catch(e){}t._channel.onmessage=null,t._channel.onopen=null,t._channel.onclose=null}t._pc=null,t._channel=null,e&&t.emit("error",e),t.emit("close")}},Peer.prototype._setupData=function(e){var n=this;n._channel=e.channel,n.channelName=n._channel.label,n._channel.binaryType="arraybuffer",n._channel.onmessage=function(e){n._onChannelMessage(e)},n._channel.onopen=function(){n._onChannelOpen()},n._channel.onclose=function(){n._onChannelClose()}},Peer.prototype._read=function(){},Peer.prototype._write=function(e,n,t){var r=this;if(r.destroyed)return t(new Error("cannot write after peer is destroyed"));if(r.connected){try{r.send(e)}catch(e){return r._onError(e)}r._channel.bufferedAmount>r._maxBufferedAmount?(r._debug("start backpressure: bufferedAmount %d",r._channel.bufferedAmount),r._cb=t):t(null)}else r._debug("write before connect"),r._chunk=e,r._cb=t},Peer.prototype._createOffer=function(){var e=this;e.destroyed||e._pc.createOffer(function(n){if(!e.destroyed){n.sdp=e.sdpTransform(n.sdp),e._pc.setLocalDescription(n,noop,function(n){e._onError(n)});var t=function(){var t=e._pc.localDescription||n;e._debug("signal"),e.emit("signal",{type:t.type,sdp:t.sdp})};e.trickle||e._iceComplete?t():e.once("_iceComplete",t)}},function(n){e._onError(n)},e.offerConstraints)},Peer.prototype._createAnswer=function(){var e=this;e.destroyed||e._pc.createAnswer(function(n){if(!e.destroyed){n.sdp=e.sdpTransform(n.sdp),e._pc.setLocalDescription(n,noop,function(n){e._onError(n)});var t=function(){var t=e._pc.localDescription||n;e._debug("signal"),e.emit("signal",{type:t.type,sdp:t.sdp})};e.trickle||e._iceComplete?t():e.once("_iceComplete",t)}},function(n){e._onError(n)},e.answerConstraints)},Peer.prototype._onIceConnectionStateChange=function(){var e=this;if(!e.destroyed){var n=e._pc.iceGatheringState,t=e._pc.iceConnectionState;e._debug("iceConnectionStateChange %s %s",n,t),e.emit("iceConnectionStateChange",n,t),"connected"!==t&&"completed"!==t||(clearTimeout(e._reconnectTimeout),e._pcReady=!0,e._maybeReady()),"disconnected"===t&&(e.reconnectTimer?(clearTimeout(e._reconnectTimeout),e._reconnectTimeout=setTimeout(function(){e._destroy()},e.reconnectTimer)):e._destroy()),"failed"===t&&e._destroy(),"closed"===t&&e._destroy()}},Peer.prototype.getStats=function(e){var n=this;n._pc.getStats?"undefined"!=typeof window&&window.mozRTCPeerConnection?n._pc.getStats(null,function(n){var t=[];n.forEach(function(e){t.push(e)}),e(t)},function(e){n._onError(e)}):n._pc.getStats(function(n){var t=[];n.result().forEach(function(e){var n={};e.names().forEach(function(t){n[t]=e.stat(t)}),n.id=e.id,n.type=e.type,n.timestamp=e.timestamp,t.push(n)}),e(t)}):e([])},Peer.prototype._maybeReady=function(){var e=this;e._debug("maybeReady pc %s channel %s",e._pcReady,e._channelReady),!e.connected&&!e._connecting&&e._pcReady&&e._channelReady&&(e._connecting=!0,e.getStats(function(n){function t(n){var t=o[n.localCandidateId],a=r[n.remoteCandidateId];t?(e.localAddress=t.ipAddress,e.localPort=Number(t.portNumber)):"string"==typeof n.googLocalAddress&&(t=n.googLocalAddress.split(":"),e.localAddress=t[0],e.localPort=Number(t[1])),e._debug("connect local: %s:%s",e.localAddress,e.localPort),a?(e.remoteAddress=a.ipAddress,e.remotePort=Number(a.portNumber),e.remoteFamily="IPv4"):"string"==typeof n.googRemoteAddress&&(a=n.googRemoteAddress.split(":"),e.remoteAddress=a[0],e.remotePort=Number(a[1]),e.remoteFamily="IPv4"),e._debug("connect remote: %s:%s",e.remoteAddress,e.remotePort)}e._connecting=!1,e.connected=!0;var r={},o={};if(n.forEach(function(e){"remotecandidate"===e.type&&(r[e.id]=e),"localcandidate"===e.type&&(o[e.id]=e)}),n.forEach(function(e){var n="googCandidatePair"===e.type&&"true"===e.googActiveConnection||"candidatepair"===e.type&&e.selected;n&&t(e)}),e._chunk){try{e.send(e._chunk)}catch(n){return e._onError(n)}e._chunk=null,e._debug('sent chunk from "write before connect"');var a=e._cb;e._cb=null,a(null)}e._interval=setInterval(function(){if(e._cb&&e._channel&&!(e._channel.bufferedAmount>e._maxBufferedAmount)){e._debug("ending backpressure: bufferedAmount %d",e._channel.bufferedAmount);var n=e._cb;e._cb=null,n(null)}},150),e._interval.unref&&e._interval.unref(),e._debug("connect"),e.emit("connect")}))},Peer.prototype._onSignalingStateChange=function(){var e=this;e.destroyed||(e._debug("signalingStateChange %s",e._pc.signalingState),e.emit("signalingStateChange",e._pc.signalingState))},Peer.prototype._onIceCandidate=function(e){var n=this;n.destroyed||(e.candidate&&n.trickle?n.emit("signal",{candidate:{candidate:e.candidate.candidate,sdpMLineIndex:e.candidate.sdpMLineIndex,sdpMid:e.candidate.sdpMid}}):e.candidate||(n._iceComplete=!0,n.emit("_iceComplete")))},Peer.prototype._onChannelMessage=function(e){var n=this;if(!n.destroyed){var t=e.data;n._debug("read: %d bytes",t.byteLength||t.length),t instanceof ArrayBuffer&&(t=new Buffer(t)),n.push(t)}},Peer.prototype._onChannelOpen=function(){var e=this;e.connected||e.destroyed||(e._debug("on channel open"),e._channelReady=!0,e._maybeReady())},Peer.prototype._onChannelClose=function(){var e=this;e.destroyed||(e._debug("on channel close"),e._destroy())},Peer.prototype._onAddStream=function(e){var n=this;n.destroyed||(n._debug("on add stream"),n.emit("stream",e.stream))},Peer.prototype._onTrack=function(e){var n=this;n.destroyed||(n._debug("on track"),n.emit("stream",e.streams[0]))},Peer.prototype._onError=function(e){var n=this;n.destroyed||(n._debug("error %s",e.message||e),n._destroy(e))},Peer.prototype._debug=function(){var e=this,n=[].slice.call(arguments),t=e.channelName&&e.channelName.substring(0,7);n[0]="["+t+"] "+n[0],debug.apply(null,n)};
}).call(this,require("buffer").Buffer)
},{"buffer":33,"debug":98,"get-browser-rtc":101,"inherits":102,"randombytes":103,"readable-stream":116}],98:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"./debug":99,"dup":5}],99:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6,"ms":100}],100:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],101:[function(require,module,exports){
module.exports=function(){if("undefined"==typeof window)return null;var n={RTCPeerConnection:window.RTCPeerConnection||window.mozRTCPeerConnection||window.webkitRTCPeerConnection,RTCSessionDescription:window.RTCSessionDescription||window.mozRTCSessionDescription||window.webkitRTCSessionDescription,RTCIceCandidate:window.RTCIceCandidate||window.mozRTCIceCandidate||window.webkitRTCIceCandidate};return n.RTCPeerConnection?n:null};
},{}],102:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],103:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"_process":41,"buffer":33,"dup":11}],104:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"./_stream_readable":106,"./_stream_writable":108,"core-util-is":111,"dup":15,"inherits":102,"process-nextick-args":113}],105:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"./_stream_transform":107,"core-util-is":111,"dup":16,"inherits":102}],106:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"./_stream_duplex":104,"./internal/streams/BufferList":109,"_process":41,"buffer":33,"buffer-shims":110,"core-util-is":111,"dup":17,"events":37,"inherits":102,"isarray":112,"process-nextick-args":113,"stream":62,"string_decoder/":114,"util":32}],107:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"./_stream_duplex":104,"core-util-is":111,"dup":18,"inherits":102}],108:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"./_stream_duplex":104,"_process":41,"buffer":33,"buffer-shims":110,"core-util-is":111,"dup":19,"events":37,"inherits":102,"process-nextick-args":113,"stream":62,"util-deprecate":115}],109:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"buffer":33,"buffer-shims":110,"dup":20}],110:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"buffer":33,"dup":21}],111:[function(require,module,exports){
(function (Buffer){
function isArray(r){return Array.isArray?Array.isArray(r):"[object Array]"===objectToString(r)}function isBoolean(r){return"boolean"==typeof r}function isNull(r){return null===r}function isNullOrUndefined(r){return null==r}function isNumber(r){return"number"==typeof r}function isString(r){return"string"==typeof r}function isSymbol(r){return"symbol"==typeof r}function isUndefined(r){return void 0===r}function isRegExp(r){return"[object RegExp]"===objectToString(r)}function isObject(r){return"object"==typeof r&&null!==r}function isDate(r){return"[object Date]"===objectToString(r)}function isError(r){return"[object Error]"===objectToString(r)||r instanceof Error}function isFunction(r){return"function"==typeof r}function isPrimitive(r){return null===r||"boolean"==typeof r||"number"==typeof r||"string"==typeof r||"symbol"==typeof r||"undefined"==typeof r}function objectToString(r){return Object.prototype.toString.call(r)}exports.isArray=isArray,exports.isBoolean=isBoolean,exports.isNull=isNull,exports.isNullOrUndefined=isNullOrUndefined,exports.isNumber=isNumber,exports.isString=isString,exports.isSymbol=isSymbol,exports.isUndefined=isUndefined,exports.isRegExp=isRegExp,exports.isObject=isObject,exports.isDate=isDate,exports.isError=isError,exports.isFunction=isFunction,exports.isPrimitive=isPrimitive,exports.isBuffer=Buffer.isBuffer;
}).call(this,{"isBuffer":require("../../../../../../browserify/node_modules/insert-module-globals/node_modules/is-buffer/index.js")})
},{"../../../../../../browserify/node_modules/insert-module-globals/node_modules/is-buffer/index.js":39}],112:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],113:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"_process":41,"dup":24}],114:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"buffer":33,"dup":25}],115:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26}],116:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"./lib/_stream_duplex.js":104,"./lib/_stream_passthrough.js":105,"./lib/_stream_readable.js":106,"./lib/_stream_transform.js":107,"./lib/_stream_writable.js":108,"_process":41,"dup":27,"stream":62}],117:[function(require,module,exports){
(function (process,global){
function WebTorrent(e){function r(){t.destroyed||(t.ready=!0,t.emit("ready"))}var t=this;return t instanceof WebTorrent?(EventEmitter.call(t),e||(e={}),"string"==typeof e.peerId?t.peerId=e.peerId:Buffer.isBuffer(e.peerId)?t.peerId=e.peerId.toString("hex"):t.peerId=Buffer.from(VERSION_PREFIX+randombytes(6).toString("hex")).toString("hex"),t.peerIdBuffer=Buffer.from(t.peerId,"hex"),"string"==typeof e.nodeId?t.nodeId=e.nodeId:Buffer.isBuffer(e.nodeId)?t.nodeId=e.nodeId.toString("hex"):t.nodeId=randombytes(20).toString("hex"),t.nodeIdBuffer=Buffer.from(t.nodeId,"hex"),t.destroyed=!1,t.listening=!1,t.torrentPort=e.torrentPort||0,t.dhtPort=e.dhtPort||0,t.tracker=void 0!==e.tracker?e.tracker:{},t.torrents=[],t.maxConns=Number(e.maxConns)||55,debug("new webtorrent (peerId %s, nodeId %s, port %s)",t.peerId,t.nodeId,t.torrentPort),t.tracker&&("object"!=typeof t.tracker&&(t.tracker={}),e.rtcConfig&&(console.warn("WebTorrent: opts.rtcConfig is deprecated. Use opts.tracker.rtcConfig instead"),t.tracker.rtcConfig=e.rtcConfig),e.wrtc&&(console.warn("WebTorrent: opts.wrtc is deprecated. Use opts.tracker.wrtc instead"),t.tracker.wrtc=e.wrtc),global.WRTC&&!t.tracker.wrtc&&(t.tracker.wrtc=global.WRTC)),"function"==typeof TCPPool?t._tcpPool=new TCPPool(t):process.nextTick(function(){t._onListening()}),t._downloadSpeed=speedometer(),t._uploadSpeed=speedometer(),e.dht!==!1&&"function"==typeof DHT?(t.dht=new DHT(extend({nodeId:t.nodeId},e.dht)),t.dht.once("error",function(e){t._destroy(e)}),t.dht.once("listening",function(){var e=t.dht.address();e&&(t.dhtPort=e.port)}),t.dht.setMaxListeners(0),t.dht.listen(t.dhtPort)):t.dht=!1,void("function"==typeof loadIPSet&&null!=e.blocklist?loadIPSet(e.blocklist,{headers:{"user-agent":"WebTorrent/"+VERSION+" (https://webtorrent.io)"}},function(e,o){return e?t.error("Failed to load blocklist: "+e.message):(t.blocked=o,void r())}):process.nextTick(r))):new WebTorrent(e)}function isReadable(e){return"object"==typeof e&&null!=e&&"function"==typeof e.pipe}function isFileList(e){return"undefined"!=typeof FileList&&e instanceof FileList}module.exports=WebTorrent;var Buffer=require("safe-buffer").Buffer,concat=require("simple-concat"),createTorrent=require("create-torrent"),debug=require("debug")("webtorrent"),DHT=require("bittorrent-dht/client"),EventEmitter=require("events").EventEmitter,extend=require("xtend"),inherits=require("inherits"),loadIPSet=require("load-ip-set"),parallel=require("run-parallel"),parseTorrent=require("parse-torrent"),path=require("path"),Peer=require("simple-peer"),randombytes=require("randombytes"),speedometer=require("speedometer"),zeroFill=require("zero-fill"),TCPPool=require("./lib/tcp-pool"),Torrent=require("./lib/torrent"),VERSION=require("./package.json").version,VERSION_STR=VERSION.match(/([0-9]+)/g).slice(0,2).map(function(e){return zeroFill(2,e)}).join(""),VERSION_PREFIX="-WW"+VERSION_STR+"-";inherits(WebTorrent,EventEmitter),WebTorrent.WEBRTC_SUPPORT=Peer.WEBRTC_SUPPORT,Object.defineProperty(WebTorrent.prototype,"downloadSpeed",{get:function(){return this._downloadSpeed()}}),Object.defineProperty(WebTorrent.prototype,"uploadSpeed",{get:function(){return this._uploadSpeed()}}),Object.defineProperty(WebTorrent.prototype,"progress",{get:function(){var e=this.torrents.filter(function(e){return 1!==e.progress}),r=e.reduce(function(e,r){return e+r.downloaded},0),t=e.reduce(function(e,r){return e+(r.length||0)},0)||1;return r/t}}),Object.defineProperty(WebTorrent.prototype,"ratio",{get:function(){var e=this.torrents.reduce(function(e,r){return e+r.uploaded},0),r=this.torrents.reduce(function(e,r){return e+r.received},0)||1;return e/r}}),WebTorrent.prototype.get=function(e){var r,t,o=this,n=o.torrents.length;if(e instanceof Torrent){for(r=0;r<n;r++)if(t=o.torrents[r],t===e)return t}else{var i;try{i=parseTorrent(e)}catch(e){}if(!i)return null;if(!i.infoHash)throw new Error("Invalid torrent identifier");for(r=0;r<n;r++)if(t=o.torrents[r],t.infoHash===i.infoHash)return t}return null},WebTorrent.prototype.download=function(e,r,t){return console.warn("WebTorrent: client.download() is deprecated. Use client.add() instead"),this.add(e,r,t)},WebTorrent.prototype.add=function(e,r,t){function o(){if(!d.destroyed)for(var e=0,r=d.torrents.length;e<r;e++){var t=d.torrents[e];if(t.infoHash===s.infoHash&&t!==s)return void s._destroy(new Error("Cannot add duplicate torrent "+s.infoHash))}}function n(){d.destroyed||("function"==typeof t&&t(s),d.emit("torrent",s))}function i(){s.removeListener("_infoHash",o),s.removeListener("ready",n),s.removeListener("close",i)}var d=this;if(d.destroyed)throw new Error("client is destroyed");if("function"==typeof r)return d.add(e,null,r);debug("add"),r=r?extend(r):{};var s=new Torrent(e,d,r);return d.torrents.push(s),s.once("_infoHash",o),s.once("ready",n),s.once("close",i),s},WebTorrent.prototype.seed=function(e,r,t){function o(e){var r=[function(r){e.load(d,r)}];i.dht&&r.push(function(r){e.once("dhtAnnounce",r)}),parallel(r,function(r){if(!i.destroyed)return r?e._destroy(r):void n(e)})}function n(e){debug("on seed"),"function"==typeof t&&t(e),e.emit("seed"),i.emit("seed",e)}var i=this;if(i.destroyed)throw new Error("client is destroyed");if("function"==typeof r)return i.seed(e,null,r);debug("seed"),r=r?extend(r):{},"string"==typeof e&&(r.path=path.dirname(e)),r.createdBy||(r.createdBy="WebTorrent/"+VERSION_STR),i.tracker||(r.announce=[]);var d,s=i.add(null,r,o);return isFileList(e)&&(e=Array.prototype.slice.call(e)),Array.isArray(e)||(e=[e]),parallel(e.map(function(e){return function(r){isReadable(e)?concat(e,r):r(null,e)}}),function(e,t){if(!i.destroyed)return e?s._destroy(e):void createTorrent.parseInput(t,r,function(e,o){if(!i.destroyed){if(e)return s._destroy(e);d=o.map(function(e){return e.getStream}),createTorrent(t,r,function(e,r){if(!i.destroyed){if(e)return s._destroy(e);var t=i.get(r);t?s._destroy(new Error("Cannot add duplicate torrent "+t.infoHash)):s._onTorrentId(r)}})}})}),s},WebTorrent.prototype.remove=function(e,r){debug("remove");var t=this.get(e);if(!t)throw new Error("No torrent with id "+e);this._remove(e,r)},WebTorrent.prototype._remove=function(e,r){var t=this.get(e);t&&(this.torrents.splice(this.torrents.indexOf(t),1),t.destroy(r))},WebTorrent.prototype.address=function(){return this.listening?this._tcpPool?this._tcpPool.server.address():{address:"0.0.0.0",family:"IPv4",port:0}:null},WebTorrent.prototype.destroy=function(e){if(this.destroyed)throw new Error("client already destroyed");this._destroy(null,e)},WebTorrent.prototype._destroy=function(e,r){var t=this;debug("client destroy"),t.destroyed=!0;var o=t.torrents.map(function(e){return function(r){e.destroy(r)}});t._tcpPool&&o.push(function(e){t._tcpPool.destroy(e)}),t.dht&&o.push(function(e){t.dht.destroy(e)}),parallel(o,r),e&&t.emit("error",e),t.torrents=[],t._tcpPool=null,t.dht=null},WebTorrent.prototype._onListening=function(){if(this.listening=!0,this._tcpPool){var e=this._tcpPool.server.address();e&&(this.torrentPort=e.port)}this.emit("listening")};
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./lib/tcp-pool":32,"./lib/torrent":122,"./package.json":231,"_process":41,"bittorrent-dht/client":32,"create-torrent":133,"debug":149,"events":37,"inherits":156,"load-ip-set":32,"parse-torrent":159,"path":40,"randombytes":172,"run-parallel":204,"safe-buffer":205,"simple-concat":206,"simple-peer":97,"speedometer":212,"xtend":228,"zero-fill":230}],118:[function(require,module,exports){
function FileStream(e,t){stream.Readable.call(this,t),this.destroyed=!1,this._torrent=e._torrent;var i=t&&t.start||0,r=t&&t.end&&t.end<e.length?t.end:e.length-1,s=e._torrent.pieceLength;this._startPiece=(i+e.offset)/s|0,this._endPiece=(r+e.offset)/s|0,this._piece=this._startPiece,this._offset=i+e.offset-this._startPiece*s,this._missing=r-i+1,this._reading=!1,this._notifying=!1,this._criticalLength=Math.min(1048576/s|0,2)}module.exports=FileStream;var debug=require("debug")("webtorrent:file-stream"),inherits=require("inherits"),stream=require("readable-stream");inherits(FileStream,stream.Readable),FileStream.prototype._read=function(){this._reading||(this._reading=!0,this._notify())},FileStream.prototype._notify=function(){var e=this;if(e._reading&&0!==e._missing){if(!e._torrent.bitfield.get(e._piece))return e._torrent.critical(e._piece,e._piece+e._criticalLength);if(!e._notifying){e._notifying=!0;var t=e._piece;e._torrent.store.get(t,function(i,r){if(e._notifying=!1,!e.destroyed){if(i)return e._destroy(i);debug("read %s (length %s) (err %s)",t,r.length,i&&i.message),e._offset&&(r=r.slice(e._offset),e._offset=0),e._missing<r.length&&(r=r.slice(0,e._missing)),e._missing-=r.length,debug("pushing buffer of length %s",r.length),e._reading=!1,e.push(r),0===e._missing&&e.push(null)}}),e._piece+=1}}},FileStream.prototype.destroy=function(e){this._destroy(null,e)},FileStream.prototype._destroy=function(e,t){this.destroyed||(this.destroyed=!0,this._torrent.destroyed||this._torrent.deselect(this._startPiece,this._endPiece,!0),e&&this.emit("error",e),this.emit("close"),t&&t())};
},{"debug":149,"inherits":156,"readable-stream":185}],119:[function(require,module,exports){
(function (process){
function File(e,t){EventEmitter.call(this),this._torrent=e,this._destroyed=!1,this.name=t.name,this.path=t.path,this.length=t.length,this.offset=t.offset,this.done=!1;var r=t.offset,i=r+t.length-1;this._startPiece=r/this._torrent.pieceLength|0,this._endPiece=i/this._torrent.pieceLength|0,0===this.length&&(this.done=!0,this.emit("done"))}module.exports=File;var eos=require("end-of-stream"),EventEmitter=require("events").EventEmitter,FileStream=require("./file-stream"),inherits=require("inherits"),path=require("path"),render=require("render-media"),stream=require("readable-stream"),streamToBlob=require("stream-to-blob"),streamToBlobURL=require("stream-to-blob-url"),streamToBuffer=require("stream-with-known-length-to-buffer");inherits(File,EventEmitter),File.prototype.select=function(e){0!==this.length&&this._torrent.select(this._startPiece,this._endPiece,e)},File.prototype.deselect=function(){0!==this.length&&this._torrent.deselect(this._startPiece,this._endPiece,!1)},File.prototype.createReadStream=function(e){var t=this;if(0===this.length){var r=new stream.PassThrough;return process.nextTick(function(){r.end()}),r}var i=new FileStream(t,e);return t._torrent.select(i._startPiece,i._endPiece,!0,function(){i._notify()}),eos(i,function(){t._destroyed||t._torrent.destroyed||t._torrent.deselect(i._startPiece,i._endPiece,!0)}),i},File.prototype.getBuffer=function(e){streamToBuffer(this.createReadStream(),this.length,e)},File.prototype.getBlob=function(e){if("undefined"==typeof window)throw new Error("browser-only method");streamToBlob(this.createReadStream(),this._getMimeType(),e)},File.prototype.getBlobURL=function(e){if("undefined"==typeof window)throw new Error("browser-only method");streamToBlobURL(this.createReadStream(),this._getMimeType(),e)},File.prototype.appendTo=function(e,t,r){if("undefined"==typeof window)throw new Error("browser-only method");render.append(this,e,t,r)},File.prototype.renderTo=function(e,t,r){if("undefined"==typeof window)throw new Error("browser-only method");render.render(this,e,t,r)},File.prototype._getMimeType=function(){return render.mime[path.extname(this.name).toLowerCase()]},File.prototype._destroy=function(){this._destroyed=!0,this._torrent=null};
}).call(this,require('_process'))
},{"./file-stream":118,"_process":41,"end-of-stream":152,"events":37,"inherits":156,"path":40,"readable-stream":185,"render-media":186,"stream-to-blob":214,"stream-to-blob-url":213,"stream-with-known-length-to-buffer":217}],120:[function(require,module,exports){
function Peer(e,n){var r=this;r.id=e,r.type=n,debug("new Peer %s",e),r.addr=null,r.conn=null,r.swarm=null,r.wire=null,r.connected=!1,r.destroyed=!1,r.timeout=null,r.retries=0,r.sentHandshake=!1}function noop(){}var arrayRemove=require("unordered-array-remove"),debug=require("debug")("webtorrent:peer"),Wire=require("bittorrent-protocol"),WebConn=require("./webconn"),CONNECT_TIMEOUT_TCP=5e3,CONNECT_TIMEOUT_WEBRTC=25e3,HANDSHAKE_TIMEOUT=25e3;exports.createWebRTCPeer=function(e,n){var r=new Peer(e.id,"webrtc");return r.conn=e,r.swarm=n,r.conn.connected?r.onConnect():(r.conn.once("connect",function(){r.onConnect()}),r.conn.once("error",function(e){r.destroy(e)}),r.startConnectTimeout()),r},exports.createTCPIncomingPeer=function(e){var n=e.remoteAddress+":"+e.remotePort,r=new Peer(n,"tcpIncoming");return r.conn=e,r.addr=n,r.onConnect(),r},exports.createTCPOutgoingPeer=function(e,n){var r=new Peer(e,"tcpOutgoing");return r.addr=e,r.swarm=n,r},exports.createWebSeedPeer=function(e,n){var r=new Peer(e,"webSeed");return r.swarm=n,r.conn=new WebConn(e,n),r.onConnect(),r},Peer.prototype.onConnect=function(){var e=this;if(!e.destroyed){e.connected=!0,debug("Peer %s connected",e.id),clearTimeout(e.connectTimeout);var n=e.conn;n.once("end",function(){e.destroy()}),n.once("close",function(){e.destroy()}),n.once("finish",function(){e.destroy()}),n.once("error",function(n){e.destroy(n)});var r=e.wire=new Wire;r.type=e.type,r.once("end",function(){e.destroy()}),r.once("close",function(){e.destroy()}),r.once("finish",function(){e.destroy()}),r.once("error",function(n){e.destroy(n)}),r.once("handshake",function(n,r){e.onHandshake(n,r)}),e.startHandshakeTimeout(),n.pipe(r).pipe(n),e.swarm&&!e.sentHandshake&&e.handshake()}},Peer.prototype.onHandshake=function(e,n){var r=this;if(r.swarm&&!r.destroyed){if(r.swarm.destroyed)return r.destroy(new Error("swarm already destroyed"));if(e!==r.swarm.infoHash)return r.destroy(new Error("unexpected handshake info hash for this swarm"));if(n===r.swarm.peerId)return r.destroy(new Error("refusing to connect to ourselves"));debug("Peer %s got handshake %s",r.id,e),clearTimeout(r.handshakeTimeout),r.retries=0;var o=r.addr;!o&&r.conn.remoteAddress&&(o=r.conn.remoteAddress+":"+r.conn.remotePort),r.swarm._onWire(r.wire,o),r.swarm&&!r.swarm.destroyed&&(r.sentHandshake||r.handshake())}},Peer.prototype.handshake=function(){var e=this,n={dht:!e.swarm.private&&!!e.swarm.client.dht};e.wire.handshake(e.swarm.infoHash,e.swarm.client.peerId,n),e.sentHandshake=!0},Peer.prototype.startConnectTimeout=function(){var e=this;clearTimeout(e.connectTimeout),e.connectTimeout=setTimeout(function(){e.destroy(new Error("connect timeout"))},"webrtc"===e.type?CONNECT_TIMEOUT_WEBRTC:CONNECT_TIMEOUT_TCP),e.connectTimeout.unref&&e.connectTimeout.unref()},Peer.prototype.startHandshakeTimeout=function(){var e=this;clearTimeout(e.handshakeTimeout),e.handshakeTimeout=setTimeout(function(){e.destroy(new Error("handshake timeout"))},HANDSHAKE_TIMEOUT),e.handshakeTimeout.unref&&e.handshakeTimeout.unref()},Peer.prototype.destroy=function(e){var n=this;if(!n.destroyed){n.destroyed=!0,n.connected=!1,debug("destroy %s (error: %s)",n.id,e&&(e.message||e)),clearTimeout(n.connectTimeout),clearTimeout(n.handshakeTimeout);var r=n.swarm,o=n.conn,t=n.wire;n.swarm=null,n.conn=null,n.wire=null,r&&t&&arrayRemove(r.wires,r.wires.indexOf(t)),o&&(o.on("error",noop),o.destroy()),t&&t.destroy(),r&&r.removePeer(n.id)}};
},{"./webconn":123,"bittorrent-protocol":126,"debug":149,"unordered-array-remove":223}],121:[function(require,module,exports){
function RarityMap(e){var i=this;i._torrent=e,i._numPieces=e.pieces.length,i._pieces=[],i._onWire=function(e){i.recalculate(),i._initWire(e)},i._onWireHave=function(e){i._pieces[e]+=1},i._onWireBitfield=function(){i.recalculate()},i._torrent.wires.forEach(function(e){i._initWire(e)}),i._torrent.on("wire",i._onWire),i.recalculate()}function trueFn(){return!0}module.exports=RarityMap,RarityMap.prototype.getRarestPiece=function(e){e||(e=trueFn);for(var i=[],t=1/0,r=0;r<this._numPieces;++r)if(e(r)){var n=this._pieces[r];n===t?i.push(r):n<t&&(i=[r],t=n)}return i.length>0?i[Math.random()*i.length|0]:-1},RarityMap.prototype.destroy=function(){var e=this;e._torrent.removeListener("wire",e._onWire),e._torrent.wires.forEach(function(i){e._cleanupWireEvents(i)}),e._torrent=null,e._pieces=null,e._onWire=null,e._onWireHave=null,e._onWireBitfield=null},RarityMap.prototype._initWire=function(e){var i=this;e._onClose=function(){i._cleanupWireEvents(e);for(var t=0;t<this._numPieces;++t)i._pieces[t]-=e.peerPieces.get(t)},e.on("have",i._onWireHave),e.on("bitfield",i._onWireBitfield),e.once("close",e._onClose)},RarityMap.prototype.recalculate=function(){var e;for(e=0;e<this._numPieces;++e)this._pieces[e]=0;var i=this._torrent.wires.length;for(e=0;e<i;++e)for(var t=this._torrent.wires[e],r=0;r<this._numPieces;++r)this._pieces[r]+=t.peerPieces.get(r)},RarityMap.prototype._cleanupWireEvents=function(e){e.removeListener("have",this._onWireHave),e.removeListener("bitfield",this._onWireBitfield),e._onClose&&e.removeListener("close",e._onClose),e._onClose=null};
},{}],122:[function(require,module,exports){
(function (process,global){
function Torrent(e,t,r){EventEmitter.call(this),this.client=t,this._debugId=this.client.peerId.toString("hex").substring(0,7),this._debug("new torrent"),this.announce=r.announce,this.urlList=r.urlList,this.path=r.path,this._store=r.store||FSChunkStore,this._getAnnounceOpts=r.getAnnounceOpts,this.strategy=r.strategy||"sequential",this.maxWebConns=r.maxWebConns||4,this._rechokeNumSlots=r.uploads===!1||0===r.uploads?0:+r.uploads||10,this._rechokeOptimisticWire=null,this._rechokeOptimisticTime=0,this._rechokeIntervalId=null,this.ready=!1,this.destroyed=!1,this.paused=!1,this.done=!1,this.metadata=null,this.store=null,this.files=[],this.pieces=[],this._amInterested=!1,this._selections=[],this._critical=[],this.wires=[],this._queue=[],this._peers={},this._peersLength=0,this.received=0,this.uploaded=0,this._downloadSpeed=speedometer(),this._uploadSpeed=speedometer(),this._servers=[],this._xsRequests=[],this._fileModtimes=r.fileModtimes,null!==e&&this._onTorrentId(e)}function getBlockPipelineLength(e,t){return 2+Math.ceil(t*e.downloadSpeed()/Piece.BLOCK_LENGTH)}function getPiecePipelineLength(e,t,r){return 1+Math.ceil(t*e.downloadSpeed()/r)}function randomInt(e){return Math.random()*e|0}function noop(){}module.exports=Torrent;var addrToIPPort=require("addr-to-ip-port"),BitField=require("bitfield"),ChunkStoreWriteStream=require("chunk-store-stream/write"),debug=require("debug")("webtorrent:torrent"),Discovery=require("torrent-discovery"),EventEmitter=require("events").EventEmitter,extend=require("xtend"),extendMutable=require("xtend/mutable"),fs=require("fs"),FSChunkStore=require("fs-chunk-store"),get=require("simple-get"),ImmediateChunkStore=require("immediate-chunk-store"),inherits=require("inherits"),MultiStream=require("multistream"),net=require("net"),os=require("os"),parallel=require("run-parallel"),parallelLimit=require("run-parallel-limit"),parseTorrent=require("parse-torrent"),path=require("path"),Piece=require("torrent-piece"),pump=require("pump"),randomIterate=require("random-iterate"),sha1=require("simple-sha1"),speedometer=require("speedometer"),uniq=require("uniq"),utMetadata=require("ut_metadata"),utPex=require("ut_pex"),File=require("./file"),Peer=require("./peer"),RarityMap=require("./rarity-map"),Server=require("./server"),MAX_BLOCK_LENGTH=131072,PIECE_TIMEOUT=3e4,CHOKE_TIMEOUT=5e3,SPEED_THRESHOLD=3*Piece.BLOCK_LENGTH,PIPELINE_MIN_DURATION=.5,PIPELINE_MAX_DURATION=1,RECHOKE_INTERVAL=1e4,RECHOKE_OPTIMISTIC_DURATION=2,FILESYSTEM_CONCURRENCY=2,RECONNECT_WAIT=[1e3,5e3,15e3],VERSION=require("../package.json").version,TMP;try{TMP=path.join(fs.statSync("/tmp")&&"/tmp","webtorrent")}catch(e){TMP=path.join("function"==typeof os.tmpDir?os.tmpDir():"/","webtorrent")}inherits(Torrent,EventEmitter),Object.defineProperty(Torrent.prototype,"timeRemaining",{get:function(){return this.done?0:0===this.downloadSpeed?1/0:(this.length-this.downloaded)/this.downloadSpeed*1e3}}),Object.defineProperty(Torrent.prototype,"downloaded",{get:function(){if(!this.bitfield)return 0;for(var e=0,t=0,r=this.pieces.length;t<r;++t)if(this.bitfield.get(t))e+=t===r-1?this.lastPieceLength:this.pieceLength;else{var n=this.pieces[t];e+=n.length-n.missing}return e}}),Object.defineProperty(Torrent.prototype,"downloadSpeed",{get:function(){return this._downloadSpeed()}}),Object.defineProperty(Torrent.prototype,"uploadSpeed",{get:function(){return this._uploadSpeed()}}),Object.defineProperty(Torrent.prototype,"progress",{get:function(){return this.length?this.downloaded/this.length:0}}),Object.defineProperty(Torrent.prototype,"ratio",{get:function(){return this.uploaded/(this.received||1)}}),Object.defineProperty(Torrent.prototype,"numPeers",{get:function(){return this.wires.length}}),Object.defineProperty(Torrent.prototype,"torrentFileBlobURL",{get:function(){if("undefined"==typeof window)throw new Error("browser-only property");return this.torrentFile?URL.createObjectURL(new Blob([this.torrentFile],{type:"application/x-bittorrent"})):null}}),Object.defineProperty(Torrent.prototype,"_numQueued",{get:function(){return this._queue.length+(this._peersLength-this._numConns)}}),Object.defineProperty(Torrent.prototype,"_numConns",{get:function(){var e=this,t=0;for(var r in e._peers)e._peers[r].connected&&(t+=1);return t}}),Object.defineProperty(Torrent.prototype,"swarm",{get:function(){return console.warn("WebTorrent: `torrent.swarm` is deprecated. Use `torrent` directly instead."),this}}),Torrent.prototype._onTorrentId=function(e){var t=this;if(!t.destroyed){var r;try{r=parseTorrent(e)}catch(e){}r?(t.infoHash=r.infoHash,process.nextTick(function(){t.destroyed||t._onParsedTorrent(r)})):parseTorrent.remote(e,function(e,r){if(!t.destroyed)return e?t._destroy(e):void t._onParsedTorrent(r)})}},Torrent.prototype._onParsedTorrent=function(e){var t=this;if(!t.destroyed){if(t._processParsedTorrent(e),!t.infoHash)return t._destroy(new Error("Malformed torrent data: No info hash"));t.path||(t.path=path.join(TMP,t.infoHash)),t._rechokeIntervalId=setInterval(function(){t._rechoke()},RECHOKE_INTERVAL),t._rechokeIntervalId.unref&&t._rechokeIntervalId.unref(),t.emit("_infoHash",t.infoHash),t.destroyed||(t.emit("infoHash",t.infoHash),t.destroyed||(t.client.listening?t._onListening():t.client.once("listening",function(){t._onListening()})))}},Torrent.prototype._processParsedTorrent=function(e){this.announce&&(e.announce=e.announce.concat(this.announce)),this.client.tracker&&global.WEBTORRENT_ANNOUNCE&&!this.private&&(e.announce=e.announce.concat(global.WEBTORRENT_ANNOUNCE)),this.urlList&&(e.urlList=e.urlList.concat(this.urlList)),uniq(e.announce),uniq(e.urlList),extendMutable(this,e),this.magnetURI=parseTorrent.toMagnetURI(e),this.torrentFile=parseTorrent.toTorrentFile(e)},Torrent.prototype._onListening=function(){function e(e){i._destroy(e)}function t(e){"string"==typeof e&&i.done||i.addPeer(e)}function r(){i.emit("trackerAnnounce"),0===i.numPeers&&i.emit("noPeers","tracker")}function n(){i.emit("dhtAnnounce"),0===i.numPeers&&i.emit("noPeers","dht")}function o(e){i.emit("warning",e)}var i=this;if(!i.discovery&&!i.destroyed){var s=i.client.tracker;s&&(s=extend(i.client.tracker,{getAnnounceOpts:function(){var e={uploaded:i.uploaded,downloaded:i.downloaded,left:Math.max(i.length-i.downloaded,0)};return i.client.tracker.getAnnounceOpts&&extendMutable(e,i.client.tracker.getAnnounceOpts()),i._getAnnounceOpts&&extendMutable(e,i._getAnnounceOpts()),e}})),i.discovery=new Discovery({infoHash:i.infoHash,announce:i.announce,peerId:i.client.peerId,dht:!i.private&&i.client.dht,tracker:s,port:i.client.torrentPort}),i.discovery.on("error",e),i.discovery.on("peer",t),i.discovery.on("trackerAnnounce",r),i.discovery.on("dhtAnnounce",n),i.discovery.on("warning",o),i.info?i._onMetadata(i):i.xs&&i._getMetadataFromServer()}},Torrent.prototype._getMetadataFromServer=function(){function e(e,r){function n(n,o,i){if(t.destroyed)return r(null);if(t.metadata)return r(null);if(n)return t._debug("http error from xs param: %s",e),r(null);if(200!==o.statusCode)return t._debug("non-200 status code %s from xs param: %s",o.statusCode,e),r(null);var s;try{s=parseTorrent(i)}catch(e){}return s?s.infoHash!==t.infoHash?(t._debug("got torrent file with incorrect info hash from xs param: %s",e),r(null)):(t._onMetadata(s),void r(null)):(t._debug("got invalid torrent file from xs param: %s",e),r(null))}if(0!==e.indexOf("http://")&&0!==e.indexOf("https://"))return t._debug("skipping non-http xs param: %s",e),r(null);var o,i={url:e,method:"GET",headers:{"user-agent":"WebTorrent/"+VERSION+" (https://webtorrent.io)"}};try{o=get.concat(i,n)}catch(n){return t._debug("skipping invalid url xs param: %s",e),r(null)}t._xsRequests.push(o)}var t=this,r=Array.isArray(t.xs)?t.xs:[t.xs],n=r.map(function(t){return function(r){e(t,r)}});parallel(n)},Torrent.prototype._onMetadata=function(e){var t=this;if(!t.metadata&&!t.destroyed){t._debug("got metadata"),t._xsRequests.forEach(function(e){e.abort()}),t._xsRequests=[];var r;if(e&&e.infoHash)r=e;else try{r=parseTorrent(e)}catch(e){return t._destroy(e)}t._processParsedTorrent(r),t.metadata=t.torrentFile,t.urlList.forEach(function(e){t.addWebSeed(e)}),0!==t.pieces.length&&t.select(0,t.pieces.length-1,!1),t._rarityMap=new RarityMap(t),t.store=new ImmediateChunkStore(new t._store(t.pieceLength,{torrent:{infoHash:t.infoHash},files:t.files.map(function(e){return{path:path.join(t.path,e.path),length:e.length,offset:e.offset}}),length:t.length})),t.files=t.files.map(function(e){return new File(t,e)}),t._hashes=t.pieces,t.pieces=t.pieces.map(function(e,r){var n=r===t.pieces.length-1?t.lastPieceLength:t.pieceLength;return new Piece(n)}),t._reservations=t.pieces.map(function(){return[]}),t.bitfield=new BitField(t.pieces.length),t.wires.forEach(function(e){e.ut_metadata&&e.ut_metadata.setMetadata(t.metadata),t._onWireWithMetadata(e)}),t._debug("verifying existing torrent data"),t._fileModtimes&&t._store===FSChunkStore?t.getFileModtimes(function(e,r){if(e)return t._destroy(e);var n=t.files.map(function(e,n){return r[n]===t._fileModtimes[n]}).every(function(e){return e});if(n){for(var o=0;o<t.pieces.length;o++)t._markVerified(o);t._onStore()}else t._verifyPieces()}):t._verifyPieces(),t.emit("metadata")}},Torrent.prototype.getFileModtimes=function(e){var t=this,r=[];parallelLimit(t.files.map(function(e,n){return function(o){fs.stat(path.join(t.path,e.path),function(e,t){return e&&"ENOENT"!==e.code?o(e):(r[n]=t&&t.mtime.getTime(),void o(null))})}}),FILESYSTEM_CONCURRENCY,function(n){t._debug("done getting file modtimes"),e(n,r)})},Torrent.prototype._verifyPieces=function(){var e=this;parallelLimit(e.pieces.map(function(t,r){return function(t){return e.destroyed?t(new Error("torrent is destroyed")):void e.store.get(r,function(n,o){return n?process.nextTick(t,null):void sha1(o,function(n){if(n===e._hashes[r]){if(!e.pieces[r])return;e._debug("piece verified %s",r),e._markVerified(r)}else e._debug("piece invalid %s",r);t(null)})})}}),FILESYSTEM_CONCURRENCY,function(t){return t?e._destroy(t):(e._debug("done verifying"),void e._onStore())})},Torrent.prototype._markVerified=function(e){this.pieces[e]=null,this._reservations[e]=null,this.bitfield.set(e,!0)},Torrent.prototype._onStore=function(){var e=this;e.destroyed||(e._debug("on store"),e.ready=!0,e.emit("ready"),e._checkDone(),e._updateSelections())},Torrent.prototype.destroy=function(e){var t=this;t._destroy(null,e)},Torrent.prototype._destroy=function(e,t){var r=this;if(!r.destroyed){r.destroyed=!0,r._debug("destroy"),r.client._remove(r),clearInterval(r._rechokeIntervalId),r._xsRequests.forEach(function(e){e.abort()}),r._rarityMap&&r._rarityMap.destroy();for(var n in r._peers)r.removePeer(n);r.files.forEach(function(e){e instanceof File&&e._destroy()});var o=r._servers.map(function(e){return function(t){e.destroy(t)}});r.discovery&&o.push(function(e){r.discovery.destroy(e)}),r.store&&o.push(function(e){r.store.close(e)}),parallel(o,t),e&&(0===r.listenerCount("error")?r.client.emit("error",e):r.emit("error",e)),r.emit("close"),r.client=null,r.files=[],r.discovery=null,r.store=null,r._rarityMap=null,r._peers=null,r._servers=null,r._xsRequests=null}},Torrent.prototype.addPeer=function(e){var t=this;if(t.destroyed)throw new Error("torrent is destroyed");if(!t.infoHash)throw new Error("addPeer() must not be called before the `infoHash` event");if(t.client.blocked){var r;if("string"==typeof e){var n;try{n=addrToIPPort(e)}catch(r){return t._debug("ignoring peer: invalid %s",e),t.emit("invalidPeer",e),!1}r=n[0]}else"string"==typeof e.remoteAddress&&(r=e.remoteAddress);if(r&&t.client.blocked.contains(r))return t._debug("ignoring peer: blocked %s",e),"string"!=typeof e&&e.destroy(),t.emit("blockedPeer",e),!1}var o=!!t._addPeer(e);return o?t.emit("peer",e):t.emit("invalidPeer",e),o},Torrent.prototype._addPeer=function(e){var t=this;if(t.destroyed)return t._debug("ignoring peer: torrent is destroyed"),"string"!=typeof e&&e.destroy(),null;if("string"==typeof e&&!t._validAddr(e))return t._debug("ignoring peer: invalid %s",e),null;var r=e&&e.id||e;if(t._peers[r])return t._debug("ignoring peer: duplicate (%s)",r),"string"!=typeof e&&e.destroy(),null;if(t.paused)return t._debug("ignoring peer: torrent is paused"),"string"!=typeof e&&e.destroy(),null;t._debug("add peer %s",r);var n;return n="string"==typeof e?Peer.createTCPOutgoingPeer(e,t):Peer.createWebRTCPeer(e,t),t._peers[n.id]=n,t._peersLength+=1,"string"==typeof e&&(t._queue.push(n),t._drain()),n},Torrent.prototype.addWebSeed=function(e){if(this.destroyed)throw new Error("torrent is destroyed");if(!/^https?:\/\/.+/.test(e))return this._debug("ignoring invalid web seed %s",e),void this.emit("invalidPeer",e);if(this._peers[e])return this._debug("ignoring duplicate web seed %s",e),void this.emit("invalidPeer",e);this._debug("add web seed %s",e);var t=Peer.createWebSeedPeer(e,this);this._peers[t.id]=t,this._peersLength+=1,this.emit("peer",e)},Torrent.prototype._addIncomingPeer=function(e){var t=this;return t.destroyed?e.destroy(new Error("torrent is destroyed")):t.paused?e.destroy(new Error("torrent is paused")):(this._debug("add incoming peer %s",e.id),t._peers[e.id]=e,void(t._peersLength+=1))},Torrent.prototype.removePeer=function(e){var t=this,r=e&&e.id||e;e=t._peers[r],e&&(this._debug("removePeer %s",r),delete t._peers[r],t._peersLength-=1,e.destroy(),t._drain())},Torrent.prototype.select=function(e,t,r,n){var o=this;if(o.destroyed)throw new Error("torrent is destroyed");if(e<0||t<e||o.pieces.length<=t)throw new Error("invalid selection ",e,":",t);r=Number(r)||0,o._debug("select %s-%s (priority %s)",e,t,r),o._selections.push({from:e,to:t,offset:0,priority:r,notify:n||noop}),o._selections.sort(function(e,t){return t.priority-e.priority}),o._updateSelections()},Torrent.prototype.deselect=function(e,t,r){var n=this;if(n.destroyed)throw new Error("torrent is destroyed");r=Number(r)||0,n._debug("deselect %s-%s (priority %s)",e,t,r);for(var o=0;o<n._selections.length;++o){var i=n._selections[o];if(i.from===e&&i.to===t&&i.priority===r){n._selections.splice(o--,1);break}}n._updateSelections()},Torrent.prototype.critical=function(e,t){var r=this;if(r.destroyed)throw new Error("torrent is destroyed");r._debug("critical %s-%s",e,t);for(var n=e;n<=t;++n)r._critical[n]=!0;r._updateSelections()},Torrent.prototype._onWire=function(e,t){var r=this;if(r._debug("got wire %s (%s)",e._debugId,t||"Unknown"),e.on("download",function(e){r.destroyed||(r.received+=e,r._downloadSpeed(e),r.client._downloadSpeed(e),r.emit("download",e),r.client.emit("download",e))}),e.on("upload",function(e){r.destroyed||(r.uploaded+=e,r._uploadSpeed(e),r.client._uploadSpeed(e),r.emit("upload",e),r.client.emit("upload",e))}),r.wires.push(e),t){var n=addrToIPPort(t);e.remoteAddress=n[0],e.remotePort=n[1]}r.client.dht&&r.client.dht.listening&&e.on("port",function(n){if(!r.destroyed&&!r.client.dht.destroyed){if(!e.remoteAddress)return r._debug("ignoring PORT from peer with no address");if(0===n||n>65536)return r._debug("ignoring invalid PORT from peer");r._debug("port: %s (from %s)",n,t),r.client.dht.addNode({host:e.remoteAddress,port:n})}}),e.on("timeout",function(){r._debug("wire timeout (%s)",t),e.destroy()}),e.setTimeout(PIECE_TIMEOUT,!0),e.setKeepAlive(!0),e.use(utMetadata(r.metadata)),e.ut_metadata.on("warning",function(e){r._debug("ut_metadata warning: %s",e.message)}),r.metadata||(e.ut_metadata.on("metadata",function(e){r._debug("got metadata via ut_metadata"),r._onMetadata(e)}),e.ut_metadata.fetch()),"function"!=typeof utPex||r.private||(e.use(utPex()),e.ut_pex.on("peer",function(e){r.done||(r._debug("ut_pex: got peer: %s (from %s)",e,t),r.addPeer(e))}),e.ut_pex.on("dropped",function(e){var n=r._peers[e];n&&!n.connected&&(r._debug("ut_pex: dropped peer: %s (from %s)",e,t),r.removePeer(e))}),e.once("close",function(){e.ut_pex.reset()})),r.emit("wire",e,t),r.metadata&&process.nextTick(function(){r._onWireWithMetadata(e)})},Torrent.prototype._onWireWithMetadata=function(e){function t(){n.destroyed||e.destroyed||(n._numQueued>2*(n._numConns-n.numPeers)&&e.amInterested?e.destroy():(o=setTimeout(t,CHOKE_TIMEOUT),o.unref&&o.unref()))}function r(){if(e.peerPieces.length===n.pieces.length){for(;i<n.pieces.length;++i)if(!e.peerPieces.get(i))return;e.isSeeder=!0,e.choke()}}var n=this,o=null,i=0;e.on("bitfield",function(){r(),n._update()}),e.on("have",function(){r(),n._update()}),e.once("interested",function(){e.unchoke()}),e.once("close",function(){clearTimeout(o)}),e.on("choke",function(){clearTimeout(o),o=setTimeout(t,CHOKE_TIMEOUT),o.unref&&o.unref()}),e.on("unchoke",function(){clearTimeout(o),n._update()}),e.on("request",function(t,r,o,i){return o>MAX_BLOCK_LENGTH?e.destroy():void(n.pieces[t]||n.store.get(t,{offset:r,length:o},i))}),e.bitfield(n.bitfield),e.interested(),e.peerExtensions.dht&&n.client.dht&&n.client.dht.listening&&e.port(n.client.dht.address().port),o=setTimeout(t,CHOKE_TIMEOUT),o.unref&&o.unref(),e.isSeeder=!1,r()},Torrent.prototype._updateSelections=function(){var e=this;e.ready&&!e.destroyed&&(process.nextTick(function(){e._gcSelections()}),e._updateInterest(),e._update())},Torrent.prototype._gcSelections=function(){for(var e=this,t=0;t<e._selections.length;t++){for(var r=e._selections[t],n=r.offset;e.bitfield.get(r.from+r.offset)&&r.from+r.offset<r.to;)r.offset++;n!==r.offset&&r.notify(),r.to===r.from+r.offset&&e.bitfield.get(r.from+r.offset)&&(e._selections.splice(t--,1),r.notify(),e._updateInterest())}e._selections.length||e.emit("idle")},Torrent.prototype._updateInterest=function(){var e=this,t=e._amInterested;e._amInterested=!!e._selections.length,e.wires.forEach(function(t){e._amInterested?t.interested():t.uninterested()}),t!==e._amInterested&&(e._amInterested?e.emit("interested"):e.emit("uninterested"))},Torrent.prototype._update=function(){var e=this;if(!e.destroyed)for(var t,r=randomIterate(e.wires);t=r();)e._updateWire(t)},Torrent.prototype._updateWire=function(e){function t(t,r,n,o){return function(i){return i>=t&&i<=r&&!(i in n)&&e.peerPieces.get(i)&&(!o||o(i))}}function r(){if(!e.requests.length)for(var r=s._selections.length;r--;){var n,o=s._selections[r];if("rarest"===s.strategy)for(var i=o.from+o.offset,d=o.to,a=d-i+1,u={},c=0,p=t(i,d,u);c<a&&(n=s._rarityMap.getRarestPiece(p),!(n<0));){if(s._request(e,n,!1))return;u[n]=!0,c+=1}else for(n=o.to;n>=o.from+o.offset;--n)if(e.peerPieces.get(n)&&s._request(e,n,!1))return}}function n(){var t=e.downloadSpeed()||1;if(t>SPEED_THRESHOLD)return function(){return!0};var r=Math.max(1,e.requests.length)*Piece.BLOCK_LENGTH/t,n=10,o=0;return function(e){if(!n||s.bitfield.get(e))return!0;for(var i=s.pieces[e].missing;o<s.wires.length;o++){var d=s.wires[o],a=d.downloadSpeed();if(!(a<SPEED_THRESHOLD)&&!(a<=t)&&d.peerPieces.get(e)&&!((i-=a*r)>0))return n--,!1}return!0}}function o(e){for(var t=e,r=e;r<s._selections.length&&s._selections[r].priority;r++)t=r;var n=s._selections[e];s._selections[e]=s._selections[t],s._selections[t]=n}function i(r){if(e.requests.length>=a)return!0;for(var i=n(),d=0;d<s._selections.length;d++){var u,c=s._selections[d];if("rarest"===s.strategy)for(var p=c.from+c.offset,l=c.to,f=l-p+1,h={},_=0,g=t(p,l,h,i);_<f&&(u=s._rarityMap.getRarestPiece(g),!(u<0));){for(;s._request(e,u,s._critical[u]||r););if(!(e.requests.length<a))return c.priority&&o(d),!0;h[u]=!0,_++}else for(u=c.from+c.offset;u<=c.to;u++)if(e.peerPieces.get(u)&&i(u)){for(;s._request(e,u,s._critical[u]||r););if(!(e.requests.length<a))return c.priority&&o(d),!0}}return!1}var s=this;if(!e.peerChoking){if(!e.downloaded)return r();var d=getBlockPipelineLength(e,PIPELINE_MIN_DURATION);if(!(e.requests.length>=d)){var a=getBlockPipelineLength(e,PIPELINE_MAX_DURATION);i(!1)||i(!0)}}},Torrent.prototype._rechoke=function(){function e(e,t){return e.downloadSpeed!==t.downloadSpeed?t.downloadSpeed-e.downloadSpeed:e.uploadSpeed!==t.uploadSpeed?t.uploadSpeed-e.uploadSpeed:e.wire.amChoking!==t.wire.amChoking?e.wire.amChoking?1:-1:e.salt-t.salt}var t=this;if(t.ready){t._rechokeOptimisticTime>0?t._rechokeOptimisticTime-=1:t._rechokeOptimisticWire=null;var r=[];t.wires.forEach(function(e){e.isSeeder||e===t._rechokeOptimisticWire||r.push({wire:e,downloadSpeed:e.downloadSpeed(),uploadSpeed:e.uploadSpeed(),salt:Math.random(),isChoked:!0})}),r.sort(e);for(var n=0,o=0;o<r.length&&n<t._rechokeNumSlots;++o)r[o].isChoked=!1,r[o].wire.peerInterested&&(n+=1);if(!t._rechokeOptimisticWire&&o<r.length&&t._rechokeNumSlots){var i=r.slice(o).filter(function(e){return e.wire.peerInterested}),s=i[randomInt(i.length)];s&&(s.isChoked=!1,t._rechokeOptimisticWire=s.wire,t._rechokeOptimisticTime=RECHOKE_OPTIMISTIC_DURATION)}r.forEach(function(e){e.wire.amChoking!==e.isChoked&&(e.isChoked?e.wire.choke():e.wire.unchoke())})}},Torrent.prototype._hotswap=function(e,t){var r=this,n=e.downloadSpeed();if(n<Piece.BLOCK_LENGTH)return!1;if(!r._reservations[t])return!1;var o=r._reservations[t];if(!o)return!1;var i,s,d=1/0;for(s=0;s<o.length;s++){var a=o[s];if(a&&a!==e){var u=a.downloadSpeed();u>=SPEED_THRESHOLD||2*u>n||u>d||(i=a,d=u)}}if(!i)return!1;for(s=0;s<o.length;s++)o[s]===i&&(o[s]=null);for(s=0;s<i.requests.length;s++){var c=i.requests[s];c.piece===t&&r.pieces[t].cancel(c.offset/Piece.BLOCK_LENGTH|0)}return r.emit("hotswap",i,e,t),!0},Torrent.prototype._request=function(e,t,r){function n(){process.nextTick(function(){o._update()})}var o=this,i=e.requests.length,s="webSeed"===e.type;if(o.bitfield.get(t))return!1;var d=s?Math.min(getPiecePipelineLength(e,PIPELINE_MAX_DURATION,o.pieceLength),o.maxWebConns):getBlockPipelineLength(e,PIPELINE_MAX_DURATION);if(i>=d)return!1;var a=o.pieces[t],u=s?a.reserveRemaining():a.reserve();if(u===-1&&r&&o._hotswap(e,t)&&(u=s?a.reserveRemaining():a.reserve()),u===-1)return!1;var c=o._reservations[t];c||(c=o._reservations[t]=[]);var p=c.indexOf(null);p===-1&&(p=c.length),c[p]=e;var l=a.chunkOffset(u),f=s?a.chunkLengthRemaining(u):a.chunkLength(u);return e.request(t,l,f,function r(i,d){if(!o.ready)return o.once("ready",function(){r(i,d)});if(c[p]===e&&(c[p]=null),a!==o.pieces[t])return n();if(i)return o._debug("error getting piece %s (offset: %s length: %s) from %s: %s",t,l,f,e.remoteAddress+":"+e.remotePort,i.message),s?a.cancelRemaining(u):a.cancel(u),void n();if(o._debug("got piece %s (offset: %s length: %s) from %s",t,l,f,e.remoteAddress+":"+e.remotePort),!a.set(u,d,e))return n();var h=a.flush();sha1(h,function(e){if(e===o._hashes[t]){if(!o.pieces[t])return;o._debug("piece verified %s",t),o.pieces[t]=null,o._reservations[t]=null,o.bitfield.set(t,!0),o.store.put(t,h),o.wires.forEach(function(e){e.have(t)}),o._checkDone()}else o.pieces[t]=new Piece(a.length),o.emit("warning",new Error("Piece "+t+" failed verification"));n()})}),!0},Torrent.prototype._checkDone=function(){var e=this;if(!e.destroyed){e.files.forEach(function(t){if(!t.done){for(var r=t._startPiece;r<=t._endPiece;++r)if(!e.bitfield.get(r))return;t.done=!0,t.emit("done"),e._debug("file done: "+t.name)}});for(var t=!0,r=0;r<e._selections.length;r++){for(var n=e._selections[r],o=n.from;o<=n.to;o++)if(!e.bitfield.get(o)){t=!1;break}if(!t)break}!e.done&&t&&(e.done=!0,e._debug("torrent done: "+e.infoHash),e.discovery.complete(),e.emit("done")),e._gcSelections()}},Torrent.prototype.load=function(e,t){var r=this;if(r.destroyed)throw new Error("torrent is destroyed");if(!r.ready)return r.once("ready",function(){r.load(e,t)});Array.isArray(e)||(e=[e]),t||(t=noop);var n=new MultiStream(e),o=new ChunkStoreWriteStream(r.store,r.pieceLength);pump(n,o,function(e){return e?t(e):(r.pieces.forEach(function(e,t){r.pieces[t]=null,r._reservations[t]=null,r.bitfield.set(t,!0)}),r._checkDone(),void t(null))})},Torrent.prototype.createServer=function(e){if("function"!=typeof Server)throw new Error("node.js-only method");if(this.destroyed)throw new Error("torrent is destroyed");var t=new Server(this,e);return this._servers.push(t),t},Torrent.prototype.pause=function(){this.destroyed||(this._debug("pause"),this.paused=!0)},Torrent.prototype.resume=function(){this.destroyed||(this._debug("resume"),this.paused=!1,this._drain())},Torrent.prototype._debug=function(){var e=[].slice.call(arguments);e[0]="["+this._debugId+"] "+e[0],debug.apply(null,e)},Torrent.prototype._drain=function(){var e=this;if(this._debug("_drain numConns %s maxConns %s",e._numConns,e.client.maxConns),!("function"!=typeof net.connect||e.destroyed||e.paused||e._numConns>=e.client.maxConns)){this._debug("drain (%s queued, %s/%s peers)",e._numQueued,e.numPeers,e.client.maxConns);var t=e._queue.shift();if(t){this._debug("tcp connect attempt to %s",t.addr);var r=addrToIPPort(t.addr),n={host:r[0],port:r[1]},o=t.conn=net.connect(n);o.once("connect",function(){t.onConnect()}),o.once("error",function(e){t.destroy(e)}),t.startConnectTimeout(),o.on("close",function(){if(!e.destroyed){if(t.retries>=RECONNECT_WAIT.length)return void e._debug("conn %s closed: will not re-add (max %s attempts)",t.addr,RECONNECT_WAIT.length);var r=RECONNECT_WAIT[t.retries];e._debug("conn %s closed: will re-add to queue in %sms (attempt %s)",t.addr,r,t.retries+1);var n=setTimeout(function(){var r=e._addPeer(t.addr);r&&(r.retries=t.retries+1)},r);n.unref&&n.unref()}})}}},Torrent.prototype._validAddr=function(e){var t;try{t=addrToIPPort(e)}catch(e){return!1}var r=t[0],n=t[1];return n>0&&n<65535&&!("127.0.0.1"===r&&n===this.client.torrentPort)};
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../package.json":231,"./file":119,"./peer":120,"./rarity-map":121,"./server":32,"_process":41,"addr-to-ip-port":124,"bitfield":125,"chunk-store-stream/write":132,"debug":149,"events":37,"fs":31,"fs-chunk-store":157,"immediate-chunk-store":155,"inherits":156,"multistream":158,"net":32,"os":32,"parse-torrent":159,"path":40,"pump":168,"random-iterate":171,"run-parallel":204,"run-parallel-limit":203,"simple-get":207,"simple-sha1":210,"speedometer":212,"torrent-discovery":220,"torrent-piece":221,"uniq":222,"ut_metadata":224,"ut_pex":32,"xtend":228,"xtend/mutable":229}],123:[function(require,module,exports){
function WebConn(e,t){Wire.call(this),this.url=e,this.webPeerId=sha1.sync(e),this._torrent=t,this._init()}module.exports=WebConn;var BitField=require("bitfield"),Buffer=require("safe-buffer").Buffer,debug=require("debug")("webtorrent:webconn"),get=require("simple-get"),inherits=require("inherits"),sha1=require("simple-sha1"),Wire=require("bittorrent-protocol"),VERSION=require("../package.json").version;inherits(WebConn,Wire),WebConn.prototype._init=function(){var e=this;e.setKeepAlive(!0),e.once("handshake",function(t,n){if(!e.destroyed){e.handshake(t,e.webPeerId);for(var r=e._torrent.pieces.length,o=new BitField(r),i=0;i<=r;i++)o.set(i,!0);e.bitfield(o)}}),e.once("interested",function(){debug("interested"),e.unchoke()}),e.on("uninterested",function(){debug("uninterested")}),e.on("choke",function(){debug("choke")}),e.on("unchoke",function(){debug("unchoke")}),e.on("bitfield",function(){debug("bitfield")}),e.on("request",function(t,n,r,o){debug("request pieceIndex=%d offset=%d length=%d",t,n,r),e.httpRequest(t,n,r,o)})},WebConn.prototype.httpRequest=function(e,t,n,r){var o,i=this,u=e*i._torrent.pieceLength,s=u+t,f=s+n-1,d=i._torrent.files;if(d.length<=1)o=[{url:i.url,start:s,end:f}];else{var l=d.filter(function(e){return e.offset<=f&&e.offset+e.length>s});if(l.length<1)return r(new Error("Could not find file corresponnding to web seed range request"));o=l.map(function(e){var t=e.offset+e.length-1,n=i.url+("/"===i.url[i.url.length-1]?"":"/")+e.path;return{url:n,fileOffsetInRange:Math.max(e.offset-s,0),start:Math.max(s-e.offset,0),end:Math.min(t,f-e.offset)}})}var h,a=0,c=!1;o.length>1&&(h=Buffer.alloc(n)),o.forEach(function(i){var u=i.url,s=i.start,f=i.end;debug("Requesting url=%s pieceIndex=%d offset=%d length=%d start=%d end=%d",u,e,t,n,s,f);var d={url:u,method:"GET",headers:{"user-agent":"WebTorrent/"+VERSION+" (https://webtorrent.io)",range:"bytes="+s+"-"+f}};get.concat(d,function(e,t,n){if(!c){if(e)return c=!0,r(e);if(t.statusCode<200||t.statusCode>=300)return c=!0,r(new Error("Unexpected HTTP status code "+t.statusCode));debug("Got data of length %d",n.length),1===o.length?r(null,n):(n.copy(h,i.fileOffsetInRange),++a===o.length&&r(null,h))}})})},WebConn.prototype.destroy=function(){Wire.prototype.destroy.call(this),this._torrent=null};
},{"../package.json":231,"bitfield":125,"bittorrent-protocol":126,"debug":149,"inherits":156,"safe-buffer":205,"simple-get":207,"simple-sha1":210}],124:[function(require,module,exports){
var ADDR_RE=/^\[?([^\]]+)\]?:(\d+)$/,cache={},size=0;module.exports=function(e){if(1e5===size&&module.exports.reset(),!cache[e]){var r=ADDR_RE.exec(e);if(!r)throw new Error("invalid addr: "+e);cache[e]=[r[1],Number(r[2])],size+=1}return cache[e]},module.exports.reset=function(){cache={},size=0};
},{}],125:[function(require,module,exports){
(function (Buffer){
function BitField(e,t){return this instanceof BitField?(0===arguments.length&&(e=0),this.grow=t&&(isFinite(t.grow)&&getByteSize(t.grow)||t.grow)||0,"number"!=typeof e&&void 0!==e||(e=new Container(getByteSize(e)),e.fill&&!e._isBuffer&&e.fill(0)),void(this.buffer=e)):new BitField(e,t)}function getByteSize(e){var t=e>>3;return e%8!==0&&t++,t}var Container="undefined"!=typeof Buffer?Buffer:"undefined"!=typeof Int8Array?Int8Array:function(e){for(var t=new Array(e),i=0;i<e;i++)t[i]=0};BitField.prototype.get=function(e){var t=e>>3;return t<this.buffer.length&&!!(this.buffer[t]&128>>e%8)},BitField.prototype.set=function(e,t){var i=e>>3;t||1===arguments.length?(this.buffer.length<i+1&&this._grow(Math.max(i+1,Math.min(2*this.buffer.length,this.grow))),this.buffer[i]|=128>>e%8):i<this.buffer.length&&(this.buffer[i]&=~(128>>e%8))},BitField.prototype._grow=function(e){if(this.buffer.length<e&&e<=this.grow){var t=new Container(e);if(t.fill&&t.fill(0),this.buffer.copy)this.buffer.copy(t,0);else for(var i=0;i<this.buffer.length;i++)t[i]=this.buffer[i];this.buffer=t}},"undefined"!=typeof module&&(module.exports=BitField);
}).call(this,require("buffer").Buffer)
},{"buffer":33}],126:[function(require,module,exports){
function Request(e,t,i,s){this.piece=e,this.offset=t,this.length=i,this.callback=s}function Wire(){return this instanceof Wire?(stream.Duplex.call(this),this._debugId=randombytes(4).toString("hex"),this._debug("new wire"),this.peerId=null,this.peerIdBuffer=null,this.type=null,this.amChoking=!0,this.amInterested=!1,this.peerChoking=!0,this.peerInterested=!1,this.peerPieces=new BitField(0,{grow:BITFIELD_GROW}),this.peerExtensions={},this.requests=[],this.peerRequests=[],this.extendedMapping={},this.peerExtendedMapping={},this.extendedHandshake={},this.peerExtendedHandshake={},this._ext={},this._nextExt=1,this.uploaded=0,this.downloaded=0,this.uploadSpeed=speedometer(),this.downloadSpeed=speedometer(),this._keepAliveInterval=null,this._timeout=null,this._timeoutMs=0,this.destroyed=!1,this._finished=!1,this._parserSize=0,this._parser=null,this._buffer=[],this._bufferSize=0,this.on("finish",this._onFinish),void this._parseHandshake()):new Wire}function pull(e,t,i,s){for(var n=0;n<e.length;n++){var r=e[n];if(r.piece===t&&r.offset===i&&r.length===s)return 0===n?e.shift():e.splice(n,1),r}return null}module.exports=Wire;var bencode=require("bencode"),BitField=require("bitfield"),Buffer=require("safe-buffer").Buffer,debug=require("debug")("bittorrent-protocol"),extend=require("xtend"),inherits=require("inherits"),randombytes=require("randombytes"),speedometer=require("speedometer"),stream=require("readable-stream"),BITFIELD_GROW=4e5,KEEP_ALIVE_TIMEOUT=55e3,MESSAGE_PROTOCOL=Buffer.from("BitTorrent protocol"),MESSAGE_KEEP_ALIVE=Buffer.from([0,0,0,0]),MESSAGE_CHOKE=Buffer.from([0,0,0,1,0]),MESSAGE_UNCHOKE=Buffer.from([0,0,0,1,1]),MESSAGE_INTERESTED=Buffer.from([0,0,0,1,2]),MESSAGE_UNINTERESTED=Buffer.from([0,0,0,1,3]),MESSAGE_RESERVED=[0,0,0,0,0,0,0,0],MESSAGE_PORT=[0,0,0,3,9,0,0];inherits(Wire,stream.Duplex),Wire.prototype.setKeepAlive=function(e){var t=this;t._debug("setKeepAlive %s",e),clearInterval(t._keepAliveInterval),e!==!1&&(t._keepAliveInterval=setInterval(function(){t.keepAlive()},KEEP_ALIVE_TIMEOUT))},Wire.prototype.setTimeout=function(e,t){this._debug("setTimeout ms=%d unref=%s",e,t),this._clearTimeout(),this._timeoutMs=e,this._timeoutUnref=!!t,this._updateTimeout()},Wire.prototype.destroy=function(){this.destroyed||(this.destroyed=!0,this._debug("destroy"),this.emit("close"),this.end())},Wire.prototype.end=function(){this._debug("end"),this._onUninterested(),this._onChoke(),stream.Duplex.prototype.end.apply(this,arguments)},Wire.prototype.use=function(e){function t(){}var i=e.prototype.name;if(!i)throw new Error('Extension class requires a "name" property on the prototype');this._debug("use extension.name=%s",i);var s=this._nextExt,n=new e(this);"function"!=typeof n.onHandshake&&(n.onHandshake=t),"function"!=typeof n.onExtendedHandshake&&(n.onExtendedHandshake=t),"function"!=typeof n.onMessage&&(n.onMessage=t),this.extendedMapping[s]=i,this._ext[i]=n,this[i]=n,this._nextExt+=1},Wire.prototype.keepAlive=function(){this._debug("keep-alive"),this._push(MESSAGE_KEEP_ALIVE)},Wire.prototype.handshake=function(e,t,i){var s,n;if("string"==typeof e?s=Buffer.from(e,"hex"):(s=e,e=s.toString("hex")),"string"==typeof t?n=Buffer.from(t,"hex"):(n=t,t=n.toString("hex")),20!==s.length||20!==n.length)throw new Error("infoHash and peerId MUST have length 20");this._debug("handshake i=%s p=%s exts=%o",e,t,i);var r=Buffer.from(MESSAGE_RESERVED);r[5]|=16,i&&i.dht&&(r[7]|=1),this._push(Buffer.concat([MESSAGE_PROTOCOL,r,s,n])),this._handshakeSent=!0,this.peerExtensions.extended&&!this._extendedHandshakeSent&&this._sendExtendedHandshake()},Wire.prototype._sendExtendedHandshake=function(){var e=extend(this.extendedHandshake);e.m={};for(var t in this.extendedMapping){var i=this.extendedMapping[t];e.m[i]=Number(t)}this.extended(0,bencode.encode(e)),this._extendedHandshakeSent=!0},Wire.prototype.choke=function(){this.amChoking||(this.amChoking=!0,this._debug("choke"),this.peerRequests.splice(0,this.peerRequests.length),this._push(MESSAGE_CHOKE))},Wire.prototype.unchoke=function(){this.amChoking&&(this.amChoking=!1,this._debug("unchoke"),this._push(MESSAGE_UNCHOKE))},Wire.prototype.interested=function(){this.amInterested||(this.amInterested=!0,this._debug("interested"),this._push(MESSAGE_INTERESTED))},Wire.prototype.uninterested=function(){this.amInterested&&(this.amInterested=!1,this._debug("uninterested"),this._push(MESSAGE_UNINTERESTED))},Wire.prototype.have=function(e){this._debug("have %d",e),this._message(4,[e],null)},Wire.prototype.bitfield=function(e){this._debug("bitfield"),Buffer.isBuffer(e)||(e=e.buffer),this._message(5,[],e)},Wire.prototype.request=function(e,t,i,s){return s||(s=function(){}),this._finished?s(new Error("wire is closed")):this.peerChoking?s(new Error("peer is choking")):(this._debug("request index=%d offset=%d length=%d",e,t,i),this.requests.push(new Request(e,t,i,s)),this._updateTimeout(),void this._message(6,[e,t,i],null))},Wire.prototype.piece=function(e,t,i){this._debug("piece index=%d offset=%d",e,t),this.uploaded+=i.length,this.uploadSpeed(i.length),this.emit("upload",i.length),this._message(7,[e,t],i)},Wire.prototype.cancel=function(e,t,i){this._debug("cancel index=%d offset=%d length=%d",e,t,i),this._callback(pull(this.requests,e,t,i),new Error("request was cancelled"),null),this._message(8,[e,t,i],null)},Wire.prototype.port=function(e){this._debug("port %d",e);var t=Buffer.from(MESSAGE_PORT);t.writeUInt16BE(e,5),this._push(t)},Wire.prototype.extended=function(e,t){if(this._debug("extended ext=%s",e),"string"==typeof e&&this.peerExtendedMapping[e]&&(e=this.peerExtendedMapping[e]),"number"!=typeof e)throw new Error("Unrecognized extension: "+e);var i=Buffer.from([e]),s=Buffer.isBuffer(t)?t:bencode.encode(t);this._message(20,[],Buffer.concat([i,s]))},Wire.prototype._read=function(){},Wire.prototype._message=function(e,t,i){var s=i?i.length:0,n=Buffer.allocUnsafe(5+4*t.length);n.writeUInt32BE(n.length+s-4,0),n[4]=e;for(var r=0;r<t.length;r++)n.writeUInt32BE(t[r],5+4*r);this._push(n),i&&this._push(i)},Wire.prototype._push=function(e){if(!this._finished)return this.push(e)},Wire.prototype._onKeepAlive=function(){this._debug("got keep-alive"),this.emit("keep-alive")},Wire.prototype._onHandshake=function(e,t,i){var s=e.toString("hex"),n=t.toString("hex");this._debug("got handshake i=%s p=%s exts=%o",s,n,i),this.peerId=n,this.peerIdBuffer=t,this.peerExtensions=i,this.emit("handshake",s,n,i);var r;for(r in this._ext)this._ext[r].onHandshake(s,n,i);i.extended&&this._handshakeSent&&!this._extendedHandshakeSent&&this._sendExtendedHandshake()},Wire.prototype._onChoke=function(){for(this.peerChoking=!0,this._debug("got choke"),this.emit("choke");this.requests.length;)this._callback(this.requests.shift(),new Error("peer is choking"),null)},Wire.prototype._onUnchoke=function(){this.peerChoking=!1,this._debug("got unchoke"),this.emit("unchoke")},Wire.prototype._onInterested=function(){this.peerInterested=!0,this._debug("got interested"),this.emit("interested")},Wire.prototype._onUninterested=function(){this.peerInterested=!1,this._debug("got uninterested"),this.emit("uninterested")},Wire.prototype._onHave=function(e){this.peerPieces.get(e)||(this._debug("got have %d",e),this.peerPieces.set(e,!0),this.emit("have",e))},Wire.prototype._onBitField=function(e){this.peerPieces=new BitField(e),this._debug("got bitfield"),this.emit("bitfield",this.peerPieces)},Wire.prototype._onRequest=function(e,t,i){var s=this;if(!s.amChoking){s._debug("got request index=%d offset=%d length=%d",e,t,i);var n=function(n,o){if(r===pull(s.peerRequests,e,t,i))return n?s._debug("error satisfying request index=%d offset=%d length=%d (%s)",e,t,i,n.message):void s.piece(e,t,o)},r=new Request(e,t,i,n);s.peerRequests.push(r),s.emit("request",e,t,i,n)}},Wire.prototype._onPiece=function(e,t,i){this._debug("got piece index=%d offset=%d",e,t),this._callback(pull(this.requests,e,t,i.length),null,i),this.downloaded+=i.length,this.downloadSpeed(i.length),this.emit("download",i.length),this.emit("piece",e,t,i)},Wire.prototype._onCancel=function(e,t,i){this._debug("got cancel index=%d offset=%d length=%d",e,t,i),pull(this.peerRequests,e,t,i),this.emit("cancel",e,t,i)},Wire.prototype._onPort=function(e){this._debug("got port %d",e),this.emit("port",e)},Wire.prototype._onExtended=function(e,t){if(0===e){var i;try{i=bencode.decode(t)}catch(e){this._debug("ignoring invalid extended handshake: %s",e.message||e)}if(!i)return;this.peerExtendedHandshake=i;var s;if("object"==typeof i.m)for(s in i.m)this.peerExtendedMapping[s]=Number(i.m[s].toString());for(s in this._ext)this.peerExtendedMapping[s]&&this._ext[s].onExtendedHandshake(this.peerExtendedHandshake);this._debug("got extended handshake"),this.emit("extended","handshake",this.peerExtendedHandshake)}else this.extendedMapping[e]&&(e=this.extendedMapping[e],this._ext[e]&&this._ext[e].onMessage(t)),this._debug("got extended message ext=%s",e),this.emit("extended",e,t)},Wire.prototype._onTimeout=function(){this._debug("request timed out"),this._callback(this.requests.shift(),new Error("request has timed out"),null),this.emit("timeout")},Wire.prototype._write=function(e,t,i){for(this._bufferSize+=e.length,this._buffer.push(e);this._bufferSize>=this._parserSize;){var s=1===this._buffer.length?this._buffer[0]:Buffer.concat(this._buffer);this._bufferSize-=this._parserSize,this._buffer=this._bufferSize?[s.slice(this._parserSize)]:[],this._parser(s.slice(0,this._parserSize))}i(null)},Wire.prototype._callback=function(e,t,i){e&&(this._clearTimeout(),this.peerChoking||this._finished||this._updateTimeout(),e.callback(t,i))},Wire.prototype._clearTimeout=function(){this._timeout&&(clearTimeout(this._timeout),this._timeout=null)},Wire.prototype._updateTimeout=function(){var e=this;e._timeoutMs&&e.requests.length&&!e._timeout&&(e._timeout=setTimeout(function(){e._onTimeout()},e._timeoutMs),e._timeoutUnref&&e._timeout.unref&&e._timeout.unref())},Wire.prototype._parse=function(e,t){this._parserSize=e,this._parser=t},Wire.prototype._onMessageLength=function(e){var t=e.readUInt32BE(0);t>0?this._parse(t,this._onMessage):(this._onKeepAlive(),this._parse(4,this._onMessageLength))},Wire.prototype._onMessage=function(e){switch(this._parse(4,this._onMessageLength),e[0]){case 0:return this._onChoke();case 1:return this._onUnchoke();case 2:return this._onInterested();case 3:return this._onUninterested();case 4:return this._onHave(e.readUInt32BE(1));case 5:return this._onBitField(e.slice(1));case 6:return this._onRequest(e.readUInt32BE(1),e.readUInt32BE(5),e.readUInt32BE(9));case 7:return this._onPiece(e.readUInt32BE(1),e.readUInt32BE(5),e.slice(9));case 8:return this._onCancel(e.readUInt32BE(1),e.readUInt32BE(5),e.readUInt32BE(9));case 9:return this._onPort(e.readUInt16BE(1));case 20:return this._onExtended(e.readUInt8(1),e.slice(2));default:return this._debug("got unknown message"),this.emit("unknownmessage",e)}},Wire.prototype._parseHandshake=function(){var e=this;e._parse(1,function(t){var i=t.readUInt8(0);e._parse(i+48,function(t){var s=t.slice(0,i);return"BitTorrent protocol"!==s.toString()?(e._debug("Error: wire not speaking BitTorrent protocol (%s)",s.toString()),void e.end()):(t=t.slice(i),e._onHandshake(t.slice(8,28),t.slice(28,48),{dht:!!(1&t[7]),extended:!!(16&t[5])}),void e._parse(4,e._onMessageLength))})})},Wire.prototype._onFinish=function(){for(this._finished=!0,this.push(null);this.read(););for(clearInterval(this._keepAliveInterval),this._parse(Number.MAX_VALUE,function(){}),this.peerRequests=[];this.requests.length;)this._callback(this.requests.shift(),new Error("wire was closed"),null)},Wire.prototype._debug=function(){var e=[].slice.call(arguments);e[0]="["+this._debugId+"] "+e[0],debug.apply(null,e)};
},{"bencode":129,"bitfield":125,"debug":149,"inherits":156,"randombytes":172,"readable-stream":185,"safe-buffer":205,"speedometer":212,"xtend":228}],127:[function(require,module,exports){
(function (Buffer){
function decode(e,d,o,n){return"number"!=typeof d&&null==n&&(n=d,d=void 0),"number"!=typeof o&&null==n&&(n=o,o=void 0),decode.position=0,decode.encoding=n||null,decode.data=Buffer.isBuffer(e)?e.slice(d,o):new Buffer(e),decode.bytes=decode.data.length,decode.next()}decode.bytes=0,decode.position=0,decode.data=null,decode.encoding=null,decode.next=function(){switch(decode.data[decode.position]){case 100:return decode.dictionary();case 108:return decode.list();case 105:return decode.integer();default:return decode.buffer()}},decode.find=function(e){for(var d=decode.position,o=decode.data.length,n=decode.data;d<o;){if(n[d]===e)return d;d++}throw new Error('Invalid data: Missing delimiter "'+String.fromCharCode(e)+'" [0x'+e.toString(16)+"]")},decode.dictionary=function(){decode.position++;for(var e={};101!==decode.data[decode.position];)e[decode.buffer()]=decode.next();return decode.position++,e},decode.list=function(){decode.position++;for(var e=[];101!==decode.data[decode.position];)e.push(decode.next());return decode.position++,e},decode.integer=function(){var e=decode.find(101),d=decode.data.toString("ascii",decode.position+1,e);return decode.position+=e+1-decode.position,parseInt(d,10)},decode.buffer=function(){var e=decode.find(58),d=parseInt(decode.data.toString("ascii",decode.position,e),10),o=++e+d;return decode.position=o,decode.encoding?decode.data.toString(decode.encoding,e,o):decode.data.slice(e,o)},module.exports=decode;
}).call(this,require("buffer").Buffer)
},{"buffer":33}],128:[function(require,module,exports){
(function (Buffer){
function encode(e,n,o){var f=[],c=null;return encode._encode(f,e),c=Buffer.concat(f),encode.bytes=c.length,Buffer.isBuffer(n)?(c.copy(n,o),n):c}encode.bytes=-1,encode._floatConversionDetected=!1,encode._encode=function(e,n){if(Buffer.isBuffer(n))return e.push(new Buffer(n.length+":")),void e.push(n);switch(typeof n){case"string":encode.buffer(e,n);break;case"number":encode.number(e,n);break;case"object":n.constructor===Array?encode.list(e,n):encode.dict(e,n);break;case"boolean":encode.number(e,n?1:0)}};var buffE=new Buffer("e"),buffD=new Buffer("d"),buffL=new Buffer("l");encode.buffer=function(e,n){e.push(new Buffer(Buffer.byteLength(n)+":"+n))},encode.number=function(e,n){var o=2147483648,f=n/o<<0,c=n%o<<0,r=f*o+c;e.push(new Buffer("i"+r+"e")),r===n||encode._floatConversionDetected||(encode._floatConversionDetected=!0,console.warn('WARNING: Possible data corruption detected with value "'+n+'":','Bencoding only defines support for integers, value was converted to "'+r+'"'),console.trace())},encode.dict=function(e,n){e.push(buffD);for(var o,f=0,c=Object.keys(n).sort(),r=c.length;f<r;f++)o=c[f],encode.buffer(e,o),encode._encode(e,n[o]);e.push(buffE)},encode.list=function(e,n){var o=0,f=n.length;for(e.push(buffL);o<f;o++)encode._encode(e,n[o]);e.push(buffE)},module.exports=encode;
}).call(this,require("buffer").Buffer)
},{"buffer":33}],129:[function(require,module,exports){
var bencode=module.exports;bencode.encode=require("./encode"),bencode.decode=require("./decode"),bencode.byteLength=bencode.encodingLength=function(e){return bencode.encode(e).length};
},{"./decode":127,"./encode":128}],130:[function(require,module,exports){
(function (Buffer){
function Block(e,s){return this instanceof Block?(Transform.call(this),s||(s={}),"object"==typeof e&&(s=e,e=s.size),this.size=e||512,s.nopad?this._zeroPadding=!1:this._zeroPadding=defined(s.zeroPadding,!0),this._buffered=[],void(this._bufferedBytes=0)):new Block(e,s)}var inherits=require("inherits"),Transform=require("readable-stream").Transform,defined=require("defined");module.exports=Block,inherits(Block,Transform),Block.prototype._transform=function(e,s,i){for(this._bufferedBytes+=e.length,this._buffered.push(e);this._bufferedBytes>=this.size;){var t=Buffer.concat(this._buffered);this._bufferedBytes-=this.size,this.push(t.slice(0,this.size)),this._buffered=[t.slice(this.size,t.length)]}i()},Block.prototype._flush=function(){if(this._bufferedBytes&&this._zeroPadding){var e=new Buffer(this.size-this._bufferedBytes);e.fill(0),this._buffered.push(e),this.push(Buffer.concat(this._buffered)),this._buffered=null}else this._bufferedBytes&&(this.push(Buffer.concat(this._buffered)),this._buffered=null);this.push(null)};
}).call(this,require("buffer").Buffer)
},{"buffer":33,"defined":131,"inherits":156,"readable-stream":185}],131:[function(require,module,exports){
module.exports=function(){for(var o=0;o<arguments.length;o++)if(void 0!==arguments[o])return arguments[o]};
},{}],132:[function(require,module,exports){
function ChunkStoreWriteStream(t,e,r){function o(e){i.destroyed||(t.put(n,e),n+=1)}var i=this;if(!(i instanceof ChunkStoreWriteStream))return new ChunkStoreWriteStream(t,e,r);if(stream.Writable.call(i,r),r||(r={}),!t||!t.put||!t.get)throw new Error("First argument must be an abstract-chunk-store compliant store");if(e=Number(e),!e)throw new Error("Second argument must be a chunk length");i._blockstream=new BlockStream(e,{zeroPadding:!1}),i._blockstream.on("data",o).on("error",function(t){i.destroy(t)});var n=0;i.on("finish",function(){this._blockstream.end()})}module.exports=ChunkStoreWriteStream;var BlockStream=require("block-stream2"),inherits=require("inherits"),stream=require("readable-stream");inherits(ChunkStoreWriteStream,stream.Writable),ChunkStoreWriteStream.prototype._write=function(t,e,r){this._blockstream.write(t,e,r)},ChunkStoreWriteStream.prototype.destroy=function(t){this.destroyed||(this.destroyed=!0,t&&this.emit("error",t),this.emit("close"))};
},{"block-stream2":130,"inherits":156,"readable-stream":185}],133:[function(require,module,exports){
(function (process,global,Buffer){
function createTorrent(e,t,n){return"function"==typeof t?createTorrent(e,null,t):(t=t?extend(t):{},void _parseInput(e,t,function(e,r,i){return e?n(e):(t.singleFileTorrent=i,void onFiles(r,t,n))}))}function parseInput(e,t,n){return"function"==typeof t?parseInput(e,null,t):(t=t?extend(t):{},void _parseInput(e,t,n))}function _parseInput(e,t,n){function r(){parallel(e.map(function(e){return function(t){var n={};if(isBlob(e))n.getStream=getBlobStream(e),n.length=e.size;else if(Buffer.isBuffer(e))n.getStream=getBufferStream(e),n.length=e.length;else{if(!isReadable(e)){if("string"==typeof e){if("function"!=typeof fs.stat)throw new Error("filesystem paths do not work in the browser");var r=o>1||a;return void getFiles(e,r,t)}throw new Error("invalid input type")}n.getStream=getStreamStream(e,n),n.length=0}n.path=e.path,t(null,n)}}),function(e,t){return e?n(e):(t=flatten(t),void n(null,t,a))})}if(Array.isArray(e)&&0===e.length)throw new Error("invalid input type");isFileList(e)&&(e=Array.prototype.slice.call(e)),Array.isArray(e)||(e=[e]),e=e.map(function(e){return isBlob(e)&&"string"==typeof e.path?e.path:e}),1!==e.length||"string"==typeof e[0]||e[0].name||(e[0].name=t.name);var i=null;e.forEach(function(t,n){if("string"!=typeof t){var r=t.fullPath||t.name;r||(r="Unknown File "+(n+1),t.unknownName=!0),t.path=r.split("/"),t.path[0]||t.path.shift(),t.path.length<2?i=null:0===n&&e.length>1?i=t.path[0]:t.path[0]!==i&&(i=null)}}),e=e.filter(function(e){if("string"==typeof e)return!0;var t=e.path[e.path.length-1];return notHidden(t)&&junk.not(t)}),i&&e.forEach(function(e){var t=(Buffer.isBuffer(e)||isReadable(e))&&!e.path;"string"==typeof e||t||e.path.shift()}),!t.name&&i&&(t.name=i),t.name||e.some(function(e){return"string"==typeof e?(t.name=corePath.basename(e),!0):e.unknownName?void 0:(t.name=e.path[e.path.length-1],!0)}),t.name||(t.name="Unnamed Torrent "+Date.now());var o=e.reduce(function(e,t){return e+Number("string"==typeof t)},0),a=1===e.length;if(1===e.length&&"string"==typeof e[0]){if("function"!=typeof fs.stat)throw new Error("filesystem paths do not work in the browser");isFile(e[0],function(e,t){return e?n(e):(a=t,void r())})}else process.nextTick(function(){r()})}function getFiles(e,t,n){traversePath(e,getFileInfo,function(r,i){return r?n(r):(i=Array.isArray(i)?flatten(i):[i],e=corePath.normalize(e),t&&(e=e.slice(0,e.lastIndexOf(corePath.sep)+1)),e[e.length-1]!==corePath.sep&&(e+=corePath.sep),i.forEach(function(t){t.getStream=getFilePathStream(t.path),t.path=t.path.replace(e,"").split(corePath.sep)}),void n(null,i))})}function getFileInfo(e,t){t=once(t),fs.stat(e,function(n,r){if(n)return t(n);var i={length:r.size,path:e};t(null,i)})}function traversePath(e,t,n){fs.readdir(e,function(r,i){r&&"ENOTDIR"===r.code?t(e,n):r?n(r):parallel(i.filter(notHidden).filter(junk.not).map(function(n){return function(r){traversePath(corePath.join(e,n),t,r)}}),n)})}function notHidden(e){return"."!==e[0]}function getPieceList(e,t,n){function r(e){s+=e.length;var t=p;sha1(e,function(e){l[t]=e,f-=1,u()}),f+=1,p+=1}function i(){h=!0,u()}function o(e){a(),n(e)}function a(){m.removeListener("error",o),d.removeListener("data",r),d.removeListener("end",i),d.removeListener("error",o)}function u(){h&&0===f&&(a(),n(null,new Buffer(l.join(""),"hex"),s))}n=once(n);var l=[],s=0,c=e.map(function(e){return e.getStream}),f=0,p=0,h=!1,m=new MultiStream(c),d=new BlockStream(t,{zeroPadding:!1});m.on("error",o),m.pipe(d).on("data",r).on("end",i).on("error",o)}function onFiles(e,t,n){var r=t.announceList;r||("string"==typeof t.announce?r=[[t.announce]]:Array.isArray(t.announce)&&(r=t.announce.map(function(e){return[e]}))),r||(r=[]),global.WEBTORRENT_ANNOUNCE&&("string"==typeof global.WEBTORRENT_ANNOUNCE?r.push([[global.WEBTORRENT_ANNOUNCE]]):Array.isArray(global.WEBTORRENT_ANNOUNCE)&&(r=r.concat(global.WEBTORRENT_ANNOUNCE.map(function(e){return[e]})))),void 0===t.announce&&void 0===t.announceList&&(r=r.concat(module.exports.announceList)),"string"==typeof t.urlList&&(t.urlList=[t.urlList]);var i={info:{name:t.name},"creation date":Math.ceil((Number(t.creationDate)||Date.now())/1e3),encoding:"UTF-8"};0!==r.length&&(i.announce=r[0][0],i["announce-list"]=r),void 0!==t.comment&&(i.comment=t.comment),void 0!==t.createdBy&&(i["created by"]=t.createdBy),void 0!==t.private&&(i.info.private=Number(t.private)),void 0!==t.sslCert&&(i.info["ssl-cert"]=t.sslCert),void 0!==t.urlList&&(i["url-list"]=t.urlList);var o=t.pieceLength||calcPieceLength(e.reduce(sumLength,0));i.info["piece length"]=o,getPieceList(e,o,function(r,o,a){return r?n(r):(i.info.pieces=o,e.forEach(function(e){delete e.getStream}),t.singleFileTorrent?i.info.length=a:i.info.files=e,void n(null,bencode.encode(i)))})}function sumLength(e,t){return e+t.length}function isBlob(e){return"undefined"!=typeof Blob&&e instanceof Blob}function isFileList(e){return"undefined"!=typeof FileList&&e instanceof FileList}function isReadable(e){return"object"==typeof e&&null!=e&&"function"==typeof e.pipe}function getBlobStream(e){return function(){return new FileReadStream(e)}}function getBufferStream(e){return function(){var t=new stream.PassThrough;return t.end(e),t}}function getFilePathStream(e){return function(){return fs.createReadStream(e)}}function getStreamStream(e,t){return function(){var n=new stream.Transform;return n._transform=function(e,n,r){t.length+=e.length,this.push(e),r()},e.pipe(n),n}}module.exports=createTorrent,module.exports.parseInput=parseInput,module.exports.announceList=[["udp://tracker.openbittorrent.com:80"],["udp://tracker.internetwarriors.net:1337"],["udp://tracker.leechers-paradise.org:6969"],["udp://tracker.coppersurfer.tk:6969"],["udp://exodus.desync.com:6969"],["wss://tracker.webtorrent.io"],["wss://tracker.btorrent.xyz"],["wss://tracker.openwebtorrent.com"],["wss://tracker.fastcast.nz"]];var bencode=require("bencode"),BlockStream=require("block-stream2"),calcPieceLength=require("piece-length"),corePath=require("path"),extend=require("xtend"),FileReadStream=require("filestream/read"),flatten=require("flatten"),fs=require("fs"),isFile=require("is-file"),junk=require("junk"),MultiStream=require("multistream"),once=require("once"),parallel=require("run-parallel"),sha1=require("simple-sha1"),stream=require("readable-stream");
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"_process":41,"bencode":136,"block-stream2":137,"buffer":33,"filestream/read":141,"flatten":142,"fs":31,"is-file":143,"junk":144,"multistream":158,"once":146,"path":40,"piece-length":147,"readable-stream":185,"run-parallel":204,"simple-sha1":210,"xtend":228}],134:[function(require,module,exports){
arguments[4][127][0].apply(exports,arguments)
},{"buffer":33,"dup":127}],135:[function(require,module,exports){
arguments[4][128][0].apply(exports,arguments)
},{"buffer":33,"dup":128}],136:[function(require,module,exports){
arguments[4][129][0].apply(exports,arguments)
},{"./decode":134,"./encode":135,"dup":129}],137:[function(require,module,exports){
arguments[4][130][0].apply(exports,arguments)
},{"buffer":33,"defined":138,"dup":130,"inherits":156,"readable-stream":185}],138:[function(require,module,exports){
arguments[4][131][0].apply(exports,arguments)
},{"dup":131}],139:[function(require,module,exports){
(function (Buffer){
var isTypedArray=require("is-typedarray").strict;module.exports=function(e){if(isTypedArray(e)){var r=new Buffer(e.buffer);return e.byteLength!==e.buffer.byteLength&&(r=r.slice(e.byteOffset,e.byteOffset+e.byteLength)),r}return new Buffer(e)};
}).call(this,require("buffer").Buffer)
},{"buffer":33,"is-typedarray":140}],140:[function(require,module,exports){
function isTypedArray(r){return isStrictTypedArray(r)||isLooseTypedArray(r)}function isStrictTypedArray(r){return r instanceof Int8Array||r instanceof Int16Array||r instanceof Int32Array||r instanceof Uint8Array||r instanceof Uint8ClampedArray||r instanceof Uint16Array||r instanceof Uint32Array||r instanceof Float32Array||r instanceof Float64Array}function isLooseTypedArray(r){return names[toString.call(r)]}module.exports=isTypedArray,isTypedArray.strict=isStrictTypedArray,isTypedArray.loose=isLooseTypedArray;var toString=Object.prototype.toString,names={"[object Int8Array]":!0,"[object Int16Array]":!0,"[object Int32Array]":!0,"[object Uint8Array]":!0,"[object Uint8ClampedArray]":!0,"[object Uint16Array]":!0,"[object Uint32Array]":!0,"[object Float32Array]":!0,"[object Float64Array]":!0};
},{}],141:[function(require,module,exports){
function FileReadStream(e,r){var i=this;return this instanceof FileReadStream?(r=r||{},Readable.call(this,r),this._offset=0,this._ready=!1,this._file=e,this._size=e.size,this._chunkSize=r.chunkSize||Math.max(this._size/1e3,204800),this.reader=new FileReader,void this._generateHeaderBlocks(e,r,function(e,r){return e?i.emit("error",e):(Array.isArray(r)&&r.forEach(function(e){i.push(e)}),i._ready=!0,void i.emit("_ready"))})):new FileReadStream(e,r)}var Readable=require("readable-stream").Readable,inherits=require("inherits"),reExtension=/^.*\.(\w+)$/,toBuffer=require("typedarray-to-buffer");inherits(FileReadStream,Readable),module.exports=FileReadStream,FileReadStream.prototype._generateHeaderBlocks=function(e,r,i){i(null,[])},FileReadStream.prototype._read=function(){if(!this._ready)return void this.once("_ready",this._read.bind(this));var e=this,r=this.reader,i=this._offset,t=this._offset+this._chunkSize;return t>this._size&&(t=this._size),i===this._size?(this.destroy(),void this.push(null)):(r.onload=function(){e._offset=t,e.push(toBuffer(r.result))},r.onerror=function(){e.emit("error",r.error)},void r.readAsArrayBuffer(this._file.slice(i,t)))},FileReadStream.prototype.destroy=function(){if(this._file=null,this.reader){this.reader.onload=null,this.reader.onerror=null;try{this.reader.abort()}catch(e){}}this.reader=null};
},{"inherits":156,"readable-stream":185,"typedarray-to-buffer":139}],142:[function(require,module,exports){
arguments[4][74][0].apply(exports,arguments)
},{"dup":74}],143:[function(require,module,exports){
"use strict";function isFileSync(s){return fs.existsSync(s)&&fs.statSync(s).isFile()}var fs=require("fs");module.exports=function(s,i){return i?void fs.stat(s,function(s,e){return s?i(s):i(null,e.isFile())}):isFileSync(s)},module.exports.sync=isFileSync;
},{"fs":31}],144:[function(require,module,exports){
"use strict";exports.re=/^npm-debug\.log$|^\..*\.swp$|^\.DS_Store$|^\.AppleDouble$|^\.LSOverride$|^Icon\r$|^\._.*|^\.Spotlight-V100$|\.Trashes|^__MACOSX$|~$|^Thumbs\.db$|^ehthumbs\.db$|^Desktop\.ini$/,exports.is=function(e){return exports.re.test(e)},exports.not=exports.isnt=function(e){return!exports.is(e)};
},{}],145:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"dup":9}],146:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10,"wrappy":145}],147:[function(require,module,exports){
for(var closest=require("closest-to"),sizes=[],i=14;i<=22;i++)sizes.push(Math.pow(2,i));module.exports=function(s){return closest(s/Math.pow(2,10),sizes)};
},{"closest-to":148}],148:[function(require,module,exports){
module.exports=function(r,n){var t=1/0,o=0,u=null;n.sort(function(r,n){return r-n});for(var e=0,a=n.length;e<a&&(o=Math.abs(r-n[e]),!(o>=t));e++)t=o,u=n[e];return u};
},{}],149:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"./debug":150,"dup":5}],150:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6,"ms":151}],151:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],152:[function(require,module,exports){
var once=require("once"),noop=function(){},isRequest=function(e){return e.setHeader&&"function"==typeof e.abort},isChildProcess=function(e){return e.stdio&&Array.isArray(e.stdio)&&3===e.stdio.length},eos=function(e,r,n){if("function"==typeof r)return eos(e,null,r);r||(r={}),n=once(n||noop);var o=e._writableState,t=e._readableState,i=r.readable||r.readable!==!1&&e.readable,s=r.writable||r.writable!==!1&&e.writable,u=function(){e.writable||c()},c=function(){s=!1,i||n()},a=function(){i=!1,s||n()},l=function(e){n(e?new Error("exited with error code: "+e):null)},d=function(){return(!i||t&&t.ended)&&(!s||o&&o.ended)?void 0:n(new Error("premature close"))},f=function(){e.req.on("finish",c)};return isRequest(e)?(e.on("complete",c),e.on("abort",d),e.req?f():e.on("request",f)):s&&!o&&(e.on("end",u),e.on("close",u)),isChildProcess(e)&&e.on("exit",l),e.on("end",a),e.on("finish",c),r.error!==!1&&e.on("error",n),e.on("close",d),function(){e.removeListener("complete",c),e.removeListener("abort",d),e.removeListener("request",f),e.req&&e.req.removeListener("finish",c),e.removeListener("end",u),e.removeListener("close",u),e.removeListener("finish",c),e.removeListener("exit",l),e.removeListener("end",a),e.removeListener("error",n),e.removeListener("close",d)}};module.exports=eos;
},{"once":154}],153:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"dup":9}],154:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10,"wrappy":153}],155:[function(require,module,exports){
(function (process){
function ImmediateStore(t){if(!(this instanceof ImmediateStore))return new ImmediateStore(t);if(this.store=t,this.chunkLength=t.chunkLength,!this.store||!this.store.get||!this.store.put)throw new Error("First argument must be abstract-chunk-store compliant");this.mem=[]}function nextTick(t,e,o){process.nextTick(function(){t&&t(e,o)})}module.exports=ImmediateStore,ImmediateStore.prototype.put=function(t,e,o){var i=this;i.mem[t]=e,i.store.put(t,e,function(e){i.mem[t]=null,o&&o(e)})},ImmediateStore.prototype.get=function(t,e,o){if("function"==typeof e)return this.get(t,null,e);var i=e&&e.offset||0,n=e&&e.length&&i+e.length,r=this.mem[t];return r?nextTick(o,null,e?r.slice(i,n):r):void this.store.get(t,e,o)},ImmediateStore.prototype.close=function(t){this.store.close(t)},ImmediateStore.prototype.destroy=function(t){this.store.destroy(t)};
}).call(this,require('_process'))
},{"_process":41}],156:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],157:[function(require,module,exports){
(function (process){
function Storage(t,n){if(!(this instanceof Storage))return new Storage(t,n);if(n||(n={}),this.chunkLength=Number(t),!this.chunkLength)throw new Error("First argument must be a chunk length");this.chunks=[],this.closed=!1,this.length=Number(n.length)||1/0,this.length!==1/0&&(this.lastChunkLength=this.length%this.chunkLength||this.chunkLength,this.lastChunkIndex=Math.ceil(this.length/this.chunkLength)-1)}function nextTick(t,n,e){process.nextTick(function(){t&&t(n,e)})}module.exports=Storage,Storage.prototype.put=function(t,n,e){if(this.closed)return nextTick(e,new Error("Storage is closed"));var h=t===this.lastChunkIndex;return h&&n.length!==this.lastChunkLength?nextTick(e,new Error("Last chunk length must be "+this.lastChunkLength)):h||n.length===this.chunkLength?(this.chunks[t]=n,void nextTick(e,null)):nextTick(e,new Error("Chunk length must be "+this.chunkLength))},Storage.prototype.get=function(t,n,e){if("function"==typeof n)return this.get(t,null,n);if(this.closed)return nextTick(e,new Error("Storage is closed"));var h=this.chunks[t];if(!h)return nextTick(e,new Error("Chunk not found"));if(!n)return nextTick(e,null,h);var r=n.offset||0,i=n.length||h.length-r;nextTick(e,null,h.slice(r,i+r))},Storage.prototype.close=Storage.prototype.destroy=function(t){return this.closed?nextTick(t,new Error("Storage is closed")):(this.closed=!0,this.chunks=null,void nextTick(t,null))};
}).call(this,require('_process'))
},{"_process":41}],158:[function(require,module,exports){
function MultiStream(t,e){var r=this;return r instanceof MultiStream?(stream.Readable.call(r,e),r.destroyed=!1,r._drained=!1,r._forwarding=!1,r._current=null,"function"==typeof t?r._queue=t:(r._queue=t.map(toStreams2),r._queue.forEach(function(t){"function"!=typeof t&&r._attachErrorListener(t)})),void r._next()):new MultiStream(t,e)}function toStreams2(t){if(!t||"function"==typeof t||t._readableState)return t;var e=(new stream.Readable).wrap(t);return t.destroy&&(e.destroy=t.destroy.bind(t)),e}module.exports=MultiStream;var inherits=require("inherits"),stream=require("readable-stream");inherits(MultiStream,stream.Readable),MultiStream.obj=function(t){return new MultiStream(t,{objectMode:!0,highWaterMark:16})},MultiStream.prototype._read=function(){this._drained=!0,this._forward()},MultiStream.prototype._forward=function(){if(!this._forwarding&&this._drained&&this._current){this._forwarding=!0;for(var t;null!==(t=this._current.read());)this._drained=this.push(t);this._forwarding=!1}},MultiStream.prototype.destroy=function(t){this.destroyed||(this.destroyed=!0,this._current&&this._current.destroy&&this._current.destroy(),"function"!=typeof this._queue&&this._queue.forEach(function(t){t.destroy&&t.destroy()}),t&&this.emit("error",t),this.emit("close"))},MultiStream.prototype._next=function(){var t=this;if(t._current=null,"function"==typeof t._queue)t._queue(function(e,r){return e?t.destroy(e):(r=toStreams2(r),t._attachErrorListener(r),void t._gotNextStream(r))});else{var e=t._queue.shift();"function"==typeof e&&(e=toStreams2(e()),t._attachErrorListener(e)),t._gotNextStream(e)}},MultiStream.prototype._gotNextStream=function(t){function e(){n._forward()}function r(){t._readableState.ended||n.destroy()}function o(){n._current=null,t.removeListener("readable",e),t.removeListener("end",o),t.removeListener("close",r),n._next()}var n=this;return t?(n._current=t,n._forward(),t.on("readable",e),t.once("end",o),void t.once("close",r)):(n.push(null),void n.destroy())},MultiStream.prototype._attachErrorListener=function(t){function e(o){t.removeListener("error",e),r.destroy(o)}var r=this;t&&t.once("error",e)};
},{"inherits":156,"readable-stream":185}],159:[function(require,module,exports){
(function (process,Buffer){
function parseTorrent(e){if("string"==typeof e&&/^(stream-)?magnet:/.test(e))return magnet(e);if("string"==typeof e&&(/^[a-f0-9]{40}$/i.test(e)||/^[a-z2-7]{32}$/i.test(e)))return magnet("magnet:?xt=urn:btih:"+e);if(Buffer.isBuffer(e)&&20===e.length)return magnet("magnet:?xt=urn:btih:"+e.toString("hex"));if(Buffer.isBuffer(e))return parseTorrentFile(e);if(e&&e.infoHash)return e.announce||(e.announce=[]),"string"==typeof e.announce&&(e.announce=[e.announce]),e.urlList||(e.urlList=[]),e;throw new Error("Invalid torrent identifier")}function parseTorrentRemote(e,r){function n(e){try{t=parseTorrent(e)}catch(e){return r(e)}t&&t.infoHash?r(null,t):r(new Error("Invalid torrent identifier"))}var t;if("function"!=typeof r)throw new Error("second argument must be a Function");try{t=parseTorrent(e)}catch(e){}t&&t.infoHash?process.nextTick(function(){r(null,t)}):isBlob(e)?blobToBuffer(e,function(e,t){return e?r(new Error("Error converting Blob: "+e.message)):void n(t)}):"function"==typeof get&&/^https?:/.test(e)?get.concat({url:e,headers:{"user-agent":"WebTorrent (http://webtorrent.io)"}},function(e,t,o){return e?r(new Error("Error downloading torrent: "+e.message)):void n(o)}):"function"==typeof fs.readFile&&"string"==typeof e?fs.readFile(e,function(e,t){return e?r(new Error("Invalid torrent identifier")):void n(t)}):process.nextTick(function(){r(new Error("Invalid torrent identifier"))})}function isBlob(e){return"undefined"!=typeof Blob&&e instanceof Blob}module.exports=parseTorrent,module.exports.remote=parseTorrentRemote;var blobToBuffer=require("blob-to-buffer"),fs=require("fs"),get=require("simple-get"),magnet=require("magnet-uri"),parseTorrentFile=require("parse-torrent-file");module.exports.toMagnetURI=magnet.encode,module.exports.toTorrentFile=parseTorrentFile.encode,function(){Buffer(0)}();
}).call(this,require('_process'),require("buffer").Buffer)
},{"_process":41,"blob-to-buffer":160,"buffer":33,"fs":31,"magnet-uri":161,"parse-torrent-file":164,"simple-get":207}],160:[function(require,module,exports){
(function (Buffer){
module.exports=function(e,r){function n(e){o.removeEventListener("loadend",n,!1),e.error?r(e.error):r(null,new Buffer(o.result))}if("undefined"==typeof Blob||!(e instanceof Blob))throw new Error("first argument must be a Blob");if("function"!=typeof r)throw new Error("second argument must be a function");var o=new FileReader;o.addEventListener("loadend",n,!1),o.readAsArrayBuffer(e)};
}).call(this,require("buffer").Buffer)
},{"buffer":33}],161:[function(require,module,exports){
(function (Buffer){
function magnetURIDecode(e){var n={},r=e.split("magnet:?")[1],t=r&&r.length>=0?r.split("&"):[];t.forEach(function(e){var r=e.split("=");if(2===r.length){var t=r[0],o=r[1];if("dn"===t&&(o=decodeURIComponent(o).replace(/\+/g," ")),"tr"!==t&&"xs"!==t&&"as"!==t&&"ws"!==t||(o=decodeURIComponent(o)),"kt"===t&&(o=decodeURIComponent(o).split("+")),n[t])if(Array.isArray(n[t]))n[t].push(o);else{var a=n[t];n[t]=[a,o]}else n[t]=o}});var o;if(n.xt){var a=Array.isArray(n.xt)?n.xt:[n.xt];a.forEach(function(e){if(o=e.match(/^urn:btih:(.{40})/))n.infoHash=o[1].toLowerCase();else if(o=e.match(/^urn:btih:(.{32})/)){var r=base32.decode(o[1]);n.infoHash=new Buffer(r,"binary").toString("hex")}})}return n.infoHash&&(n.infoHashBuffer=new Buffer(n.infoHash,"hex")),n.dn&&(n.name=n.dn),n.kt&&(n.keywords=n.kt),"string"==typeof n.tr?n.announce=[n.tr]:Array.isArray(n.tr)?n.announce=n.tr:n.announce=[],n.urlList=[],("string"==typeof n.as||Array.isArray(n.as))&&(n.urlList=n.urlList.concat(n.as)),("string"==typeof n.ws||Array.isArray(n.ws))&&(n.urlList=n.urlList.concat(n.ws)),uniq(n.announce),uniq(n.urlList),n}function magnetURIEncode(e){e=extend(e),e.infoHashBuffer&&(e.xt="urn:btih:"+e.infoHashBuffer.toString("hex")),e.infoHash&&(e.xt="urn:btih:"+e.infoHash),e.name&&(e.dn=e.name),e.keywords&&(e.kt=e.keywords),e.announce&&(e.tr=e.announce),e.urlList&&(e.ws=e.urlList,delete e.as);var n="magnet:?";return Object.keys(e).filter(function(e){return 2===e.length}).forEach(function(r,t){var o=Array.isArray(e[r])?e[r]:[e[r]];o.forEach(function(e,o){!(t>0||o>0)||"kt"===r&&0!==o||(n+="&"),"dn"===r&&(e=encodeURIComponent(e).replace(/%20/g,"+")),"tr"!==r&&"xs"!==r&&"as"!==r&&"ws"!==r||(e=encodeURIComponent(e)),"kt"===r&&(e=encodeURIComponent(e)),n+="kt"===r&&o>0?"+"+e:r+"="+e})}),n}module.exports=magnetURIDecode,module.exports.decode=magnetURIDecode,module.exports.encode=magnetURIEncode;var base32=require("thirty-two"),extend=require("xtend"),uniq=require("uniq");
}).call(this,require("buffer").Buffer)
},{"buffer":33,"thirty-two":162,"uniq":222,"xtend":228}],162:[function(require,module,exports){
var base32=require("./thirty-two");exports.encode=base32.encode,exports.decode=base32.decode;
},{"./thirty-two":163}],163:[function(require,module,exports){
(function (Buffer){
"use strict";function quintetCount(e){var r=Math.floor(e.length/5);return e.length%5===0?r:r+1}var charTable="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",byteTable=[255,255,26,27,28,29,30,31,255,255,255,255,255,255,255,255,255,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,255,255,255,255,255,255,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,255,255,255,255,255];exports.encode=function(e){Buffer.isBuffer(e)||(e=new Buffer(e));for(var r=0,t=0,n=0,f=0,u=new Buffer(8*quintetCount(e));r<e.length;){var a=e[r];n>3?(f=a&255>>n,n=(n+5)%8,f=f<<n|(r+1<e.length?e[r+1]:0)>>8-n,r++):(f=a>>8-(n+5)&31,n=(n+5)%8,0===n&&r++),u[t]=charTable.charCodeAt(f),t++}for(r=t;r<u.length;r++)u[r]=61;return u},exports.decode=function(e){var r,t=0,n=0,f=0;Buffer.isBuffer(e)||(e=new Buffer(e));for(var u=new Buffer(Math.ceil(5*e.length/8)),a=0;a<e.length&&61!==e[a];a++){var o=e[a]-48;if(!(o<byteTable.length))throw new Error("Invalid input - it is not base32 encoded string");n=byteTable[o],t<=3?(t=(t+5)%8,0===t?(r|=n,u[f]=r,f++,r=0):r|=255&n<<8-t):(t=(t+5)%8,r|=255&n>>>t,u[f]=r,f++,r=255&n<<8-t)}return u.slice(0,f)};
}).call(this,require("buffer").Buffer)
},{"buffer":33}],164:[function(require,module,exports){
(function (Buffer){
function decodeTorrentFile(e){Buffer.isBuffer(e)&&(e=bencode.decode(e)),ensure(e.info,"info"),ensure(e.info["name.utf-8"]||e.info.name,"info.name"),ensure(e.info["piece length"],"info['piece length']"),ensure(e.info.pieces,"info.pieces"),e.info.files?e.info.files.forEach(function(e){ensure("number"==typeof e.length,"info.files[0].length"),ensure(e["path.utf-8"]||e.path,"info.files[0].path")}):ensure("number"==typeof e.info.length,"info.length");var n={};n.info=e.info,n.infoBuffer=bencode.encode(e.info),n.infoHash=sha1.sync(n.infoBuffer),n.infoHashBuffer=new Buffer(n.infoHash,"hex"),n.name=(e.info["name.utf-8"]||e.info.name).toString(),void 0!==e.info.private&&(n.private=!!e.info.private),e["creation date"]&&(n.created=new Date(1e3*e["creation date"])),e["created by"]&&(n.createdBy=e["created by"].toString()),Buffer.isBuffer(e.comment)&&(n.comment=e.comment.toString()),n.announce=[],e["announce-list"]&&e["announce-list"].length?e["announce-list"].forEach(function(e){e.forEach(function(e){n.announce.push(e.toString())})}):e.announce&&n.announce.push(e.announce.toString()),Buffer.isBuffer(e["url-list"])&&(e["url-list"]=e["url-list"].length>0?[e["url-list"]]:[]),n.urlList=(e["url-list"]||[]).map(function(e){return e.toString()}),uniq(n.announce),uniq(n.urlList);var t=e.info.files||[e.info];n.files=t.map(function(e,i){var o=[].concat(n.name,e["path.utf-8"]||e.path||[]).map(function(e){return e.toString()});return{path:path.join.apply(null,[path.sep].concat(o)).slice(1),name:o[o.length-1],length:e.length,offset:t.slice(0,i).reduce(sumLength,0)}}),n.length=t.reduce(sumLength,0);var i=n.files[n.files.length-1];return n.pieceLength=e.info["piece length"],n.lastPieceLength=(i.offset+i.length)%n.pieceLength||n.pieceLength,n.pieces=splitPieces(e.info.pieces),n}function encodeTorrentFile(e){var n={info:e.info};return n["announce-list"]=(e.announce||[]).map(function(e){return n.announce||(n.announce=e),e=new Buffer(e,"utf8"),[e]}),n["url-list"]=e.urlList||[],e.created&&(n["creation date"]=e.created.getTime()/1e3|0),e.createdBy&&(n["created by"]=e.createdBy),e.comment&&(n.comment=e.comment),bencode.encode(n)}function sumLength(e,n){return e+n.length}function splitPieces(e){for(var n=[],t=0;t<e.length;t+=20)n.push(e.slice(t,t+20).toString("hex"));return n}function ensure(e,n){if(!e)throw new Error("Torrent is missing required field: "+n)}module.exports=decodeTorrentFile,module.exports.decode=decodeTorrentFile,module.exports.encode=encodeTorrentFile;var bencode=require("bencode"),path=require("path"),sha1=require("simple-sha1"),uniq=require("uniq");
}).call(this,require("buffer").Buffer)
},{"bencode":167,"buffer":33,"path":40,"simple-sha1":210,"uniq":222}],165:[function(require,module,exports){
arguments[4][127][0].apply(exports,arguments)
},{"buffer":33,"dup":127}],166:[function(require,module,exports){
arguments[4][128][0].apply(exports,arguments)
},{"buffer":33,"dup":128}],167:[function(require,module,exports){
arguments[4][129][0].apply(exports,arguments)
},{"./decode":165,"./encode":166,"dup":129}],168:[function(require,module,exports){
var once=require("once"),eos=require("end-of-stream"),fs=require("fs"),noop=function(){},isFn=function(e){return"function"==typeof e},isFS=function(e){return(e instanceof(fs.ReadStream||noop)||e instanceof(fs.WriteStream||noop))&&isFn(e.close)},isRequest=function(e){return e.setHeader&&isFn(e.abort)},destroyer=function(e,r,n,o){o=once(o);var t=!1;e.on("close",function(){t=!0}),eos(e,{readable:r,writable:n},function(e){return e?o(e):(t=!0,void o())});var i=!1;return function(r){if(!t&&!i)return i=!0,isFS(e)?e.close():isRequest(e)?e.abort():isFn(e.destroy)?e.destroy():void o(r||new Error("stream was destroyed"))}},call=function(e){e()},pipe=function(e,r){return e.pipe(r)},pump=function(){var e=Array.prototype.slice.call(arguments),r=isFn(e[e.length-1]||noop)&&e.pop()||noop;if(Array.isArray(e[0])&&(e=e[0]),e.length<2)throw new Error("pump requires two streams per minimum");var n,o=e.map(function(t,i){var s=i<e.length-1,u=i>0;return destroyer(t,s,u,function(e){n||(n=e),e&&o.forEach(call),s||(o.forEach(call),r(n))})});return e.reduce(pipe)};module.exports=pump;
},{"end-of-stream":152,"fs":31,"once":170}],169:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"dup":9}],170:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10,"wrappy":169}],171:[function(require,module,exports){
var iterate=function(r){var t=0;return function(){if(t===r.length)return null;var e=r.length-t,n=Math.random()*e|0,a=r[t+n],u=r[t];return r[t]=a,r[t+n]=u,t++,a}};module.exports=iterate;
},{}],172:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"_process":41,"buffer":33,"dup":11}],173:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"./_stream_readable":175,"./_stream_writable":177,"core-util-is":180,"dup":15,"inherits":156,"process-nextick-args":182}],174:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"./_stream_transform":176,"core-util-is":180,"dup":16,"inherits":156}],175:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"./_stream_duplex":173,"./internal/streams/BufferList":178,"_process":41,"buffer":33,"buffer-shims":179,"core-util-is":180,"dup":17,"events":37,"inherits":156,"isarray":181,"process-nextick-args":182,"stream":62,"string_decoder/":183,"util":32}],176:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"./_stream_duplex":173,"core-util-is":180,"dup":18,"inherits":156}],177:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"./_stream_duplex":173,"_process":41,"buffer":33,"buffer-shims":179,"core-util-is":180,"dup":19,"events":37,"inherits":156,"process-nextick-args":182,"stream":62,"util-deprecate":184}],178:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"buffer":33,"buffer-shims":179,"dup":20}],179:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"buffer":33,"dup":21}],180:[function(require,module,exports){
arguments[4][111][0].apply(exports,arguments)
},{"../../../../../../browserify/node_modules/insert-module-globals/node_modules/is-buffer/index.js":39,"dup":111}],181:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],182:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"_process":41,"dup":24}],183:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"buffer":33,"dup":25}],184:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26}],185:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"./lib/_stream_duplex.js":173,"./lib/_stream_passthrough.js":174,"./lib/_stream_readable.js":175,"./lib/_stream_transform.js":176,"./lib/_stream_writable.js":177,"_process":41,"dup":27,"stream":62}],186:[function(require,module,exports){
function render(e,n,r,t){"function"==typeof r&&(t=r,r={}),r||(r={}),t||(t=function(){}),validateFile(e),parseOpts(r),"string"==typeof n&&(n=document.querySelector(n)),renderMedia(e,function(r){if(n.nodeName!==r.toUpperCase()){var t=path.extname(e.name).toLowerCase();throw new Error('Cannot render "'+t+'" inside a "'+n.nodeName.toLowerCase()+'" element, expected "'+r+'"')}return n},r,t)}function append(e,n,r,t){function o(e){return"video"===e||"audio"===e?a(e):i(e)}function a(e){var t=i(e);return r.controls&&(t.controls=!0),r.autoplay&&(t.autoplay=!0),n.appendChild(t),t}function i(e){var r=document.createElement(e);return n.appendChild(r),r}function d(e,n){e&&n&&n.remove(),t(e,n)}if("function"==typeof r&&(t=r,r={}),r||(r={}),t||(t=function(){}),validateFile(e),parseOpts(r),"string"==typeof n&&(n=document.querySelector(n)),n&&("VIDEO"===n.nodeName||"AUDIO"===n.nodeName))throw new Error("Invalid video/audio node argument. Argument must be root element that video/audio tag will be appended to.");renderMedia(e,o,r,d)}function renderMedia(e,n,r,t){function o(){function t(){debug("Use `videostream` package for "+e.name),u(),c.addEventListener("error",s),c.addEventListener("loadstart",i),c.addEventListener("canplay",d),videostream(e,c)}function o(){debug("Use MediaSource API for "+e.name),u(),c.addEventListener("error",l),c.addEventListener("loadstart",i),c.addEventListener("canplay",d);var n=new MediaElementWrapper(c),r=n.createWriteStream(getCodec(e.name));e.createReadStream().pipe(r),f&&(c.currentTime=f)}function a(){debug("Use Blob URL for "+e.name),u(),c.addEventListener("error",m),c.addEventListener("loadstart",i),c.addEventListener("canplay",d),getBlobURL(e,function(e,n){return e?m(e):(c.src=n,void(f&&(c.currentTime=f)))})}function s(e){debug("videostream error: fallback to MediaSource API: %o",e.message||e),c.removeEventListener("error",s),c.removeEventListener("canplay",d),o()}function l(n){return debug("MediaSource API error: fallback to Blob URL: %o",n.message||n),"number"==typeof e.length&&e.length>r.maxBlobLength?(debug("File length too large for Blob URL approach: %d (max: %d)",e.length,r.maxBlobLength),m(new Error("File length too large for Blob URL approach: "+e.length+" (max: "+r.maxBlobLength+")"))):(c.removeEventListener("error",l),c.removeEventListener("canplay",d),void a())}function u(){c||(c=n(E),c.addEventListener("progress",function(){f=c.currentTime}))}var E=MEDIASOURCE_VIDEO_EXTS.indexOf(p)>=0?"video":"audio";MediaSource?VIDEOSTREAM_EXTS.indexOf(p)>=0?t():o():a()}function a(){c=n("audio"),getBlobURL(e,function(e,n){return e?m(e):(c.addEventListener("error",m),c.addEventListener("loadstart",i),c.addEventListener("canplay",d),void(c.src=n))})}function i(){c.removeEventListener("loadstart",i),r.autoplay&&c.play()}function d(){c.removeEventListener("canplay",d),t(null,c)}function s(){c=n("img"),getBlobURL(e,function(n,r){return n?m(n):(c.src=r,c.alt=e.name,void t(null,c))})}function l(){c=n("iframe"),getBlobURL(e,function(e,n){return e?m(e):(c.src=n,".pdf"!==p&&(c.sandbox="allow-forms allow-scripts"),void t(null,c))})}function u(){function n(){isAscii(r)?(debug('File extension "%s" appears ascii, so will render.',p),l()):(debug('File extension "%s" appears non-ascii, will not render.',p),t(new Error('Unsupported file type "'+p+'": Cannot append to DOM')))}debug('Unknown file extension "%s" - will attempt to render into iframe',p);var r="";e.createReadStream({start:0,end:1e3}).setEncoding("utf8").on("data",function(e){r+=e}).on("end",n).on("error",t)}function m(n){n.message='Error rendering file "'+e.name+'": '+n.message,debug(n.message),t(n)}var c,p=path.extname(e.name).toLowerCase(),f=0;MEDIASOURCE_EXTS.indexOf(p)>=0?o():AUDIO_EXTS.indexOf(p)>=0?a():IMAGE_EXTS.indexOf(p)>=0?s():IFRAME_EXTS.indexOf(p)>=0?l():u()}function getBlobURL(e,n){var r=path.extname(e.name).toLowerCase();streamToBlobURL(e.createReadStream(),exports.mime[r],n)}function validateFile(e){if(null==e)throw new Error("file cannot be null or undefined");if("string"!=typeof e.name)throw new Error("missing or invalid file.name property");if("function"!=typeof e.createReadStream)throw new Error("missing or invalid file.createReadStream property")}function getCodec(e){var n=path.extname(e).toLowerCase();return{".m4a":'audio/mp4; codecs="mp4a.40.5"',".m4v":'video/mp4; codecs="avc1.640029, mp4a.40.5"',".mkv":'video/webm; codecs="avc1.640029, mp4a.40.5"',".mp3":"audio/mpeg",".mp4":'video/mp4; codecs="avc1.640029, mp4a.40.5"',".webm":'video/webm; codecs="vorbis, vp8"'}[n]}function parseOpts(e){null==e.autoplay&&(e.autoplay=!0),null==e.controls&&(e.controls=!0),null==e.maxBlobLength&&(e.maxBlobLength=MAX_BLOB_LENGTH)}exports.render=render,exports.append=append,exports.mime=require("./lib/mime.json");var debug=require("debug")("render-media"),isAscii=require("is-ascii"),MediaElementWrapper=require("mediasource"),path=require("path"),streamToBlobURL=require("stream-to-blob-url"),videostream=require("videostream"),VIDEOSTREAM_EXTS=[".m4a",".m4v",".mp4"],MEDIASOURCE_VIDEO_EXTS=[".m4v",".mkv",".mp4",".webm"],MEDIASOURCE_AUDIO_EXTS=[".m4a",".mp3"],MEDIASOURCE_EXTS=[].concat(MEDIASOURCE_VIDEO_EXTS,MEDIASOURCE_AUDIO_EXTS),AUDIO_EXTS=[".aac",".oga",".ogg",".wav"],IMAGE_EXTS=[".bmp",".gif",".jpeg",".jpg",".png"],IFRAME_EXTS=[".css",".html",".js",".md",".pdf",".txt"],MAX_BLOB_LENGTH=2e8,MediaSource="undefined"!=typeof window&&window.MediaSource;
},{"./lib/mime.json":187,"debug":149,"is-ascii":188,"mediasource":189,"path":40,"stream-to-blob-url":213,"videostream":202}],187:[function(require,module,exports){
module.exports={
  ".3gp": "video/3gpp",
  ".aac": "audio/aac",
  ".aif": "audio/x-aiff",
  ".aiff": "audio/x-aiff",
  ".atom": "application/atom+xml",
  ".avi": "video/x-msvideo",
  ".bmp": "image/bmp",
  ".bz2": "application/x-bzip2",
  ".conf": "text/plain",
  ".css": "text/css",
  ".csv": "text/csv",
  ".diff": "text/x-diff",
  ".doc": "application/msword",
  ".flv": "video/x-flv",
  ".gif": "image/gif",
  ".gz": "application/x-gzip",
  ".htm": "text/html",
  ".html": "text/html",
  ".ico": "image/vnd.microsoft.icon",
  ".ics": "text/calendar",
  ".iso": "application/octet-stream",
  ".jar": "application/java-archive",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript",
  ".json": "application/json",
  ".less": "text/css",
  ".log": "text/plain",
  ".m3u": "audio/x-mpegurl",
  ".m4a": "audio/mp4",
  ".m4v": "video/mp4",
  ".manifest": "text/cache-manifest",
  ".markdown": "text/x-markdown",
  ".mathml": "application/mathml+xml",
  ".md": "text/x-markdown",
  ".mid": "audio/midi",
  ".midi": "audio/midi",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".mp4v": "video/mp4",
  ".mpeg": "video/mpeg",
  ".mpg": "video/mpeg",
  ".odp": "application/vnd.oasis.opendocument.presentation",
  ".ods": "application/vnd.oasis.opendocument.spreadsheet",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".oga": "audio/ogg",
  ".ogg": "application/ogg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".pps": "application/vnd.ms-powerpoint",
  ".ppt": "application/vnd.ms-powerpoint",
  ".ps": "application/postscript",
  ".psd": "image/vnd.adobe.photoshop",
  ".qt": "video/quicktime",
  ".rar": "application/x-rar-compressed",
  ".rdf": "application/rdf+xml",
  ".rss": "application/rss+xml",
  ".rtf": "application/rtf",
  ".svg": "image/svg+xml",
  ".svgz": "image/svg+xml",
  ".swf": "application/x-shockwave-flash",
  ".tar": "application/x-tar",
  ".tbz": "application/x-bzip-compressed-tar",
  ".text": "text/plain",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".torrent": "application/x-bittorrent",
  ".ttf": "application/x-font-ttf",
  ".txt": "text/plain",
  ".wav": "audio/wav",
  ".webm": "video/webm",
  ".wma": "audio/x-ms-wma",
  ".wmv": "video/x-ms-wmv",
  ".xls": "application/vnd.ms-excel",
  ".xml": "application/xml",
  ".yaml": "text/yaml",
  ".yml": "text/yaml",
  ".zip": "application/zip"
}

},{}],188:[function(require,module,exports){
var MAX_ASCII_CHAR_CODE=127;module.exports=function(r){for(var A=0,C=r.length;A<C;++A)if(r.charCodeAt(A)>MAX_ASCII_CHAR_CODE)return!1;return!0};
},{}],189:[function(require,module,exports){
function MediaElementWrapper(e,r){var t=this;if(!(t instanceof MediaElementWrapper))return new MediaElementWrapper(e,r);if(!MediaSource)throw new Error("web browser lacks MediaSource support");r||(r={}),t._bufferDuration=r.bufferDuration||DEFAULT_BUFFER_DURATION,t._elem=e,t._mediaSource=new MediaSource,t._streams=[],t.detailedError=null,t._errorHandler=function(){t._elem.removeEventListener("error",t._errorHandler);var e=t._streams.slice();e.forEach(function(e){e.destroy(t._elem.error)})},t._elem.addEventListener("error",t._errorHandler),t._elem.src=window.URL.createObjectURL(t._mediaSource)}function MediaSourceStream(e,r){var t=this;if(stream.Writable.call(t),t._wrapper=e,t._elem=e._elem,t._mediaSource=e._mediaSource,t._allStreams=e._streams,t._allStreams.push(t),t._bufferDuration=e._bufferDuration,t._sourceBuffer=null,t._openHandler=function(){t._onSourceOpen()},t._flowHandler=function(){t._flow()},"string"==typeof r)t._type=r,"open"===t._mediaSource.readyState?t._createSourceBuffer():t._mediaSource.addEventListener("sourceopen",t._openHandler);else if(null===r._sourceBuffer)r.destroy(),t._type=r._type,t._mediaSource.addEventListener("sourceopen",t._openHandler);else{if(!r._sourceBuffer)throw new Error("The argument to MediaElementWrapper.createWriteStream must be a string or a previous stream returned from that function");r.destroy(),t._type=r._type,t._sourceBuffer=r._sourceBuffer,t._sourceBuffer.addEventListener("updateend",t._flowHandler)}t._elem.addEventListener("timeupdate",t._flowHandler),t.on("error",function(e){t._wrapper.error(e)}),t.on("finish",function(){if(!t.destroyed&&(t._finished=!0,t._allStreams.every(function(e){return e._finished})))try{t._mediaSource.endOfStream()}catch(e){}})}module.exports=MediaElementWrapper;var inherits=require("inherits"),stream=require("readable-stream"),toArrayBuffer=require("to-arraybuffer"),MediaSource="undefined"!=typeof window&&window.MediaSource,DEFAULT_BUFFER_DURATION=60;MediaElementWrapper.prototype.createWriteStream=function(e){var r=this;return new MediaSourceStream(r,e)},MediaElementWrapper.prototype.error=function(e){var r=this;r.detailedError||(r.detailedError=e);try{r._mediaSource.endOfStream("decode")}catch(e){}},inherits(MediaSourceStream,stream.Writable),MediaSourceStream.prototype._onSourceOpen=function(){var e=this;e.destroyed||(e._mediaSource.removeEventListener("sourceopen",e._openHandler),e._createSourceBuffer())},MediaSourceStream.prototype.destroy=function(e){var r=this;r.destroyed||(r.destroyed=!0,r._allStreams.splice(r._allStreams.indexOf(r),1),r._mediaSource.removeEventListener("sourceopen",r._openHandler),r._elem.removeEventListener("timeupdate",r._flowHandler),r._sourceBuffer&&(r._sourceBuffer.removeEventListener("updateend",r._flowHandler),"open"===r._mediaSource.readyState&&r._sourceBuffer.abort()),e&&r.emit("error",e),r.emit("close"))},MediaSourceStream.prototype._createSourceBuffer=function(){var e=this;if(!e.destroyed)if(MediaSource.isTypeSupported(e._type)){if(e._sourceBuffer=e._mediaSource.addSourceBuffer(e._type),e._sourceBuffer.addEventListener("updateend",e._flowHandler),e._cb){var r=e._cb;e._cb=null,r()}}else e.destroy(new Error("The provided type is not supported"))},MediaSourceStream.prototype._write=function(e,r,t){var o=this;if(!o.destroyed){if(!o._sourceBuffer)return void(o._cb=function(a){return a?t(a):void o._write(e,r,t)});if(o._sourceBuffer.updating)return t(new Error("Cannot append buffer while source buffer updating"));try{o._sourceBuffer.appendBuffer(toArrayBuffer(e))}catch(e){return void o.destroy(e)}o._cb=t}},MediaSourceStream.prototype._flow=function(){var e=this;if(!e.destroyed&&e._sourceBuffer&&!e._sourceBuffer.updating&&!("open"===e._mediaSource.readyState&&e._getBufferDuration()>e._bufferDuration)&&e._cb){var r=e._cb;e._cb=null,r()}};var EPSILON=0;MediaSourceStream.prototype._getBufferDuration=function(){for(var e=this,r=e._sourceBuffer.buffered,t=e._elem.currentTime,o=-1,a=0;a<r.length;a++){var n=r.start(a),u=r.end(a)+EPSILON;if(n>t)break;(o>=0||t<=u)&&(o=u)}var i=o-t;return i<0&&(i=0),i};
},{"inherits":156,"readable-stream":185,"to-arraybuffer":190}],190:[function(require,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"buffer":33,"dup":68}],191:[function(require,module,exports){
(function (Buffer){
function MP4Remuxer(e){var t=this;EventEmitter.call(t),t._tracks=[],t._fragmentSequence=1,t._file=e,t._decoder=null,t._findMoov(0)}function RunLengthIndex(e,t){var r=this;r._entries=e,r._countName=t||"count",r._index=0,r._offset=0,r.value=r._entries[0]}function empty(){return{version:0,flags:0,entries:[]}}var bs=require("binary-search"),EventEmitter=require("events").EventEmitter,inherits=require("inherits"),mp4=require("mp4-stream"),Box=require("mp4-box-encoding"),RangeSliceStream=require("range-slice-stream");module.exports=MP4Remuxer,inherits(MP4Remuxer,EventEmitter),MP4Remuxer.prototype._findMoov=function(e){var t=this;t._decoder&&t._decoder.destroy(),t._decoder=mp4.decode();var r=t._file.createReadStream({start:e});r.pipe(t._decoder),t._decoder.once("box",function(n){"moov"===n.type?t._decoder.decode(function(e){r.destroy();try{t._processMoov(e)}catch(e){e.message="Cannot parse mp4 file: "+e.message,t.emit("error",e)}}):(r.destroy(),t._findMoov(e+n.length))})},RunLengthIndex.prototype.inc=function(){var e=this;e._offset++,e._offset>=e._entries[e._index][e._countName]&&(e._index++,e._offset=0),e.value=e._entries[e._index]},MP4Remuxer.prototype._processMoov=function(e){var t=this,r=e.traks;t._tracks=[],t._hasVideo=!1,t._hasAudio=!1;for(var n=0;n<r.length;n++){var a,s,i=r[n],o=i.mdia.minf.stbl,d=o.stsd.entries[0],m=i.mdia.hdlr.handlerType;if("vide"===m&&"avc1"===d.type){if(t._hasVideo)continue;t._hasVideo=!0,a="avc1",d.avcC&&(a+="."+d.avcC.mimeCodec),s='video/mp4; codecs="'+a+'"'}else{if("soun"!==m||"mp4a"!==d.type)continue;if(t._hasAudio)continue;t._hasAudio=!0,a="mp4a",d.esds&&d.esds.mimeCodec&&(a+="."+d.esds.mimeCodec),s='audio/mp4; codecs="'+a+'"'}var f=[],c=0,u=0,l=0,p=0,v=0,h=0,_=new RunLengthIndex(o.stts.entries),y=null;o.ctts&&(y=new RunLengthIndex(o.ctts.entries));for(var g=0;;){var S=o.stsc.entries[v],k=o.stsz.entries[c],x=_.value.duration,M=y?y.value.compositionOffset:0,R=!0;if(o.stss&&(R=o.stss.entries[g]===c+1),f.push({size:k,duration:x,dts:h,presentationOffset:M,sync:R,offset:p+o.stco.entries[l]}),c++,c>=o.stsz.entries.length)break;if(u++,p+=k,u>=S.samplesPerChunk){u=0,p=0,l++;var b=o.stsc.entries[v+1];b&&l+1>=b.firstChunk&&v++}h+=x,_.inc(),y&&y.inc(),R&&g++}i.mdia.mdhd.duration=0,i.tkhd.duration=0;var I=S.sampleDescriptionId,E={type:"moov",mvhd:e.mvhd,traks:[{tkhd:i.tkhd,mdia:{mdhd:i.mdia.mdhd,hdlr:i.mdia.hdlr,elng:i.mdia.elng,minf:{vmhd:i.mdia.minf.vmhd,smhd:i.mdia.minf.smhd,dinf:i.mdia.minf.dinf,stbl:{stsd:o.stsd,stts:empty(),ctts:empty(),stsc:empty(),stsz:empty(),stco:empty(),stss:empty()}}}}],mvex:{mehd:{fragmentDuration:e.mvhd.duration},trexs:[{trackId:i.tkhd.trackId,defaultSampleDescriptionIndex:I,defaultSampleDuration:0,defaultSampleSize:0,defaultSampleFlags:0}]}};t._tracks.push({trackId:i.tkhd.trackId,timeScale:i.mdia.mdhd.timeScale,samples:f,currSample:null,currTime:null,moov:E,mime:s})}if(0===t._tracks.length)return void t.emit("error",new Error("no playable tracks"));e.mvhd.duration=0,t._ftyp={type:"ftyp",brand:"iso5",brandVersion:0,compatibleBrands:["iso5"]};var z=Box.encode(t._ftyp),N=t._tracks.map(function(e){var t=Box.encode(e.moov);return{mime:e.mime,init:Buffer.concat([z,t])}});t.emit("ready",N)},MP4Remuxer.prototype.seek=function(e){var t=this;if(!t._tracks)throw new Error("Not ready yet; wait for 'ready' event");t._fileStream&&(t._fileStream.destroy(),t._fileStream=null);var r=-1;if(t._tracks.map(function(n,a){function s(e){i.destroyed||i.box(e.moof,function(r){if(r)return t.emit("error",r);if(!i.destroyed){var o=n.inStream.slice(e.ranges);o.pipe(i.mediaData(e.length,function(e){if(e)return t.emit("error",e);if(!i.destroyed){var r=t._generateFragment(a);return r?void s(r):i.finalize()}}))}})}n.outStream&&n.outStream.destroy(),n.inStream&&(n.inStream.destroy(),n.inStream=null);var i=n.outStream=mp4.encode(),o=t._generateFragment(a,e);return o?((r===-1||o.ranges[0].start<r)&&(r=o.ranges[0].start),void s(o)):i.finalize()}),r>=0){var n=t._fileStream=t._file.createReadStream({start:r});t._tracks.forEach(function(e){e.inStream=new RangeSliceStream(r),n.pipe(e.inStream)})}return t._tracks.map(function(e){return e.outStream})},MP4Remuxer.prototype._findSampleBefore=function(e,t){var r=this,n=r._tracks[e],a=Math.floor(n.timeScale*t),s=bs(n.samples,a,function(e,t){var r=e.dts+e.presentationOffset;return r-t});for(s===-1?s=0:s<0&&(s=-s-2);!n.samples[s].sync;)s--;return s};var MIN_FRAGMENT_DURATION=1;MP4Remuxer.prototype._generateFragment=function(e,t){var r,n=this,a=n._tracks[e];if(r=void 0!==t?n._findSampleBefore(e,t):a.currSample,r>=a.samples.length)return null;for(var s=a.samples[r].dts,i=0,o=[],d=r;d<a.samples.length;d++){var m=a.samples[d];if(m.sync&&m.dts-s>=a.timeScale*MIN_FRAGMENT_DURATION)break;i+=m.size;var f=o.length-1;f<0||o[f].end!==m.offset?o.push({start:m.offset,end:m.offset+m.size}):o[f].end+=m.size}return a.currSample=d,{moof:n._generateMoof(e,r,d),ranges:o,length:i}},MP4Remuxer.prototype._generateMoof=function(e,t,r){for(var n=this,a=n._tracks[e],s=[],i=t;i<r;i++){var o=a.samples[i];s.push({sampleDuration:o.duration,sampleSize:o.size,sampleFlags:o.sync?33554432:16842752,sampleCompositionTimeOffset:o.presentationOffset})}var d={type:"moof",mfhd:{sequenceNumber:n._fragmentSequence++},trafs:[{tfhd:{flags:131072,trackId:a.trackId},tfdt:{baseMediaDecodeTime:a.samples[t].dts},trun:{flags:3841,dataOffset:8,entries:s}}]};return d.trafs[0].trun.dataOffset+=Box.encodingLength(d),d};
}).call(this,require("buffer").Buffer)
},{"binary-search":192,"buffer":33,"events":37,"inherits":156,"mp4-box-encoding":195,"mp4-stream":199,"range-slice-stream":201}],192:[function(require,module,exports){
module.exports=function(e,r,n,i,o){var l,t;if(void 0===i)i=0;else if(i=0|i,i<0||i>=e.length)throw new RangeError("invalid lower bound");if(void 0===o)o=e.length-1;else if(o=0|o,o<i||o>=e.length)throw new RangeError("invalid upper bound");for(;i<=o;)if(l=i+(o-i>>1),t=+n(e[l],r,l,e),t<0)i=l+1;else{if(!(t>0))return l;o=l-1}return~i};
},{}],193:[function(require,module,exports){
(function (Buffer){
function writeReserved(e,t,r){for(var n=t;n<r;n++)e[n]=0}function writeDate(e,t,r){t.writeUInt32BE(Math.floor((e.getTime()+TIME_OFFSET)/1e3),r)}function writeFixed32(e,t,r){t.writeUInt16BE(Math.floor(e)%65536,r),t.writeUInt16BE(Math.floor(256*e*256)%65536,r+2)}function writeFixed16(e,t,r){t[r]=Math.floor(e)%256,t[r+1]=Math.floor(256*e)%256}function writeMatrix(e,t,r){e||(e=[0,0,0,0,0,0,0,0,0]);for(var n=0;n<e.length;n++)writeFixed32(e[n],t,r+4*n)}function writeString(e,t,r){var n=new Buffer(e,"utf8");n.copy(t,r),t[r+n.length]=0}function readMatrix(e){for(var t=new Array(e.length/4),r=0;r<t.length;r++)t[r]=readFixed32(e,4*r);return t}function readDate(e,t){return new Date(1e3*e.readUInt32BE(t)-TIME_OFFSET)}function readFixed32(e,t){return e.readUInt16BE(t)+e.readUInt16BE(t+2)/65536}function readFixed16(e,t){return e[t]+e[t+1]/256}function readString(e,t,r){var n;for(n=0;n<r&&0!==e[t+n];n++);return e.toString("utf8",t,t+n)}var Box=require("./index"),Descriptor=require("./descriptor"),TIME_OFFSET=20828448e5;exports.fullBoxes={};var fullBoxes=["mvhd","tkhd","mdhd","vmhd","smhd","stsd","esds","stsz","stco","stss","stts","ctts","stsc","dref","elst","hdlr","mehd","trex","mfhd","tfhd","tfdt","trun"];fullBoxes.forEach(function(e){exports.fullBoxes[e]=!0}),exports.ftyp={},exports.ftyp.encode=function(e,t,r){t=t?t.slice(r):new Buffer(exports.ftyp.encodingLength(e));var n=e.compatibleBrands||[];t.write(e.brand,0,4,"ascii"),t.writeUInt32BE(e.brandVersion,4);for(var o=0;o<n.length;o++)t.write(n[o],8+4*o,4,"ascii");return exports.ftyp.encode.bytes=8+4*n.length,t},exports.ftyp.decode=function(e,t){e=e.slice(t);for(var r=e.toString("ascii",0,4),n=e.readUInt32BE(4),o=[],i=8;i<e.length;i+=4)o.push(e.toString("ascii",i,i+4));return{brand:r,brandVersion:n,compatibleBrands:o}},exports.ftyp.encodingLength=function(e){return 8+4*(e.compatibleBrands||[]).length},exports.mvhd={},exports.mvhd.encode=function(e,t,r){return t=t?t.slice(r):new Buffer(96),writeDate(e.ctime||new Date,t,0),writeDate(e.mtime||new Date,t,4),t.writeUInt32BE(e.timeScale||0,8),t.writeUInt32BE(e.duration||0,12),writeFixed32(e.preferredRate||0,t,16),writeFixed16(e.preferredVolume||0,t,20),writeReserved(t,22,32),writeMatrix(e.matrix,t,32),t.writeUInt32BE(e.previewTime||0,68),t.writeUInt32BE(e.previewDuration||0,72),t.writeUInt32BE(e.posterTime||0,76),t.writeUInt32BE(e.selectionTime||0,80),t.writeUInt32BE(e.selectionDuration||0,84),t.writeUInt32BE(e.currentTime||0,88),t.writeUInt32BE(e.nextTrackId||0,92),exports.mvhd.encode.bytes=96,t},exports.mvhd.decode=function(e,t){return e=e.slice(t),{ctime:readDate(e,0),mtime:readDate(e,4),timeScale:e.readUInt32BE(8),duration:e.readUInt32BE(12),preferredRate:readFixed32(e,16),preferredVolume:readFixed16(e,20),matrix:readMatrix(e.slice(32,68)),previewTime:e.readUInt32BE(68),previewDuration:e.readUInt32BE(72),posterTime:e.readUInt32BE(76),selectionTime:e.readUInt32BE(80),selectionDuration:e.readUInt32BE(84),currentTime:e.readUInt32BE(88),nextTrackId:e.readUInt32BE(92)}},exports.mvhd.encodingLength=function(e){return 96},exports.tkhd={},exports.tkhd.encode=function(e,t,r){return t=t?t.slice(r):new Buffer(80),writeDate(e.ctime||new Date,t,0),writeDate(e.mtime||new Date,t,4),t.writeUInt32BE(e.trackId||0,8),writeReserved(t,12,16),t.writeUInt32BE(e.duration||0,16),writeReserved(t,20,28),t.writeUInt16BE(e.layer||0,28),t.writeUInt16BE(e.alternateGroup||0,30),t.writeUInt16BE(e.volume||0,32),writeMatrix(e.matrix,t,36),t.writeUInt32BE(e.trackWidth||0,72),t.writeUInt32BE(e.trackHeight||0,76),exports.tkhd.encode.bytes=80,t},exports.tkhd.decode=function(e,t){return e=e.slice(t),{ctime:readDate(e,0),mtime:readDate(e,4),trackId:e.readUInt32BE(8),duration:e.readUInt32BE(16),layer:e.readUInt16BE(28),alternateGroup:e.readUInt16BE(30),volume:e.readUInt16BE(32),matrix:readMatrix(e.slice(36,72)),trackWidth:e.readUInt32BE(72),trackHeight:e.readUInt32BE(76)}},exports.tkhd.encodingLength=function(e){return 80},exports.mdhd={},exports.mdhd.encode=function(e,t,r){return t=t?t.slice(r):new Buffer(20),writeDate(e.ctime||new Date,t,0),writeDate(e.mtime||new Date,t,4),t.writeUInt32BE(e.timeScale||0,8),t.writeUInt32BE(e.duration||0,12),t.writeUInt16BE(e.language||0,16),t.writeUInt16BE(e.quality||0,18),exports.mdhd.encode.bytes=20,t},exports.mdhd.decode=function(e,t){return e=e.slice(t),{ctime:readDate(e,0),mtime:readDate(e,4),timeScale:e.readUInt32BE(8),duration:e.readUInt32BE(12),language:e.readUInt16BE(16),quality:e.readUInt16BE(18)}},exports.mdhd.encodingLength=function(e){return 20},exports.vmhd={},exports.vmhd.encode=function(e,t,r){t=t?t.slice(r):new Buffer(8),t.writeUInt16BE(e.graphicsMode||0,0);var n=e.opcolor||[0,0,0];return t.writeUInt16BE(n[0],2),t.writeUInt16BE(n[1],4),t.writeUInt16BE(n[2],6),exports.vmhd.encode.bytes=8,t},exports.vmhd.decode=function(e,t){return e=e.slice(t),{graphicsMode:e.readUInt16BE(0),opcolor:[e.readUInt16BE(2),e.readUInt16BE(4),e.readUInt16BE(6)]}},exports.vmhd.encodingLength=function(e){return 8},exports.smhd={},exports.smhd.encode=function(e,t,r){return t=t?t.slice(r):new Buffer(4),t.writeUInt16BE(e.balance||0,0),writeReserved(t,2,4),exports.smhd.encode.bytes=4,t},exports.smhd.decode=function(e,t){return e=e.slice(t),{balance:e.readUInt16BE(0)}},exports.smhd.encodingLength=function(e){return 4},exports.stsd={},exports.stsd.encode=function(e,t,r){t=t?t.slice(r):new Buffer(exports.stsd.encodingLength(e));var n=e.entries||[];t.writeUInt32BE(n.length,0);for(var o=4,i=0;i<n.length;i++){var s=n[i];Box.encode(s,t,o),o+=Box.encode.bytes}return exports.stsd.encode.bytes=o,t},exports.stsd.decode=function(e,t,r){e=e.slice(t);for(var n=e.readUInt32BE(0),o=new Array(n),i=4,s=0;s<n;s++){var d=Box.decode(e,i,r);o[s]=d,i+=d.length}return{entries:o}},exports.stsd.encodingLength=function(e){var t=4;if(!e.entries)return t;for(var r=0;r<e.entries.length;r++)t+=Box.encodingLength(e.entries[r]);return t},exports.avc1=exports.VisualSampleEntry={},exports.VisualSampleEntry.encode=function(e,t,r){t=t?t.slice(r):new Buffer(exports.VisualSampleEntry.encodingLength(e)),writeReserved(t,0,6),t.writeUInt16BE(e.dataReferenceIndex||0,6),writeReserved(t,8,24),t.writeUInt16BE(e.width||0,24),t.writeUInt16BE(e.height||0,26),t.writeUInt32BE(e.hResolution||4718592,28),t.writeUInt32BE(e.vResolution||4718592,32),writeReserved(t,36,40),t.writeUInt16BE(e.frameCount||1,40);var n=e.compressorName||"",o=Math.min(n.length,31);t.writeUInt8(o,42),t.write(n,43,o,"utf8"),t.writeUInt16BE(e.depth||24,74),t.writeInt16BE(-1,76);var i=78,s=e.children||[];s.forEach(function(e){Box.encode(e,t,i),i+=Box.encode.bytes}),exports.VisualSampleEntry.encode.bytes=i},exports.VisualSampleEntry.decode=function(e,t,r){e=e.slice(t);for(var n=r-t,o=Math.min(e.readUInt8(42),31),i={dataReferenceIndex:e.readUInt16BE(6),width:e.readUInt16BE(24),height:e.readUInt16BE(26),hResolution:e.readUInt32BE(28),vResolution:e.readUInt32BE(32),frameCount:e.readUInt16BE(40),compressorName:e.toString("utf8",43,43+o),depth:e.readUInt16BE(74),children:[]},s=78;n-s>=8;){var d=Box.decode(e,s,n);i.children.push(d),i[d.type]=d,s+=d.length}return i},exports.VisualSampleEntry.encodingLength=function(e){var t=78,r=e.children||[];return r.forEach(function(e){t+=Box.encodingLength(e)}),t},exports.avcC={},exports.avcC.encode=function(e,t,r){t=t?t.slice(r):Buffer(e.buffer.length),e.buffer.copy(t),exports.avcC.encode.bytes=e.buffer.length},exports.avcC.decode=function(e,t,r){return e=e.slice(t,r),{mimeCodec:e.toString("hex",1,4),buffer:new Buffer(e)}},exports.avcC.encodingLength=function(e){return e.buffer.length},exports.mp4a=exports.AudioSampleEntry={},exports.AudioSampleEntry.encode=function(e,t,r){t=t?t.slice(r):new Buffer(exports.AudioSampleEntry.encodingLength(e)),writeReserved(t,0,6),t.writeUInt16BE(e.dataReferenceIndex||0,6),writeReserved(t,8,16),t.writeUInt16BE(e.channelCount||2,16),t.writeUInt16BE(e.sampleSize||16,18),writeReserved(t,20,24),t.writeUInt32BE(e.sampleRate||0,24);var n=28,o=e.children||[];o.forEach(function(e){Box.encode(e,t,n),n+=Box.encode.bytes}),exports.AudioSampleEntry.encode.bytes=n},exports.AudioSampleEntry.decode=function(e,t,r){e=e.slice(t,r);for(var n=r-t,o={dataReferenceIndex:e.readUInt16BE(6),channelCount:e.readUInt16BE(16),sampleSize:e.readUInt16BE(18),sampleRate:e.readUInt32BE(24),children:[]},i=28;n-i>=8;){var s=Box.decode(e,i,n);o.children.push(s),o[s.type]=s,i+=s.length}return o},exports.AudioSampleEntry.encodingLength=function(e){var t=28,r=e.children||[];return r.forEach(function(e){t+=Box.encodingLength(e)}),t},exports.esds={},exports.esds.encode=function(e,t,r){t=t?t.slice(r):Buffer(e.buffer.length),e.buffer.copy(t,0),exports.esds.encode.bytes=e.buffer.length},exports.esds.decode=function(e,t,r){e=e.slice(t,r);var n=Descriptor.Descriptor.decode(e,0,e.length),o="ESDescriptor"===n.tagName?n:{},i=o.DecoderConfigDescriptor||{},s=i.oti||0,d=i.DecoderSpecificInfo,c=d?(248&d.buffer.readUInt8(0))>>3:0,a=null;return s&&(a=s.toString(16),c&&(a+="."+c)),{mimeCodec:a,buffer:new Buffer(e.slice(0))}},exports.esds.encodingLength=function(e){return e.buffer.length},exports.stsz={},exports.stsz.encode=function(e,t,r){var n=e.entries||[];t=t?t.slice(r):Buffer(exports.stsz.encodingLength(e)),t.writeUInt32BE(0,0),t.writeUInt32BE(n.length,4);for(var o=0;o<n.length;o++)t.writeUInt32BE(n[o],4*o+8);return exports.stsz.encode.bytes=8+4*n.length,t},exports.stsz.decode=function(e,t){e=e.slice(t);for(var r=e.readUInt32BE(0),n=e.readUInt32BE(4),o=new Array(n),i=0;i<n;i++)0===r?o[i]=e.readUInt32BE(4*i+8):o[i]=r;return{entries:o}},exports.stsz.encodingLength=function(e){return 8+4*e.entries.length},exports.stss=exports.stco={},exports.stco.encode=function(e,t,r){var n=e.entries||[];t=t?t.slice(r):new Buffer(exports.stco.encodingLength(e)),t.writeUInt32BE(n.length,0);for(var o=0;o<n.length;o++)t.writeUInt32BE(n[o],4*o+4);return exports.stco.encode.bytes=4+4*n.length,t},exports.stco.decode=function(e,t){e=e.slice(t);for(var r=e.readUInt32BE(0),n=new Array(r),o=0;o<r;o++)n[o]=e.readUInt32BE(4*o+4);return{entries:n}},exports.stco.encodingLength=function(e){return 4+4*e.entries.length},exports.stts={},exports.stts.encode=function(e,t,r){var n=e.entries||[];t=t?t.slice(r):new Buffer(exports.stts.encodingLength(e)),t.writeUInt32BE(n.length,0);for(var o=0;o<n.length;o++){var i=8*o+4;t.writeUInt32BE(n[o].count||0,i),t.writeUInt32BE(n[o].duration||0,i+4)}return exports.stts.encode.bytes=4+8*e.entries.length,t},exports.stts.decode=function(e,t){e=e.slice(t);for(var r=e.readUInt32BE(0),n=new Array(r),o=0;o<r;o++){var i=8*o+4;n[o]={count:e.readUInt32BE(i),duration:e.readUInt32BE(i+4)}}return{entries:n}},exports.stts.encodingLength=function(e){return 4+8*e.entries.length},exports.ctts={},exports.ctts.encode=function(e,t,r){var n=e.entries||[];t=t?t.slice(r):new Buffer(exports.ctts.encodingLength(e)),t.writeUInt32BE(n.length,0);for(var o=0;o<n.length;o++){var i=8*o+4;t.writeUInt32BE(n[o].count||0,i),t.writeUInt32BE(n[o].compositionOffset||0,i+4)}return exports.ctts.encode.bytes=4+8*n.length,t},exports.ctts.decode=function(e,t){e=e.slice(t);for(var r=e.readUInt32BE(0),n=new Array(r),o=0;o<r;o++){var i=8*o+4;n[o]={count:e.readUInt32BE(i),compositionOffset:e.readInt32BE(i+4)}}return{entries:n}},exports.ctts.encodingLength=function(e){return 4+8*e.entries.length},exports.stsc={},exports.stsc.encode=function(e,t,r){var n=e.entries||[];t=t?t.slice(r):new Buffer(exports.stsc.encodingLength(e)),t.writeUInt32BE(n.length,0);for(var o=0;o<n.length;o++){var i=12*o+4;t.writeUInt32BE(n[o].firstChunk||0,i),t.writeUInt32BE(n[o].samplesPerChunk||0,i+4),t.writeUInt32BE(n[o].sampleDescriptionId||0,i+8)}return exports.stsc.encode.bytes=4+12*n.length,t},exports.stsc.decode=function(e,t){e=e.slice(t);for(var r=e.readUInt32BE(0),n=new Array(r),o=0;o<r;o++){var i=12*o+4;n[o]={firstChunk:e.readUInt32BE(i),samplesPerChunk:e.readUInt32BE(i+4),sampleDescriptionId:e.readUInt32BE(i+8)}}return{entries:n}},exports.stsc.encodingLength=function(e){return 4+12*e.entries.length},exports.dref={},exports.dref.encode=function(e,t,r){t=t?t.slice(r):new Buffer(exports.dref.encodingLength(e));var n=e.entries||[];t.writeUInt32BE(n.length,0);for(var o=4,i=0;i<n.length;i++){var s=n[i],d=(s.buf?s.buf.length:0)+4+4;t.writeUInt32BE(d,o),o+=4,t.write(s.type,o,4,"ascii"),o+=4,s.buf&&(s.buf.copy(t,o),o+=s.buf.length)}return exports.dref.encode.bytes=o,t},exports.dref.decode=function(e,t){e=e.slice(t);for(var r=e.readUInt32BE(0),n=new Array(r),o=4,i=0;i<r;i++){var s=e.readUInt32BE(o),d=e.toString("ascii",o+4,o+8),c=e.slice(o+8,o+s);o+=s,n[i]={type:d,buf:c}}return{entries:n}},exports.dref.encodingLength=function(e){var t=4;if(!e.entries)return t;for(var r=0;r<e.entries.length;r++){var n=e.entries[r].buf;t+=(n?n.length:0)+4+4}return t},exports.elst={},exports.elst.encode=function(e,t,r){var n=e.entries||[];t=t?t.slice(r):new Buffer(exports.elst.encodingLength(e)),t.writeUInt32BE(n.length,0);for(var o=0;o<n.length;o++){var i=12*o+4;t.writeUInt32BE(n[o].trackDuration||0,i),t.writeUInt32BE(n[o].mediaTime||0,i+4),writeFixed32(n[o].mediaRate||0,t,i+8)}return exports.elst.encode.bytes=4+12*n.length,t},exports.elst.decode=function(e,t){e=e.slice(t);for(var r=e.readUInt32BE(0),n=new Array(r),o=0;o<r;o++){var i=12*o+4;n[o]={trackDuration:e.readUInt32BE(i),mediaTime:e.readInt32BE(i+4),mediaRate:readFixed32(e,i+8)}}return{entries:n}},exports.elst.encodingLength=function(e){return 4+12*e.entries.length},exports.hdlr={},exports.hdlr.encode=function(e,t,r){t=t?t.slice(r):new Buffer(exports.hdlr.encodingLength(e));var n=21+(e.name||"").length;return t.fill(0,0,n),t.write(e.handlerType||"",4,4,"ascii"),writeString(e.name||"",t,20),exports.hdlr.encode.bytes=n,t},exports.hdlr.decode=function(e,t,r){return e=e.slice(t),{handlerType:e.toString("ascii",4,8),name:readString(e,20,r)}},exports.hdlr.encodingLength=function(e){return 21+(e.name||"").length},exports.mehd={},exports.mehd.encode=function(e,t,r){return t=t?t.slice(r):new Buffer(4),t.writeUInt32BE(e.fragmentDuration||0,0),exports.mehd.encode.bytes=4,t},exports.mehd.decode=function(e,t){return e=e.slice(t),{fragmentDuration:e.readUInt32BE(0)}},exports.mehd.encodingLength=function(e){return 4},exports.trex={},exports.trex.encode=function(e,t,r){return t=t?t.slice(r):new Buffer(20),t.writeUInt32BE(e.trackId||0,0),t.writeUInt32BE(e.defaultSampleDescriptionIndex||0,4),t.writeUInt32BE(e.defaultSampleDuration||0,8),t.writeUInt32BE(e.defaultSampleSize||0,12),t.writeUInt32BE(e.defaultSampleFlags||0,16),exports.trex.encode.bytes=20,t},exports.trex.decode=function(e,t){return e=e.slice(t),{trackId:e.readUInt32BE(0),defaultSampleDescriptionIndex:e.readUInt32BE(4),defaultSampleDuration:e.readUInt32BE(8),defaultSampleSize:e.readUInt32BE(12),defaultSampleFlags:e.readUInt32BE(16)}},exports.trex.encodingLength=function(e){return 20},exports.mfhd={},exports.mfhd.encode=function(e,t,r){return t=t?t.slice(r):new Buffer(4),t.writeUInt32BE(e.sequenceNumber||0,0),exports.mfhd.encode.bytes=4,t},exports.mfhd.decode=function(e,t){return{sequenceNumber:e.readUint32BE(0)}},exports.mfhd.encodingLength=function(e){return 4},exports.tfhd={},exports.tfhd.encode=function(e,t,r){return t=t?t.slice(r):new Buffer(4),t.writeUInt32BE(e.trackId,0),exports.tfhd.encode.bytes=4,t},exports.tfhd.decode=function(e,t){},exports.tfhd.encodingLength=function(e){return 4},exports.tfdt={},exports.tfdt.encode=function(e,t,r){return t=t?t.slice(r):new Buffer(4),t.writeUInt32BE(e.baseMediaDecodeTime||0,0),exports.tfdt.encode.bytes=4,t},exports.tfdt.decode=function(e,t){},exports.tfdt.encodingLength=function(e){return 4},exports.trun={},exports.trun.encode=function(e,t,r){t=t?t.slice(r):new Buffer(8+16*e.entries.length),t.writeUInt32BE(e.entries.length,0),t.writeInt32BE(e.dataOffset,4);for(var n=8,o=0;o<e.entries.length;o++){var i=e.entries[o];t.writeUInt32BE(i.sampleDuration,n),n+=4,t.writeUInt32BE(i.sampleSize,n),n+=4,t.writeUInt32BE(i.sampleFlags,n),n+=4,t.writeUInt32BE(i.sampleCompositionTimeOffset,n),n+=4}exports.trun.encode.bytes=n},exports.trun.decode=function(e,t){},exports.trun.encodingLength=function(e){return 8+16*e.entries.length},exports.mdat={},exports.mdat.encode=function(e,t,r){e.buffer?(e.buffer.copy(t,r),exports.mdat.encode.bytes=e.buffer.length):exports.mdat.encode.bytes=exports.mdat.encodingLength(e)},exports.mdat.decode=function(e,t,r){return{buffer:new Buffer(e.slice(t,r))}},exports.mdat.encodingLength=function(e){return e.buffer?e.buffer.length:e.contentLength};
}).call(this,require("buffer").Buffer)
},{"./descriptor":194,"./index":195,"buffer":33}],194:[function(require,module,exports){
(function (Buffer){
var tagToName={3:"ESDescriptor",4:"DecoderConfigDescriptor",5:"DecoderSpecificInfo",6:"SLConfigDescriptor"};exports.Descriptor={},exports.Descriptor.decode=function(r,e,o){var t,c=r.readUInt8(e),s=e+1,a=0;do t=r.readUInt8(s++),a=a<<7|127&t;while(128&t);var i,p=tagToName[c];return i=exports[p]?exports[p].decode(r,s,o):{buffer:new Buffer(r.slice(s,s+a))},i.tag=c,i.tagName=p,i.length=s-e+a,i.contentsLen=a,i},exports.DescriptorArray={},exports.DescriptorArray.decode=function(r,e,o){for(var t=e,c={};t+2<=o;){var s=exports.Descriptor.decode(r,t,o);t+=s.length;var a=tagToName[s.tag]||"Descriptor"+s.tag;c[a]=s}return c},exports.ESDescriptor={},exports.ESDescriptor.decode=function(r,e,o){var t=r.readUInt8(e+2),c=e+3;if(128&t&&(c+=2),64&t){var s=r.readUInt8(c);c+=s+1}return 32&t&&(c+=2),exports.DescriptorArray.decode(r,c,o)},exports.DecoderConfigDescriptor={},exports.DecoderConfigDescriptor.decode=function(r,e,o){var t=r.readUInt8(e),c=exports.DescriptorArray.decode(r,e+13,o);return c.oti=t,c};
}).call(this,require("buffer").Buffer)
},{"buffer":33}],195:[function(require,module,exports){
(function (Buffer){
var uint64be=require("uint64be"),boxes=require("./boxes"),UINT32_MAX=4294967295,Box=exports,containers=exports.containers={moov:["mvhd","meta","traks","mvex"],trak:["tkhd","tref","trgr","edts","meta","mdia","udta"],edts:["elst"],mdia:["mdhd","hdlr","elng","minf"],minf:["vmhd","smhd","hmhd","sthd","nmhd","dinf","stbl"],dinf:["dref"],stbl:["stsd","stts","ctts","cslg","stsc","stsz","stz2","stco","co64","stss","stsh","padb","stdp","sdtp","sbgps","sgpds","subss","saizs","saios"],mvex:["mehd","trexs","leva"],moof:["mfhd","meta","trafs"],traf:["tfhd","trun","sbgps","sgpds","subss","saizs","saios","tfdt","meta"]};Box.encode=function(e,t,n){return Box.encodingLength(e),n=n||0,t=t||new Buffer(e.length),Box._encode(e,t,n)},Box._encode=function(e,t,n){var o=e.type,s=e.length;s>UINT32_MAX&&(s=1),t.writeUInt32BE(s,n),t.write(e.type,n+4,4,"ascii");var r=n+8;if(1===s&&(uint64be.encode(e.length,t,r),r+=8),boxes.fullBoxes[o]&&(t.writeUInt32BE(e.flags||0,r),t.writeUInt8(e.version||0,r),r+=4),containers[o]){var i=containers[o];i.forEach(function(n){if(5===n.length){var o=e[n]||[];n=n.substr(0,4),o.forEach(function(e){Box._encode(e,t,r),r+=Box.encode.bytes})}else e[n]&&(Box._encode(e[n],t,r),r+=Box.encode.bytes)}),e.otherBoxes&&e.otherBoxes.forEach(function(e){Box._encode(e,t,r),r+=Box.encode.bytes})}else if(boxes[o]){var f=boxes[o].encode;f(e,t,r),r+=f.bytes}else{if(!e.buffer)throw new Error("Either `type` must be set to a known type (not'"+o+"') or `buffer` must be set");var a=e.buffer;a.copy(t,r),r+=e.buffer.length}return Box.encode.bytes=r-n,t},Box.readHeaders=function(e,t,n){if(t=t||0,n=n||e.length,n-t<8)return 8;var o=e.readUInt32BE(t),s=e.toString("ascii",t+4,t+8),r=t+8;if(1===o){if(n-t<16)return 16;o=uint64be.decode(e,r),r+=8}var i,f;return boxes.fullBoxes[s]&&(i=e.readUInt8(r),f=16777215&e.readUInt32BE(r),r+=4),{length:o,headersLen:r-t,contentLen:o-(r-t),type:s,version:i,flags:f}},Box.decode=function(e,t,n){t=t||0,n=n||e.length;var o=Box.readHeaders(e,t,n);if(!o||o.length>n-t)throw new Error("Data too short");return Box.decodeWithoutHeaders(o,e,t+o.headersLen,t+o.length)},Box.decodeWithoutHeaders=function(e,t,n,o){n=n||0,o=o||t.length;var s=e.type,r={};if(containers[s]){r.otherBoxes=[];for(var i=containers[s],f=n;o-f>=8;){var a=Box.decode(t,f,o);if(f+=a.length,i.indexOf(a.type)>=0)r[a.type]=a;else if(i.indexOf(a.type+"s")>=0){var d=a.type+"s",c=r[d]=r[d]||[];c.push(a)}else r.otherBoxes.push(a)}}else if(boxes[s]){var h=boxes[s].decode;r=h(t,n,o)}else r.buffer=new Buffer(t.slice(n,o));return r.length=e.length,r.contentLen=e.contentLen,r.type=e.type,r.version=e.version,r.flags=e.flags,r},Box.encodingLength=function(e){var t=e.type,n=8;if(boxes.fullBoxes[t]&&(n+=4),containers[t]){var o=containers[t];o.forEach(function(t){if(5===t.length){var o=e[t]||[];t=t.substr(0,4),o.forEach(function(e){e.type=t,n+=Box.encodingLength(e)})}else if(e[t]){var s=e[t];s.type=t,n+=Box.encodingLength(s)}}),e.otherBoxes&&e.otherBoxes.forEach(function(e){n+=Box.encodingLength(e)})}else if(boxes[t])n+=boxes[t].encodingLength(e);else{if(!e.buffer)throw new Error("Either `type` must be set to a known type (not'"+t+"') or `buffer` must be set");n+=e.buffer.length}return n>UINT32_MAX&&(n+=8),e.length=n,n};
}).call(this,require("buffer").Buffer)
},{"./boxes":193,"buffer":33,"uint64be":196}],196:[function(require,module,exports){
(function (Buffer){
var UINT_32_MAX=4294967295;exports.encodingLength=function(){return 8},exports.encode=function(e,r,t){r||(r=new Buffer(8)),t||(t=0);var n=Math.floor(e/UINT_32_MAX),o=e-n*UINT_32_MAX;return r.writeUInt32BE(n,t),r.writeUInt32BE(o,t+4),r},exports.decode=function(e,r){r||(r=0),e||(e=new Buffer(4)),r||(r=0);var t=e.readUInt32BE(r),n=e.readUInt32BE(r+4);return t*UINT_32_MAX+n},exports.encode.bytes=8,exports.decode.bytes=8;
}).call(this,require("buffer").Buffer)
},{"buffer":33}],197:[function(require,module,exports){
(function (Buffer){
function Decoder(){return this instanceof Decoder?(stream.Writable.call(this),this.destroyed=!1,this._pending=0,this._missing=0,this._buf=null,this._str=null,this._cb=null,this._ondrain=null,this._writeBuffer=null,this._writeCb=null,this._ondrain=null,void this._kick()):new Decoder}function MediaData(t){this._parent=t,this.destroyed=!1,stream.PassThrough.call(this)}var stream=require("readable-stream"),inherits=require("inherits"),nextEvent=require("next-event"),Box=require("mp4-box-encoding"),EMPTY=new Buffer(0);module.exports=Decoder,inherits(Decoder,stream.Writable),Decoder.prototype.destroy=function(t){this.destroyed||(this.destroyed=!0,t&&this.emit("error",t),this.emit("close"))},Decoder.prototype._write=function(t,e,i){if(!this.destroyed){for(var r=!this._str||!this._str._writableState.needDrain;t.length&&!this.destroyed;){if(!this._missing)return this._writeBuffer=t,void(this._writeCb=i);var s=t.length<this._missing?t.length:this._missing;if(this._buf?t.copy(this._buf,this._buf.length-this._missing):this._str&&(r=this._str.write(s===t.length?t:t.slice(0,s))),this._missing-=s,!this._missing){var n=this._buf,o=this._cb,h=this._str;this._buf=this._cb=this._str=this._ondrain=null,r=!0,h&&h.end(),o&&o(n)}t=s===t.length?EMPTY:t.slice(s)}return this._pending&&!this._missing?(this._writeBuffer=t,void(this._writeCb=i)):void(r?i():this._ondrain(i))}},Decoder.prototype._buffer=function(t,e){this._missing=t,this._buf=new Buffer(t),this._cb=e},Decoder.prototype._stream=function(t,e){var i=this;return this._missing=t,this._str=new MediaData(this),this._ondrain=nextEvent(this._str,"drain"),this._pending++,this._str.on("end",function(){i._pending--,i._kick()}),this._cb=e,this._str},Decoder.prototype._readBox=function(){function t(i,r){e._buffer(i,function(i){r=r?Buffer.concat(r,i):i;var s=Box.readHeaders(r);"number"==typeof s?t(s-r.length,r):(e._pending++,e._headers=s,e.emit("box",s))})}var e=this;t(8)},Decoder.prototype.stream=function(){var t=this;if(!t._headers)throw new Error("this function can only be called once after 'box' is emitted");var e=t._headers;return t._headers=null,t._stream(e.contentLen,null)},Decoder.prototype.decode=function(t){var e=this;if(!e._headers)throw new Error("this function can only be called once after 'box' is emitted");var i=e._headers;e._headers=null,e._buffer(i.contentLen,function(r){var s=Box.decodeWithoutHeaders(i,r);t(s),e._pending--,e._kick()})},Decoder.prototype.ignore=function(){var t=this;if(!t._headers)throw new Error("this function can only be called once after 'box' is emitted");var e=t._headers;t._headers=null,this._missing=e.contentLen,this._cb=function(){t._pending--,t._kick()}},Decoder.prototype._kick=function(){if(!this._pending&&(this._buf||this._str||this._readBox(),this._writeBuffer)){var t=this._writeCb,e=this._writeBuffer;this._writeBuffer=null,this._writeCb=null,this._write(e,null,t)}},inherits(MediaData,stream.PassThrough),MediaData.prototype.destroy=function(t){this.destroyed||(this.destroyed=!0,this._parent.destroy(t),t&&this.emit("error",t),this.emit("close"))};
}).call(this,require("buffer").Buffer)
},{"buffer":33,"inherits":156,"mp4-box-encoding":195,"next-event":200,"readable-stream":185}],198:[function(require,module,exports){
(function (process,Buffer){
function noop(){}function Encoder(){function t(){r._want&&(r._want=!1,r._read())}function e(){r._stream=null}if(!(this instanceof Encoder))return new Encoder;stream.Readable.call(this),this.destroyed=!1,this._reading=!1,this._stream=null,this._drain=null,this._want=!1,this._onreadable=t,this._onend=e;var r=this}function MediaData(t){this._parent=t,this.destroyed=!1,stream.PassThrough.call(this)}var stream=require("readable-stream"),inherits=require("inherits"),Box=require("mp4-box-encoding");module.exports=Encoder,inherits(Encoder,stream.Readable),Encoder.prototype.mediaData=Encoder.prototype.mdat=function(t,e){var r=new MediaData(this);return this.box({type:"mdat",contentLength:t,encodeBufferLen:8,stream:r},e),r},Encoder.prototype.box=function(t,e){if(e||(e=noop),this.destroyed)return e(new Error("Encoder is destroyed"));var r;if(t.encodeBufferLen&&(r=new Buffer(t.encodeBufferLen)),t.stream)t.buffer=null,r=Box.encode(t,r),this.push(r),this._stream=t.stream,this._stream.on("readable",this._onreadable),this._stream.on("end",this._onend),this._stream.on("end",e),this._forward();else{r=Box.encode(t,r);var i=this.push(r);if(i)return process.nextTick(e);this._drain=e}},Encoder.prototype.destroy=function(t){if(!this.destroyed){if(this.destroyed=!0,this._stream&&this._stream.destroy&&this._stream.destroy(),this._stream=null,this._drain){var e=this._drain;this._drain=null,e(t)}t&&this.emit("error",t),this.emit("close")}},Encoder.prototype.finalize=function(){this.push(null)},Encoder.prototype._forward=function(){if(this._stream)for(;!this.destroyed;){var t=this._stream.read();if(!t)return void(this._want=!!this._stream);if(!this.push(t))return}},Encoder.prototype._read=function(){if(!this._reading&&!this.destroyed){if(this._reading=!0,this._stream&&this._forward(),this._drain){var t=this._drain;this._drain=null,t()}this._reading=!1}},inherits(MediaData,stream.PassThrough),MediaData.prototype.destroy=function(t){this.destroyed||(this.destroyed=!0,this._parent.destroy(t),t&&this.emit("error",t),this.emit("close"))};
}).call(this,require('_process'),require("buffer").Buffer)
},{"_process":41,"buffer":33,"inherits":156,"mp4-box-encoding":195,"readable-stream":185}],199:[function(require,module,exports){
exports.decode=require("./decode"),exports.encode=require("./encode");
},{"./decode":197,"./encode":198}],200:[function(require,module,exports){
function nextEvent(n,t){var e=null;return n.on(t,function(n){if(e){var t=e;e=null,t(n)}}),function(n){e=n}}module.exports=nextEvent;
},{}],201:[function(require,module,exports){
function RangeSliceStream(e){var t=this;return t instanceof RangeSliceStream?(stream.Writable.call(t),t.destroyed=!1,t._queue=[],t._position=e||0,t._cb=null,t._buffer=null,void(t._out=null)):new RangeSliceStream(e)}var inherits=require("inherits"),stream=require("readable-stream");module.exports=RangeSliceStream,inherits(RangeSliceStream,stream.Writable),RangeSliceStream.prototype._write=function(e,t,r){for(var n=this,i=!0;;){if(n.destroyed)return;if(0===n._queue.length)return n._buffer=e,void(n._cb=r);n._buffer=null;var a=n._queue[0],l=Math.max(a.start-n._position,0),s=a.end-n._position;if(l>=e.length)return n._position+=e.length,r(null);var u;if(s>e.length){n._position+=e.length,u=0===l?e:e.slice(l),i=a.stream.write(u)&&i;break}n._position+=s,u=0===l&&s===e.length?e:e.slice(l,s),i=a.stream.write(u)&&i,a.last&&a.stream.end(),e=e.slice(s),n._queue.shift()}i?r(null):a.stream.once("drain",r.bind(null,null))},RangeSliceStream.prototype.slice=function(e){var t=this;if(t.destroyed)return null;e instanceof Array||(e=[e]);var r=new stream.PassThrough;return e.forEach(function(n,i){t._queue.push({start:n.start,end:n.end,stream:r,last:i===e.length-1})}),t._buffer&&t._write(t._buffer,null,t._cb),r},RangeSliceStream.prototype.destroy=function(e){var t=this;t.destroyed||(t.destroyed=!0,e&&t.emit("error",e))};
},{"inherits":156,"readable-stream":185}],202:[function(require,module,exports){
function VideoStream(e,r,t){var i=this;return this instanceof VideoStream?(t=t||{},i.detailedError=null,i._elem=r,i._elemWrapper=new MediaElementWrapper(r),i._waitingFired=!1,i._trackMeta=null,i._file=e,i._tracks=null,"none"!==i._elem.preload&&i._createMuxer(),i._onError=function(e){i.detailedError=i._elemWrapper.detailedError,i.destroy()},i._onWaiting=function(){i._waitingFired=!0,i._muxer?i._tracks&&i._pump():i._createMuxer()},i._elem.addEventListener("waiting",i._onWaiting),void i._elem.addEventListener("error",i._onError)):new VideoStream(e,r,t)}var MediaElementWrapper=require("mediasource"),pump=require("pump"),MP4Remuxer=require("./mp4-remuxer");module.exports=VideoStream,VideoStream.prototype._createMuxer=function(){var e=this;e._muxer=new MP4Remuxer(e._file),e._muxer.on("ready",function(r){e._tracks=r.map(function(r){var t=e._elemWrapper.createWriteStream(r.mime);t.on("error",function(r){e._elemWrapper.error(r)});var i={muxed:null,mediaSource:t,initFlushed:!1,onInitFlushed:null};return t.write(r.init,function(e){i.initFlushed=!0,i.onInitFlushed&&i.onInitFlushed(e)}),i}),(e._waitingFired||"auto"===e._elem.preload)&&e._pump()}),e._muxer.on("error",function(r){e._elemWrapper.error(r)})},VideoStream.prototype._pump=function(){var e=this,r=e._muxer.seek(e._elem.currentTime,!e._tracks);e._tracks.forEach(function(t,i){var n=function(){t.muxed&&(t.muxed.destroy(),t.mediaSource=e._elemWrapper.createWriteStream(t.mediaSource),t.mediaSource.on("error",function(r){e._elemWrapper.error(r)})),t.muxed=r[i],pump(t.muxed,t.mediaSource)};t.initFlushed?n():t.onInitFlushed=function(r){return r?void e._elemWrapper.error(r):void n()}})},VideoStream.prototype.destroy=function(){var e=this;e.destroyed||(e.destroyed=!0,e._elem.removeEventListener("waiting",e._onWaiting),e._elem.removeEventListener("error",e._onError),e._tracks&&e._tracks.forEach(function(e){e.muxed.destroy()}),e._elem.src="")};
},{"./mp4-remuxer":191,"mediasource":189,"pump":168}],203:[function(require,module,exports){
(function (process){
module.exports=function(n,e,t){function r(n){function e(){t&&t(n,u),t=null}l?process.nextTick(e):e()}function o(e,t,l){if(u[e]=l,t&&(s=!0),0===--f||t)r(t);else if(!s&&a<i){var m;c?(m=c[a],a+=1,n[m](function(n,e){o(m,n,e)})):(m=a,a+=1,n[m](function(n,e){o(m,n,e)}))}}if("number"!=typeof e)throw new Error("second argument must be a Number");var u,i,f,c,s,l=!0;Array.isArray(n)?(u=[],f=i=n.length):(c=Object.keys(n),u={},f=i=c.length);var a=e;f?c?c.some(function(t,r){if(n[t](function(n,e){o(t,n,e)}),r===e-1)return!0}):n.some(function(n,t){if(n(function(n,e){o(t,n,e)}),t===e-1)return!0}):r(null),l=!1};
}).call(this,require('_process'))
},{"_process":41}],204:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"_process":41,"dup":12}],205:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"buffer":33,"dup":13}],206:[function(require,module,exports){
(function (Buffer){
module.exports=function(n,o){var u=[];n.on("data",function(n){u.push(n)}),n.once("end",function(){o&&o(null,Buffer.concat(u)),o=null}),n.once("error",function(n){o&&o(n),o=null})};
}).call(this,require("buffer").Buffer)
},{"buffer":33}],207:[function(require,module,exports){
(function (Buffer){
function simpleGet(e,t){e="string"==typeof e?{url:e}:extend(e),t=once(t),e.url&&parseOptsUrl(e),null==e.headers&&(e.headers={}),null==e.maxRedirects&&(e.maxRedirects=10);var r=e.json?JSON.stringify(e.body):e.body;e.body=void 0,r&&!e.method&&(e.method="POST"),e.method&&(e.method=e.method.toUpperCase()),e.json&&(e.headers.accept="application/json"),e.json&&r&&(e.headers["content-type"]="application/json");var o=Object.keys(e.headers).some(function(e){return"accept-encoding"===e.toLowerCase()});o||(e.headers["accept-encoding"]="gzip, deflate");var n="https:"===e.protocol?https:http,s=n.request(e,function(r){if(r.statusCode>=300&&r.statusCode<400&&"location"in r.headers)return e.url=r.headers.location,parseOptsUrl(e),r.resume(),e.maxRedirects-=1,void(e.maxRedirects>0?simpleGet(e,t):t(new Error("too many redirects")));var o="function"==typeof unzipResponse&&"HEAD"!==e.method;t(null,o?unzipResponse(r):r)});return s.on("error",t),s.end(r),s}function parseOptsUrl(e){var t=url.parse(e.url);t.hostname&&(e.hostname=t.hostname),t.port&&(e.port=t.port),t.protocol&&(e.protocol=t.protocol),t.auth&&(e.auth=t.auth),e.path=t.path,delete e.url}module.exports=simpleGet;var extend=require("xtend"),http=require("http"),https=require("https"),once=require("once"),unzipResponse=require("unzip-response"),url=require("url");module.exports.concat=function(e,t){return simpleGet(e,function(r,o){if(r)return t(r);var n=[];o.on("data",function(e){n.push(e)}),o.on("end",function(){var r=Buffer.concat(n);if(e.json)try{r=JSON.parse(r.toString())}catch(e){return t(e,o,r)}t(null,o,r)})})},["get","post","put","patch","head","delete"].forEach(function(e){module.exports[e]=function(t,r){return"string"==typeof t&&(t={url:t}),t.method=e.toUpperCase(),simpleGet(t,r)}});
}).call(this,require("buffer").Buffer)
},{"buffer":33,"http":63,"https":38,"once":209,"unzip-response":32,"url":70,"xtend":228}],208:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"dup":9}],209:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10,"wrappy":208}],210:[function(require,module,exports){
function sha1sync(t){return rusha.digest(t)}function sha1(t,n){return subtle?("string"==typeof t&&(t=uint8array(t)),void subtle.digest({name:"sha-1"},t).then(function(t){n(hex(new Uint8Array(t)))},function(r){n(sha1sync(t))})):void setTimeout(n,0,sha1sync(t))}function uint8array(t){for(var n=t.length,r=new Uint8Array(n),e=0;e<n;e++)r[e]=t.charCodeAt(e);return r}function hex(t){for(var n=t.length,r=[],e=0;e<n;e++){var s=t[e];r.push((s>>>4).toString(16)),r.push((15&s).toString(16))}return r.join("")}var Rusha=require("rusha"),rusha=new Rusha,crypto=window.crypto||window.msCrypto||{},subtle=crypto.subtle||crypto.webkitSubtle;try{subtle.digest({name:"sha-1"},new Uint8Array).catch(function(){subtle=!1})}catch(t){subtle=!1}module.exports=sha1,module.exports.sync=sha1sync;
},{"rusha":211}],211:[function(require,module,exports){
(function (global){
!function(){function e(t){"use strict";var a={fill:0},f=function(e){for(e+=9;e%64>0;e+=1);return e},i=function(e,r){for(var n=r>>2;n<e.length;n++)e[n]=0},s=function(e,r,n){e[r>>2]|=128<<24-(r%4<<3),e[((r>>2)+2&-16)+14]=n>>29,e[((r>>2)+2&-16)+15]=n<<3},o=function(e,r,n,t,a){var f,i=this,s=a%4,o=t%4,c=t-o;if(c>0)switch(s){case 0:e[a+3|0]=i.charCodeAt(n);case 1:e[a+2|0]=i.charCodeAt(n+1);case 2:e[a+1|0]=i.charCodeAt(n+2);case 3:e[0|a]=i.charCodeAt(n+3)}for(f=s;f<c;f=f+4|0)r[a+f>>2]=i.charCodeAt(n+f)<<24|i.charCodeAt(n+f+1)<<16|i.charCodeAt(n+f+2)<<8|i.charCodeAt(n+f+3);switch(o){case 3:e[a+c+1|0]=i.charCodeAt(n+c+2);case 2:e[a+c+2|0]=i.charCodeAt(n+c+1);case 1:e[a+c+3|0]=i.charCodeAt(n+c)}},c=function(e,r,n,t,a){var f,i=this,s=a%4,o=t%4,c=t-o;if(c>0)switch(s){case 0:e[a+3|0]=i[n];case 1:e[a+2|0]=i[n+1];case 2:e[a+1|0]=i[n+2];case 3:e[0|a]=i[n+3]}for(f=4-s;f<c;f=f+=4)r[a+f>>2]=i[n+f]<<24|i[n+f+1]<<16|i[n+f+2]<<8|i[n+f+3];switch(o){case 3:e[a+c+1|0]=i[n+c+2];case 2:e[a+c+2|0]=i[n+c+1];case 1:e[a+c+3|0]=i[n+c]}},u=function(e,r,t,a,f){var i,s=this,o=f%4,c=a%4,u=a-c,h=new Uint8Array(n.readAsArrayBuffer(s.slice(t,t+a)));if(u>0)switch(o){case 0:e[f+3|0]=h[0];case 1:e[f+2|0]=h[1];case 2:e[f+1|0]=h[2];case 3:e[0|f]=h[3]}for(i=4-o;i<u;i=i+=4)r[f+i>>2]=h[i]<<24|h[i+1]<<16|h[i+2]<<8|h[i+3];switch(c){case 3:e[f+u+1|0]=h[u+2];case 2:e[f+u+2|0]=h[u+1];case 1:e[f+u+3|0]=h[u]}},h=function(e){switch(r.getDataType(e)){case"string":return o.bind(e);case"array":return c.bind(e);case"buffer":return c.bind(e);case"arraybuffer":return c.bind(new Uint8Array(e));case"view":return c.bind(new Uint8Array(e.buffer,e.byteOffset,e.byteLength));case"blob":return u.bind(e)}},d=function(e){var r,n,t="0123456789abcdef",a=[],f=new Uint8Array(e);for(r=0;r<f.length;r++)n=f[r],a[r]=t.charAt(n>>4&15)+t.charAt(n>>0&15);return a.join("")},w=function(e){var r;if(e<=65536)return 65536;if(e<16777216)for(r=1;r<e;r<<=1);else for(r=16777216;r<e;r+=16777216);return r},y=function(r){if(r%64>0)throw new Error("Chunk size must be a multiple of 128 bit");a.maxChunkLen=r,a.padMaxChunkLen=f(r),a.heap=new ArrayBuffer(w(a.padMaxChunkLen+320+20)),a.h32=new Int32Array(a.heap),a.h8=new Int8Array(a.heap),a.core=new e._core({Int32Array:Int32Array,DataView:DataView},{},a.heap),a.buffer=null};y(t||65536);var A=function(e,r){var n=new Int32Array(e,r+320,5);n[0]=1732584193,n[1]=-271733879,n[2]=-1732584194,n[3]=271733878,n[4]=-1009589776},b=function(e,r){var n=f(e),t=new Int32Array(a.heap,0,n>>2);return i(t,e),s(t,e,r),n},l=function(e,r,n){h(e)(a.h8,a.h32,r,n,0)},p=function(e,r,n,t,f){var i=n;f&&(i=b(n,t)),l(e,r,n),a.core.hash(i,a.padMaxChunkLen)},g=function(e,r){var n=new Int32Array(e,r+320,5),t=new Int32Array(5),a=new DataView(t.buffer);return a.setInt32(0,n[0],!1),a.setInt32(4,n[1],!1),a.setInt32(8,n[2],!1),a.setInt32(12,n[3],!1),a.setInt32(16,n[4],!1),t},v=this.rawDigest=function(e){var r=e.byteLength||e.length||e.size||0;A(a.heap,a.padMaxChunkLen);var n=0,t=a.maxChunkLen;for(n=0;r>n+t;n+=t)p(e,n,t,r,!1);return p(e,n,r-n,r,!0),g(a.heap,a.padMaxChunkLen)};this.digest=this.digestFromString=this.digestFromBuffer=this.digestFromArrayBuffer=function(e){return d(v(e).buffer)}}var r={getDataType:function(e){if("string"==typeof e)return"string";if(e instanceof Array)return"array";if("undefined"!=typeof global&&global.Buffer&&global.Buffer.isBuffer(e))return"buffer";if(e instanceof ArrayBuffer)return"arraybuffer";if(e.buffer instanceof ArrayBuffer)return"view";if(e instanceof Blob)return"blob";throw new Error("Unsupported data type.")}};if(e._core=function e(r,n,t){"use asm";var a=new r.Int32Array(t);function f(e,r){e=e|0;r=r|0;var n=0,t=0,f=0,i=0,s=0,o=0,c=0,u=0,h=0,d=0,w=0,y=0,A=0,b=0;f=a[r+320>>2]|0;s=a[r+324>>2]|0;c=a[r+328>>2]|0;h=a[r+332>>2]|0;w=a[r+336>>2]|0;for(n=0;(n|0)<(e|0);n=n+64|0){i=f;o=s;u=c;d=h;y=w;for(t=0;(t|0)<64;t=t+4|0){b=a[n+t>>2]|0;A=((f<<5|f>>>27)+(s&c|~s&h)|0)+((b+w|0)+1518500249|0)|0;w=h;h=c;c=s<<30|s>>>2;s=f;f=A;a[e+t>>2]=b}for(t=e+64|0;(t|0)<(e+80|0);t=t+4|0){b=(a[t-12>>2]^a[t-32>>2]^a[t-56>>2]^a[t-64>>2])<<1|(a[t-12>>2]^a[t-32>>2]^a[t-56>>2]^a[t-64>>2])>>>31;A=((f<<5|f>>>27)+(s&c|~s&h)|0)+((b+w|0)+1518500249|0)|0;w=h;h=c;c=s<<30|s>>>2;s=f;f=A;a[t>>2]=b}for(t=e+80|0;(t|0)<(e+160|0);t=t+4|0){b=(a[t-12>>2]^a[t-32>>2]^a[t-56>>2]^a[t-64>>2])<<1|(a[t-12>>2]^a[t-32>>2]^a[t-56>>2]^a[t-64>>2])>>>31;A=((f<<5|f>>>27)+(s^c^h)|0)+((b+w|0)+1859775393|0)|0;w=h;h=c;c=s<<30|s>>>2;s=f;f=A;a[t>>2]=b}for(t=e+160|0;(t|0)<(e+240|0);t=t+4|0){b=(a[t-12>>2]^a[t-32>>2]^a[t-56>>2]^a[t-64>>2])<<1|(a[t-12>>2]^a[t-32>>2]^a[t-56>>2]^a[t-64>>2])>>>31;A=((f<<5|f>>>27)+(s&c|s&h|c&h)|0)+((b+w|0)-1894007588|0)|0;w=h;h=c;c=s<<30|s>>>2;s=f;f=A;a[t>>2]=b}for(t=e+240|0;(t|0)<(e+320|0);t=t+4|0){b=(a[t-12>>2]^a[t-32>>2]^a[t-56>>2]^a[t-64>>2])<<1|(a[t-12>>2]^a[t-32>>2]^a[t-56>>2]^a[t-64>>2])>>>31;A=((f<<5|f>>>27)+(s^c^h)|0)+((b+w|0)-899497514|0)|0;w=h;h=c;c=s<<30|s>>>2;s=f;f=A;a[t>>2]=b}f=f+i|0;s=s+o|0;c=c+u|0;h=h+d|0;w=w+y|0}a[r+320>>2]=f;a[r+324>>2]=s;a[r+328>>2]=c;a[r+332>>2]=h;a[r+336>>2]=w}return{hash:f}},"undefined"!=typeof module?module.exports=e:"undefined"!=typeof window&&(window.Rusha=e),"undefined"!=typeof FileReaderSync){var n=new FileReaderSync,t=new e(4194304);self.onmessage=function(e){var r,n=e.data.data;try{r=t.digest(n),self.postMessage({id:e.data.id,hash:r})}catch(r){self.postMessage({id:e.data.id,error:r.name})}}}}();
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],212:[function(require,module,exports){
var tick=1,maxTick=65535,resolution=4,inc=function(){tick=tick+1&maxTick},timer=setInterval(inc,1e3/resolution|0);timer.unref&&timer.unref(),module.exports=function(t){var i=resolution*(t||5),n=[0],r=1,e=tick-1&maxTick;return function(t){var o=tick-e&maxTick;for(o>i&&(o=i),e=tick;o--;)r===i&&(r=0),n[r]=n[0===r?i-1:r-1],r++;t&&(n[r-1]+=t);var c=n[r-1],u=n.length<i?0:n[r===i?0:r];return n.length<resolution?c:(c-u)*resolution/n.length}};
},{}],213:[function(require,module,exports){
var getBlob=require("stream-to-blob");module.exports=function e(t,o,r){return"function"==typeof o?e(t,null,o):void getBlob(t,o,function(e,t){if(e)return r(e);var o=URL.createObjectURL(t);r(null,o)})};
},{"stream-to-blob":214}],214:[function(require,module,exports){
var once=require("once");module.exports=function n(o,e,r){if("function"==typeof e)return n(o,null,e);r=once(r);var u=[];o.on("data",function(n){u.push(n)}).on("end",function(){var n=e?new Blob(u,{type:e}):new Blob(u);r(null,n)}).on("error",r)};
},{"once":216}],215:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"dup":9}],216:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10,"wrappy":215}],217:[function(require,module,exports){
(function (Buffer){
var once=require("once");module.exports=function(n,o,e){e=once(e);var r=new Buffer(o),c=0;n.on("data",function(n){n.copy(r,c),c+=n.length}).on("end",function(){e(null,r)}).on("error",e)};
}).call(this,require("buffer").Buffer)
},{"buffer":33,"once":219}],218:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"dup":9}],219:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10,"wrappy":218}],220:[function(require,module,exports){
(function (process){
function Discovery(e){function r(e,r){var n=new DHT(r);return n.on("warning",t._onWarning),n.on("error",t._onError),n.listen(e),t._internalDHT=!0,n}var t=this;if(!(t instanceof Discovery))return new Discovery(e);if(EventEmitter.call(t),!e.peerId)throw new Error("Option `peerId` is required");if(!e.infoHash)throw new Error("Option `infoHash` is required");if(!process.browser&&!e.port)throw new Error("Option `port` is required");t.peerId="string"==typeof e.peerId?e.peerId:e.peerId.toString("hex"),t.infoHash="string"==typeof e.infoHash?e.infoHash:e.infoHash.toString("hex"),t._port=e.port,t.destroyed=!1,t._announce=e.announce||[],t._intervalMs=e.intervalMs||9e5,t._trackerOpts=null,t._dhtAnnouncing=!1,t._dhtTimeout=!1,t._internalDHT=!1,t._onWarning=function(e){t.emit("warning",e)},t._onError=function(e){t.emit("error",e)},t._onDHTPeer=function(e,r){r.toString("hex")===t.infoHash&&t.emit("peer",e.host+":"+e.port)},t._onTrackerPeer=function(e){t.emit("peer",e)},t._onTrackerAnnounce=function(){t.emit("trackerAnnounce")},e.tracker===!1?t.tracker=null:e.tracker&&"object"==typeof e.tracker?(t._trackerOpts=extend(e.tracker),t.tracker=t._createTracker()):t.tracker=t._createTracker(),e.dht===!1||"function"!=typeof DHT?t.dht=null:e.dht&&"function"==typeof e.dht.addNode?t.dht=e.dht:e.dht&&"object"==typeof e.dht?t.dht=r(e.dhtPort,e.dht):t.dht=r(e.dhtPort),t.dht&&(t.dht.on("peer",t._onDHTPeer),t._dhtAnnounce())}module.exports=Discovery;var debug=require("debug")("torrent-discovery"),DHT=require("bittorrent-dht/client"),EventEmitter=require("events").EventEmitter,extend=require("xtend"),inherits=require("inherits"),parallel=require("run-parallel"),Tracker=require("bittorrent-tracker/client");inherits(Discovery,EventEmitter),Discovery.prototype.updatePort=function(e){var r=this;e!==r._port&&(r._port=e,r.dht&&r._dhtAnnounce(),r.tracker&&(r.tracker.stop(),r.tracker.destroy(function(){r.tracker=r._createTracker()})))},Discovery.prototype.complete=function(e){this.tracker&&this.tracker.complete(e)},Discovery.prototype.destroy=function(e){var r=this;if(!r.destroyed){r.destroyed=!0,clearTimeout(r._dhtTimeout);var t=[];r.tracker&&(r.tracker.stop(),r.tracker.removeListener("warning",r._onWarning),r.tracker.removeListener("error",r._onError),r.tracker.removeListener("peer",r._onTrackerPeer),r.tracker.removeListener("update",r._onTrackerAnnounce),t.push(function(e){r.tracker.destroy(e)})),r.dht&&r.dht.removeListener("peer",r._onDHTPeer),r._internalDHT&&(r.dht.removeListener("warning",r._onWarning),r.dht.removeListener("error",r._onError),t.push(function(e){r.dht.destroy(e)})),parallel(t,e),r.dht=null,r.tracker=null,r._announce=null}},Discovery.prototype._createTracker=function(){var e=extend(this._trackerOpts,{infoHash:this.infoHash,announce:this._announce,peerId:this.peerId,port:this._port}),r=new Tracker(e);return r.on("warning",this._onWarning),r.on("error",this._onError),r.on("peer",this._onTrackerPeer),r.on("update",this._onTrackerAnnounce),r.setInterval(this._intervalMs),r.start(),r},Discovery.prototype._dhtAnnounce=function(){function e(){return r._intervalMs+Math.floor(Math.random()*r._intervalMs/5)}var r=this;r._dhtAnnouncing||(debug("dht announce"),r._dhtAnnouncing=!0,clearTimeout(r._dhtTimeout),r.dht.announce(r.infoHash,r._port,function(t){r._dhtAnnouncing=!1,debug("dht announce complete"),t&&r.emit("warning",t),r.emit("dhtAnnounce"),r.destroyed||(r._dhtTimeout=setTimeout(function(){r._dhtAnnounce()},e()),r._dhtTimeout.unref&&r._dhtTimeout.unref())}))};
}).call(this,require('_process'))
},{"_process":41,"bittorrent-dht/client":32,"bittorrent-tracker/client":1,"debug":149,"events":37,"inherits":156,"run-parallel":204,"xtend":228}],221:[function(require,module,exports){
(function (Buffer){
function Piece(t){return this instanceof Piece?(this.length=t,this.missing=t,this.sources=null,this._chunks=Math.ceil(t/BLOCK_LENGTH),this._remainder=t%BLOCK_LENGTH||BLOCK_LENGTH,this._buffered=0,this._buffer=null,this._cancellations=null,this._reservations=0,void(this._flushed=!1)):new Piece(t)}module.exports=Piece;var BLOCK_LENGTH=16384;Piece.BLOCK_LENGTH=BLOCK_LENGTH,Piece.prototype.chunkLength=function(t){return t===this._chunks-1?this._remainder:BLOCK_LENGTH},Piece.prototype.chunkLengthRemaining=function(t){return this.length-t*BLOCK_LENGTH},Piece.prototype.chunkOffset=function(t){return t*BLOCK_LENGTH},Piece.prototype.reserve=function(){return this.init()?this._cancellations.length?this._cancellations.pop():this._reservations<this._chunks?this._reservations++:-1:-1},Piece.prototype.reserveRemaining=function(){if(!this.init())return-1;if(this._reservations<this._chunks){var t=this._reservations;return this._reservations=this._chunks,t}return-1},Piece.prototype.cancel=function(t){this.init()&&this._cancellations.push(t)},Piece.prototype.cancelRemaining=function(t){this.init()&&(this._reservations=t)},Piece.prototype.get=function(t){return this.init()?this._buffer[t]:null},Piece.prototype.set=function(t,e,i){if(!this.init())return!1;for(var s=e.length,n=Math.ceil(s/BLOCK_LENGTH),r=0;r<n;r++)if(!this._buffer[t+r]){var h=r*BLOCK_LENGTH,u=e.slice(h,h+BLOCK_LENGTH);this._buffered++,this._buffer[t+r]=u,this.missing-=u.length,this.sources.indexOf(i)===-1&&this.sources.push(i)}return this._buffered===this._chunks},Piece.prototype.flush=function(){if(!this._buffer||this._chunks!==this._buffered)return null;var t=Buffer.concat(this._buffer,this.length);return this._buffer=null,this._cancellations=null,this.sources=null,this._flushed=!0,t},Piece.prototype.init=function(){return!this._flushed&&(!!this._buffer||(this._buffer=new Array(this._chunks),this._cancellations=[],this.sources=[],!0))};
}).call(this,require("buffer").Buffer)
},{"buffer":33}],222:[function(require,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"dup":28}],223:[function(require,module,exports){
function remove(e,r){if(!(r>=e.length||r<0)){var n=e.pop();if(r<e.length){var o=e[r];return e[r]=n,o}return n}}module.exports=remove;
},{}],224:[function(require,module,exports){
var bencode=require("bencode"),BitField=require("bitfield"),Buffer=require("safe-buffer").Buffer,debug=require("debug")("ut_metadata"),EventEmitter=require("events").EventEmitter,inherits=require("inherits"),sha1=require("simple-sha1"),MAX_METADATA_SIZE=1e7,BITFIELD_GROW=1e3,PIECE_LENGTH=16384;module.exports=function(e){function t(t){EventEmitter.call(this),this._wire=t,this._metadataComplete=!1,this._metadataSize=null,this._remainingRejects=null,this._fetching=!1,this._bitfield=new BitField(0,{grow:BITFIELD_GROW}),Buffer.isBuffer(e)&&this.setMetadata(e)}return inherits(t,EventEmitter),t.prototype.name="ut_metadata",t.prototype.onHandshake=function(e,t,i){this._infoHash=e},t.prototype.onExtendedHandshake=function(e){return e.m&&e.m.ut_metadata?e.metadata_size?"number"!=typeof e.metadata_size||MAX_METADATA_SIZE<e.metadata_size||e.metadata_size<=0?this.emit("warning",new Error("Peer gave invalid metadata size")):(this._metadataSize=e.metadata_size,this._numPieces=Math.ceil(this._metadataSize/PIECE_LENGTH),this._remainingRejects=2*this._numPieces,void(this._fetching&&this._requestPieces())):this.emit("warning",new Error("Peer does not have metadata")):this.emit("warning",new Error("Peer does not support ut_metadata"))},t.prototype.onMessage=function(e){var t,i;try{var a=e.toString(),s=a.indexOf("ee")+2;t=bencode.decode(a.substring(0,s)),i=e.slice(s)}catch(e){return}switch(t.msg_type){case 0:this._onRequest(t.piece);break;case 1:this._onData(t.piece,i,t.total_size);break;case 2:this._onReject(t.piece)}},t.prototype.fetch=function(){this._metadataComplete||(this._fetching=!0,this._metadataSize&&this._requestPieces())},t.prototype.cancel=function(){this._fetching=!1},t.prototype.setMetadata=function(e){if(this._metadataComplete)return!0;debug("set metadata");try{var t=bencode.decode(e).info;t&&(e=bencode.encode(t))}catch(e){}return(!this._infoHash||this._infoHash===sha1.sync(e))&&(this.cancel(),this.metadata=e,this._metadataComplete=!0,this._metadataSize=this.metadata.length,this._wire.extendedHandshake.metadata_size=this._metadataSize,this.emit("metadata",bencode.encode({info:bencode.decode(this.metadata)})),!0)},t.prototype._send=function(e,t){var i=bencode.encode(e);Buffer.isBuffer(t)&&(i=Buffer.concat([i,t])),this._wire.extended("ut_metadata",i)},t.prototype._request=function(e){this._send({msg_type:0,piece:e})},t.prototype._data=function(e,t,i){var a={msg_type:1,piece:e};"number"==typeof i&&(a.total_size=i),this._send(a,t)},t.prototype._reject=function(e){this._send({msg_type:2,piece:e})},t.prototype._onRequest=function(e){if(!this._metadataComplete)return void this._reject(e);var t=e*PIECE_LENGTH,i=t+PIECE_LENGTH;i>this._metadataSize&&(i=this._metadataSize);var a=this.metadata.slice(t,i);this._data(e,a,this._metadataSize)},t.prototype._onData=function(e,t,i){t.length>PIECE_LENGTH||(t.copy(this.metadata,e*PIECE_LENGTH),this._bitfield.set(e),this._checkDone())},t.prototype._onReject=function(e){this._remainingRejects>0&&this._fetching?(this._request(e),this._remainingRejects-=1):this.emit("warning",new Error('Peer sent "reject" too much'))},t.prototype._requestPieces=function(){this.metadata=Buffer.alloc(this._metadataSize);for(var e=0;e<this._numPieces;e++)this._request(e)},t.prototype._checkDone=function(){for(var e=!0,t=0;t<this._numPieces;t++)if(!this._bitfield.get(t)){e=!1;break}if(e){var i=this.setMetadata(this.metadata);i||this._failedMetadata()}},t.prototype._failedMetadata=function(){this._bitfield=new BitField(0,{grow:BITFIELD_GROW}),this._remainingRejects-=this._numPieces,this._remainingRejects>0?this._requestPieces():this.emit("warning",new Error("Peer sent invalid metadata"))},t};
},{"bencode":227,"bitfield":125,"debug":149,"events":37,"inherits":156,"safe-buffer":205,"simple-sha1":210}],225:[function(require,module,exports){
arguments[4][127][0].apply(exports,arguments)
},{"buffer":33,"dup":127}],226:[function(require,module,exports){
arguments[4][128][0].apply(exports,arguments)
},{"buffer":33,"dup":128}],227:[function(require,module,exports){
arguments[4][129][0].apply(exports,arguments)
},{"./decode":225,"./encode":226,"dup":129}],228:[function(require,module,exports){
arguments[4][29][0].apply(exports,arguments)
},{"dup":29}],229:[function(require,module,exports){
arguments[4][30][0].apply(exports,arguments)
},{"dup":30}],230:[function(require,module,exports){
module.exports=function n(t,o,r){return void 0===o?function(o,r){return n(t,o,r)}:(void 0===r&&(r="0"),t-=o.toString().length,t>0?new Array(t+(/\./.test(o)?2:1)).join(r)+o:o+"")};
},{}],231:[function(require,module,exports){
module.exports={"version":"0.96.4"}
},{}],232:[function(require,module,exports){
var PeerTunes=require("./modules/peertunes"),config={maxRoomSize:50,trackerURL:"wss://tracker.openwebtorrent.com",username:null,chat:{chatBody:"#chat .panel-body",chatList:"#chat-list",chatInput:"#chat-text",chatEnterButton:"#chat-enter"},rtc:{iceServers:[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun3.l.google.com:19302"},{urls:"stun:stun4.l.google.com:19302"},{urls:"turn:numb.viagenie.ca",username:"peertunes.turn@gmail.com",credential:"peertunes-turn"}]},selectors:{moshpit:"#moshpit",likeButton:"#like-button",dislikeButton:"#dislike-button",joinQueueButton:"#btn-join-queue",volumeSlider:"#volume-slider"},moshpit:{width:-1,height:-1},songQueue:{queue:"#my-queue-list",localstorageKey:"queue",queueItem:".queue-item",itemTemplate:"#queueItemTmpl"}};$(document).ready(function(){$("#btn-login").click(function(e){config.username=$("#input-username").val();var t=new PeerTunes(config);t.init(),$("#welcome").css("top","100%")})});
},{"./modules/peertunes":236}],233:[function(require,module,exports){
var queryString=require("query-string");module.exports=function(){function t(t){return moment.duration(t).asSeconds()}function e(e,r){var o=e.join(","),a={part:"snippet,contentDetails",id:o,key:i.apiKey},s=n+"videos?"+queryString.stringify(a);$.getJSON(s,function(e){var i=e.items.map(function(e){return{title:e.snippet.title,id:e.id,duration:t(e.contentDetails.duration)}});r(i)})}var i={apiKey:"AIzaSyCw4x0rg8P-R-7ecZzc57Il8ZqTJc_ybNY",maxResults:30},n="https://www.googleapis.com/youtube/v3/";return{getVideoMeta:function(e,r){var o={id:e,title:"",description:"",duration:0},a=n+"videos?id="+e+"&key="+i.apiKey+"&part=snippet,contentDetails";$.getJSON(a,function(e){var i=e.items[0];o.title=i.snippet.title,o.description=i.snippet.description,o.duration=t(i.contentDetails.duration),r(o)})},getSearchResults:function(t,r){var o={part:"id",maxResults:i.maxResults,q:t,type:"video",videoDefinition:"any",videoEmbeddable:!0,key:i.apiKey},a=n+"search?"+queryString.stringify(o);$.getJSON(a,function(t){t=t.items.map(function(t){return t.id.videoId}),e(t,r)})}}}();
},{"query-string":94}],234:[function(require,module,exports){
var EventEmitter=require("events").EventEmitter,Mustache=require("mustache");module.exports=function(){function t(t){return t=t.replace(/:\)/g,":smile:"),t=t.replace(/:D/g,":grin:"),t=t.replace(/<3/g,":heart:"),t=emojione.shortnameToImage(t)}function e(t){return t.length>g.maxMessageLength&&(t=t.substring(0,g.maxMessageLength)),t=$("<p>").html(t).text()}function n(){return c[0].scrollHeight-c[0].offsetHeight-c[0].scrollTop<1}function r(){var t=c[0].scrollHeight;c.scrollTop(t)}function o(){s.val("")}function i(){var t=s.val();t.trim().length<1||(h.emit("submit",e(t)),a(m,t),o(),r())}function a(n,r){r=t(e(r));var o=$(g.template).html(),i={id:n,message:r};return l.append(Mustache.render(o,i)),r}var c,l,s,u,m,g={maxMessageLength:300,template:"#chatMessageTmpl"},h=new EventEmitter;return{init:function(t){console.log("Initializing chat"),s=$(t.chatInput),c=$(t.chatBody),u=$(t.chatEnterButton),l=$(t.chatList),m=t.name,u.click(function(t){i()});var e=13;s.keydown(function(t){t.keyCode==e&&i()})},getInputText:function(){return s.val()},appendMsg:a,submitMessage:i,clear:function(){l.html("")},clearInput:o,scrollToBottom:r,filter:e,isScrolledToBottom:n,emojify:t,on:function(t,e){h.on(t,e)}}}();
},{"events":37,"mustache":93}],235:[function(require,module,exports){
function onPeer(e){function a(){function a(){console.log("Peer disconnected: "+e.id),e.removeListener("data",o),e.removeListener("close",a),e.removeListener("error",a),e.removeListener("end",a),s.peers.splice(s.peers.indexOf(e),1),s.removeRoom(e),s.isHost&&s.cleanupPeer(e),e===s.hostPeer&&(s.hostPeer=null,s.resetRoom(),$("#btn-leave-room").hide()),console.log("Number of peers: "+s.peers.length)}function o(a){try{a=JSON.parse(a),console.log("Received message: ",a)}catch(e){console.error(e.message)}if(a.username&&(e.username=a.username),a.msg)switch(a.msg){case"new-room":console.log("Adding room "+a.value),s.addRoom(e,a.value);break;case"host-end":console.log("Host closed room: "+e.username),s.removeRoom(e),s.resetRoom();break;case"join-room":if(s.isHost){s.host.guests.push(e),s.addAvatar(e.username),s.broadcastToRoom({msg:"new-user",value:{username:e.username,like:!1}}),e.like=!1;for(var o=s.host.guests.length-1;o>=0;o--){var n=s.host.guests[o];s.host.guests[o]!=e&&e.send(JSON.stringify({msg:"new-user",value:{username:n.username,like:n.like}}))}if(e.send(JSON.stringify({msg:"new-user",value:{username:s.username,like:1===s.vote}})),null!=s.song.currentlyPlaying){var r=s.song.currentlyPlaying;null!=s.song.infoHash&&(r.infoHash=s.song.infoHash),console.log("Sending new user song: ",r);var a={msg:"song",value:r,dj:s.host.djQueue[0].username,startTime:s.song.startTime};e.send(JSON.stringify(a))}}break;case"new-user":e===s.hostPeer&&s.addAvatar(a.value.username,a.value.like);break;case"rate":console.log("Received rating update: ",a.value),s.isHost?(s.rating=1==a.value?s.rating+1:s.rating-1,console.log("Updated Rating: "+s.rating),s.broadcast({msg:"rate",value:{rating:s.rating,id:e.username,action:a.value}},e),1==a.value?(e.like=!0,$("#user-"+e.username+" .audience-head").addClass("headbob-animation")):(e.like=!1,$("#user-"+e.username+" .audience-head").removeClass("headbob-animation"))):1==a.value.action?$("#user-"+a.value.id+" .audience-head").addClass("headbob-animation"):$("#user-"+a.value.id+" .audience-head").removeClass("headbob-animation");break;case"leave-queue":if(!s.isHost)return;s.removeDJFromQueue(e);break;case"end-song":s.song.end();break;case"chat":if(!s.isHost&&e!==s.hostPeer)return;var t=s.chat.isScrolledToBottom();if(s.isHost)a.text=s.chat.filter(a.text),s.broadcastToRoom({msg:"chat",value:{id:e.username,text:a.text}},e),s.chat.appendMsg(e.username,a.text),s.avatarChatPopover(e.username,s.chat.emojify(a.text));else{var i=a.value.id;e===s.hostPeer&&(i+=" [Host]"),s.chat.appendMsg(i,a.value.text),s.avatarChatPopover(a.value.id,s.chat.emojify(a.value.text))}t&&s.chat.scrollToBottom();break;case"leave":s.isHost?s.cleanupPeer(e):s.removeAvatar(a.value);break;case"join-queue":if(!s.isHost)break;for(var u=!1,o=s.host.djQueue.length-1;o>=0;o--)if(s.host.djQueue[o]==e){u=!0;break}u||s.addDJToQueue(e);break;case"queue-front":if(e!==s.hostPeer)return;var l=s.songQueue.front();"MP3"===l.source?s.seedFileWithKey(l.id,function(e){s.currentTorrentID=e.infoHash,l.infoHash=e.infoHash,s.hostPeer.send(JSON.stringify({msg:"song",value:l}))}):s.hostPeer.send(JSON.stringify({msg:"song",value:l}));break;case"song":if(s.isHost){if(e===s.host.djQueue[0]){var d={id:a.value.id,source:a.value.source,duration:a.value.duration};switch(a.value.infoHash&&(d.infoHash=a.value.infoHash,s.song.infoHash=a.value.infoHash),"YOUTUBE"===a.value.source&&YT.getVideoMeta(a.value.id,function(e){s.song.meta=e}),a.value.source){case"YOUTUBE":YT.getVideoMeta(a.value.id,function(e){s.song.meta=e});break;case"MP3":d.title=a.value.title}s.song.play(d,0,s.setSongTimeout);var c=Date.now();s.song.startTime=c,s.broadcastToRoom({msg:"song",value:d,dj:e.username,startTime:c},null)}break}console.log("Received song data"),s.vote=0,s.rating=0;var d={id:a.value.id,source:a.value.source,duration:a.value.duration};"MP3"===a.value.source&&(d.title=a.value.title),a.dj===s.username?s.isDJ=!0:a.value.infoHash&&(d.infoHash=a.value.infoHash);var m=Date.now()-a.startTime;console.log("Calculated current time = ",m),s.song.play(d,m,s.setSongTimeout);break;default:console.log("unknown message: "+a.msg)}}console.log("Peer connected: "+e.id),console.log("Number of peers: "+s.peers.length),e.on("data",o),e.on("close",a),e.on("error",a),e.on("end",a),s.isHost&&(e.send(JSON.stringify({username:s.username})),e.send(JSON.stringify({msg:"new-room",value:s.host.meta.title})))}var s=this;this.peers.map(function(e){return e.id}).indexOf(e.id)>-1||(console.log("Tracker sent new peer: "+e.id),this.peers.push(e),e.connected?a():e.once("connect",a))}var YT=require("./YT");module.exports=onPeer;
},{"./YT":233}],236:[function(require,module,exports){
(function (global,Buffer){
function PeerTunes(e){var o=this;this.chat=chat,this.config=e,this.tracker=null,this.torrentClient=null,this.currentTorrentID=null,this.isHost=!1,this.peers=[],this.peerId=new Buffer(hat(160),"hex"),this.dummySelfPeer=null,this.username=e.username,this.hostPeer=null,this.rooms=[],this.vote=0,this.rating=0,this.inQueue=!1,this.isDJ=!1,this.player={video:null,audio:null,preview:null},this.volume=1,this.songQueue=new SongQueue(e.songQueue),this.tagReader=new TagReader,this.host={meta:{title:"Untitled"},guests:[],djQueue:[],rating:0,votes:{}},this.song={meta:{},timeout:null,player:null,currentlyPlaying:null,startTime:null,infoHash:null,play:function(e,t,n){n=n.bind(o),console.log(),o.doSongTimeout(),this.currentlyPlaying=e;var s=e.id,r=e.source,i=e.duration;switch(console.log("play id: "+s+" time: "+t+" from source: "+r),console.log("play data: ",e),e.title&&o.setPlayerTitle(e.title),r){case"YOUTUBE":this.player=o.player.video,this.player.src({type:"video/youtube",src:"https://www.youtube.com/watch?v="+s}),this.player.currentTime(t/1e3),this.player.play(),o.setPlayerVolume(o.volume),$("#vid2").addClass("hide"),$("#vid1").removeClass("hide"),YT.getVideoMeta(s,function(e){console.log("Got YouTube video metadata: ",e),o.song.meta=e,o.setPlayerTitle(e.title),n&&n()});break;case"MP3":if(this.player=o.player.audio,this.meta={id:s,duration:i},this.meta.id=s,o.setPlayerCover(null),$("#vid2").removeClass("hide"),$("#vid1").addClass("hide"),e.infoHash){console.log("Song has infoHash, leeching"),o.removeLastTorrent(),o.currentTorrentID=e.infoHash;var a=o.torrentClient.add(e.infoHash,function(e){var s=e.files[0];console.log("started downloading file: ",s),s.renderTo("#vid2_html5_api"),this.player.play(),o.setPlayerVolume(o.volume),n&&n();var r=120;setTimeout(function(){o.song.player.currentTime((t+r)/1e3)},r)}.bind(this));a.on("warning",function(e){console.log("torrent warning: ",e)}),a.on("metadata",function(){console.log("torrent metadata loaded")}.bind(this)),a.on("noPeers",function(e){console.log("torrent has no peers from source ",e)}),a.on("wire",function(e){console.log("torrent: connected to new peer")}),a.on("done",function(){console.log("torrent finished downloading");a.files[0].getBlob(function(e,t){return e?void console.log(e):(console.log(t),void o.tagReader.tagsFromFile(t,function(e){o.setPlayerCover(e.cover)}))})})}else console.log("Song does not have infoHash, getting from localstorage"),localforage.getItem(s).then(function(e){var r=new File([e],s,{type:"audio/mp3",lastModified:Date.now()}),i=window.URL.createObjectURL(r);o.song.player.src({type:"audio/mp3",src:i}),o.song.player.currentTime(t/1e3),o.song.player.play(),o.setPlayerVolume(o.volume),o.tagReader.tagsFromFile(r,function(e){o.setPlayerTitle(e.combinedTitle),o.setPlayerCover(e.cover)}),o.song.player.one("loadedmetadata",function(){console.log("player mp3 metadata loaded"),o.song.meta={duration:o.song.player.duration()},n&&n()})}).catch(function(e){console.log("Error retrieving mp3: ",e)});break;default:console.log("Can't play unknown media type ",r)}o.rating=0,o.vote=0},end:function(){console.log("ending song"),null!=this.player&&(this.player.trigger("ended"),this.player.pause()),o.stopAllHeadBobbing(),o.setPlayerTitle("")}},this.$moshpit=$(e.selectors.moshpit),this.$likeButton=$(e.selectors.likeButton),this.$dislikeButton=$(e.selectors.dislikeButton),this.$joinQueueButton=$(e.selectors.joinQueueButton),this.$volumeSlider=$(e.selectors.volumeSlider)}var hat=require("hat"),Peer=require("simple-peer"),Tracker=require("bittorrent-tracker/client"),Mustache=require("mustache"),WebTorrent=require("webtorrent"),localforage=require("localforage"),YT=require("./YT"),chat=require("./chat"),onPeer=require("./peer-handler"),SongQueue=require("./queue"),TagReader=require("./tag-reader");PeerTunes.prototype.init=function(){var e=this;if(console.log("Initializing PeerTunes"),!Peer.WEBRTC_SUPPORT)return void window.alert("This browser is unsupported. Please use a browser with WebRTC support.");console.log("Your username: ",this.username),this.dummySelfPeer={username:this.username,id:this.peerId},this.config.chat.name=this.username,chat.init(this.config.chat),chat.on("submit",function(o){e.isHost?e.broadcastToRoom({msg:"chat",value:{id:e.username,text:o}}):null!=e.hostPeer&&e.hostPeer.send(JSON.stringify({msg:"chat",text:o})),e.avatarChatPopover(e.username,chat.emojify(o))}),this.tracker=new Tracker({peerId:e.peerId,announce:e.config.trackerURL,infoHash:new Buffer(20).fill("01234567890123456787"),rtcConfig:e.config.rtc}),this.tracker.start(),this.initTrackerListeners(),global.WEBTORRENT_ANNOUNCE=[this.config.trackerURL],this.torrentClient=new WebTorrent({tracker:{rtcConfig:e.config.rtc,announce:["wss://tracker.openwebtorrent.com","wss://tracker.btorrent.xyz","wss://tracker.webtorrent.io"]}}),this.torrentClient.on("torrent",function(e){console.log("[Torrent client] torrent ready: ",e)}),this.torrentClient.on("error",function(e){console.log("[Torrent client] error: ",e)}),this.initClickHandlers(),this.player.video=videojs("vid1"),this.player.audio=videojs("vid2");var o=[this.player.video,this.player.audio];this.song.player=this.player.video,o.forEach(function(o){o.ready(function(){o.on("ended",function(){$("#video-frame").hide(),o.off("timeupdate")}),o.on("play",function(){$("#video-frame").show(),o.on("timeupdate",function(){var o=1e3*this.currentTime(),t=o>=3600?"HH:mm:ss":"mm:ss";$("#song-time-current").text(moment.utc(o).format(t)),e.updateProgress(this.currentTime()/e.song.meta.duration)})})})});var t=dragula([document.querySelector("#my-queue-list")]);t.on("drop",function(o,t,n,s){e.songQueue.saveToLocalStorage()}),this.songQueue.restore();var n=13;$("#song-search-input").keydown(function(o){o.keyCode==n&&e.doSongSearch()})},PeerTunes.prototype.initTrackerListeners=function(){console.log("Initializing tracker event listeners"),this.tracker.on("peer",onPeer.bind(this)),this.tracker.on("update",function(e){}),this.tracker.on("error",function(e){console.log("Tracker Error:"),console.log(e)}),this.tracker.on("warning",function(e){console.log("Tracker Warning:"),console.log(e)})},PeerTunes.prototype.initClickHandlers=function(){var e=this;console.log("initializing click handlers"),this.$volumeSlider.on("change mousemove",function(){$(this).val()/100;e.setPlayerVolume($(this).val()/100)}),$("#song-search-submit-button").click(function(o){e.doSongSearch()}),$("#volume-button").click(function(o){if(e.song.player){if(e.song.player.volume()>0)return e.setPlayerVolume(0),void e.$volumeSlider.val(0);e.setPlayerVolume(1),e.$volumeSlider.val(100)}}),$("#add-song-button").click(function(e){$("#song-search-results").html(""),$("#song-search-input").val("")}),$("#btn-create-room").click(function(o){console.log("create/destroy room clicked"),$(".audience-member").tooltip("destroy"),e.$moshpit.html(""),chat.clear(),e.isHost?($(this).text("Create Room"),e.stopHosting()):$("#createRoomModal").modal("toggle")}),$("#modal-btn-create-room").click(function(o){return $("#roomNameInput").val().length<1?(o.stopPropagation(),void $("#create-room-form-group").addClass("has-error")):($("#create-room-form-group").removeClass("has-error"),$("#btn-create-room").text("Destroy Room"),e.leaveRoom(),e.startHosting($("#roomNameInput").val()),void $("#roomNameInput").val(""))}),$("#btn-leave-room").click(function(o){$(this).hide(),e.leaveRoom(),e.song.end()}),this.$joinQueueButton.click(function(o){return console.log("Clicked join/leave queue, inQueue: ",e.inQueue),e.inQueue?(console.log("left DJ queue"),e.inQueue=!1,console.log("inQueue: ",e.inQueue),$(this).removeClass("btn-info").addClass("btn-primary").text("Join DJ Queue"),e.isDJ&&(e.isDJ=!1),void(e.isHost?e.removeDJFromQueue(e.dummySelfPeer):e.hostPeer.send(JSON.stringify({msg:"leave-queue"})))):(console.log("joined DJ queue"),e.inQueue=!0,console.log("inQueue: ",e.inQueue),$(this).removeClass("btn-primary").addClass("btn-info").text("Leave DJ Queue"),e.isHost?void e.addDJToQueue(e.dummySelfPeer):void e.hostPeer.send(JSON.stringify({msg:"join-queue"})))}),this.$likeButton.click(function(o){console.log("Rate +1"),0!=e.vote&&e.vote!=-1||($("#user-"+e.username+" .audience-head").addClass("headbob-animation"),e.isHost?(e.rating++,e.broadcast({msg:"rate",value:{rating:e.rating,id:e.username,action:1}},null)):e.hostPeer.send(JSON.stringify({msg:"rate",value:1})),e.vote=1)}),this.$dislikeButton.click(function(o){console.log("Rate -1"),1!=e.vote&&0!=e.vote||($("#user-"+e.username+" .audience-head").removeClass("headbob-animation"),e.isHost?(e.rating--,console.log("Rating: "+e.rating),e.broadcast({msg:"rate",value:{rating:e.rating,id:e.username,action:-1}},null)):e.hostPeer.send(JSON.stringify({msg:"rate",value:-1})),e.vote=-1)}),$('button[data-target="#roomModal"]').click(function(o){console.log("clicked rooms button"),e.refreshRoomListing()}),$("#room-refresh").click(function(o){e.refreshRoomListing()})},PeerTunes.prototype.startHosting=function(e){console.log("Starting hosting"),this.addAvatar(this.username),chat.appendMsg("Notice","Room Created"),this.broadcast({username:this.username}),this.broadcast({msg:"new-room",value:e}),this.addRoom(this.dummySelfPeer,e),this.isHost=!0,this.host.meta.title=e},PeerTunes.prototype.stopHosting=function(){this.broadcast({msg:"host-end"}),this.host.djQueue.length=0,this.vote=0,this.isHost=!1,this.removeRoom(this.dummySelfPeer)},PeerTunes.prototype.sendTo=function(e,o){console.log("Sending data ",e," to peer ",o.username),o.send(JSON.stringify(e))},PeerTunes.prototype.broadcast=function(e,o){console.log("Broadcasting to Swarm: ",e),e=JSON.stringify(e),this.peers.forEach(function(t){t.connected&&t!==o&&t.send(e)})},PeerTunes.prototype.broadcastToRoom=function(e,o){console.log("Broadcasting To Room: ",e),e=JSON.stringify(e),this.host.guests.forEach(function(t){t.connected&&t!==o&&t.send(e)})},PeerTunes.prototype.addRoom=function(e,o){console.log("Adding room: "+o),this.rooms.push({peer:e,title:o})},PeerTunes.prototype.removeRoom=function(e){console.log("Removing "+e.username+"'s room");var o=this.rooms.map(function(e){return e.peer}).indexOf(e);o>-1&&this.rooms.splice(o,1)},PeerTunes.prototype.leaveRoom=function(){null!=this.hostPeer&&(console.log("Leaving room"),this.hostPeer.send(JSON.stringify({msg:"leave"})),this.hostPeer=null,this.resetRoom())},PeerTunes.prototype.resetRoom=function(){$(".audience-member").tooltip("destroy"),this.$moshpit.html(""),chat.clear(),this.song.end(),$("#btn-leave-room").hide()},PeerTunes.prototype.refreshRoomListing=function(){console.log("refreshing room listing");var e=$("#roomRowTmpl").html();Mustache.parse(e);var o=$("<ul>").addClass("list-unstyled"),t=this;$.each(this.rooms,function(n,s){var r=s.peer.username,i={id:r,title:s.title};console.log("Rendering template for: "),console.log(i),$row=$(Mustache.render(e,i)),$row.click(function(){$("#roomModal").modal("toggle"),console.log("Joining room: "+r),t.connectToHost(s.peer)}),o.append($row)}),$("#roomModal .modal-body").html(o)},PeerTunes.prototype.connectToHost=function(e){if(this.isHost){if(this.peerId==e.id)return;var o=confirm("Joining a room will destroy your room!");if(!o)return;this.stopHosting(),this.resetRoom(),$("#create-room").text("Create Room")}console.log("connecting to peer: "+e.id),this.hostPeer=e,e.send(JSON.stringify({username:this.username})),e.send(JSON.stringify({msg:"join-room"})),$("#btn-leave-room").show()},PeerTunes.prototype.addAvatar=function(e,o){console.log("Adding avatar for ",e," with headbob ",o===!0);var t=80*Math.random()+10,n=100*Math.random()+5,s="user-"+e,r=$("#avatarTmpl").html();Mustache.parse(r);var i={userId:s,label:e,avatar:1,x:t,y:n,z:Math.floor(n)},a=Mustache.render(r,i),u=$(a);o===!0&&u.find(".audience-head").addClass("headbob-animation"),r=$("#popoverTmpl").html(),Mustache.parse(r);var l=e!==this.username;console.log("Show menu for ",e,": ",l),i={id:e,menu:l},a=Mustache.render(r,i),u.webuiPopover({title:"",content:a,placement:"top",trigger:"hover",padding:!1}),this.$moshpit.append(u)},PeerTunes.prototype.removeAvatar=function(e){console.log("Removing avatar for ",e);var o=$("#user-"+e);o.remove(),o.webuiPopover("destroy")},PeerTunes.prototype.stopAllHeadBobbing=function(){$(".audience-head").removeClass("headbob-animation")},PeerTunes.prototype.playNextDJSong=function(){var e=this;if(this.song.meta={},this.song.currentlyPlaying=null,this.song.infoHash=null,this.host.rating=0,this.host.votes=[],this.vote=0,this.host.guests.map(function(e){return e.like=!1,e}),this.host.djQueue[0]===this.dummySelfPeer&&(this.isDJ=!0),console.log("play next DJ, isDJ: ",this.isDJ),console.log("Play next DJ from queue with length ",this.host.djQueue.length),this.host.djQueue.length>0)if(this.isDJ){console.log("Host (you) is the next DJ");var o=this.songQueue.front();this.song.play({id:o.id,source:o.source},0,this.setSongTimeout);var t=Date.now();this.song.startTime=t,"MP3"===o.source?this.seedFileWithKey(o.id,function(n){o.infoHash=n.infoHash,e.song.infoHash=n.infoHash,e.broadcastToRoom({msg:"song",value:o,dj:e.username,startTime:t},null)}):this.broadcastToRoom({msg:"song",value:o,dj:this.username,startTime:t},null)}else this.host.djQueue[0].send(JSON.stringify({msg:"queue-front"}));else console.log("DJ queue empty")},PeerTunes.prototype.doSongTimeout=function(){null!=this.song.timeout&&(console.log("Doing song timeout prematurely & nullifying it"),clearTimeout(this.song.timeout),this.song.timeout=null,this.songTimeout())},PeerTunes.prototype.setSongTimeout=function(){var e=this;console.log("setting song timeout with duration: ",e.song.meta.duration);var o=1e3*this.song.meta.duration;this.song.timeout=setTimeout(function(){e.songTimeout()},o)},PeerTunes.prototype.songTimeout=function(){function e(){console.log("DJing ended"),o.songQueue.cycle(),o.isDJ=!1}var o=this;if(console.log("songTimeout"),console.log("inQueue at timeOut:",o.inQueue),this.song.end(),this.song.timeout=null,this.stopAllHeadBobbing(),this.setPlayerTitle(""),console.log("Songtimeout queue length: ",this.host.djQueue.length),console.log("songtimeout isDJ: ",this.isDJ),this.isDJ&&e(),this.isHost){if(this.host.djQueue.length>0){console.log("Shifting queue:",this.host.djQueue);var t=this.host.djQueue.shift();this.host.djQueue.push(t)}this.song.currentlyPlaying={},this.song.meta={},this.song.infoHash=null,this.playNextDJSong()}},PeerTunes.prototype.updateProgress=function(e){var o=100*e+"%";$("#song-progress-bar").css("width",o)},PeerTunes.prototype.setPlayerTitle=function(e){var o=65;e.length>o&&(e=e.substring(0,o)+"..."),$("#song-title").text(e)},PeerTunes.prototype.setPlayerCover=function(e){return null==this.song.player?void this.song.player.posterImage.hide():($("#vid2 .vjs-poster").css("background-image","url("+e+")"),void this.song.player.posterImage.show())},PeerTunes.prototype.setPlayerVolume=function(e){var o=[this.player.video,this.player.audio];this.volume=e,o.forEach(function(o){o.volume(e)});var t=$("#volume-button");0===this.volume?t.removeClass("glyphicon-volume-up").addClass("glyphicon-volume-off"):t.removeClass("glyphicon-volume-off").addClass("glyphicon-volume-up")},PeerTunes.prototype.addDJToQueue=function(e){console.log("Adding ",e.username," to DJ queue"),console.log("DJ queue length before: ",this.host.djQueue.length),this.host.djQueue.push(e),console.log("DJ queue length after: ",this.host.djQueue.length),1===this.host.djQueue.length&&this.playNextDJSong()},PeerTunes.prototype.removeDJFromQueue=function(e){console.log("Removing DJ from queue:",e.username),console.log("DJ queue length: ",this.host.djQueue.length),console.log("Queue before:",this.host.djQueue);var o=this.host.djQueue.indexOf(e);o>-1&&(this.host.djQueue.splice(o,1),0===o&&0===this.host.djQueue.length&&(console.log("removed dj was last dj => ending song"),this.doSongTimeout(),this.broadcastToRoom({msg:"end-song"}))),console.log("Queue after:",this.host.djQueue)},PeerTunes.prototype.cleanupPeer=function(e){var o=this;if(this.isHost){var t=!1,n="";return this.host.guests=this.host.guests.filter(function(s){return s!==e||(o.removeAvatar(s.username),n=s.username,t=!0,!1)}),void(t&&(this.broadcastToRoom({msg:"leave",value:n}),this.host.djQueue=this.host.djQueue.filter(function(o){return o!==e})))}},PeerTunes.prototype.seedFileWithKey=function(e,o){var t=this;localforage.getItem(e).then(function(n){var s=new File([n],e,{type:"audio/mp3",lastModified:Date.now()});t.removeLastTorrent(),t.torrentClient.seed(s,function(n){console.log("Client is seeding "+e),t.currentTorrentID=n.infoHash,n.on("wire",function(e){console.log("torrent: connected to new peer")}),setTimeout(function(){o(n)},100)})}).catch(function(e){console.log("Error retrieving mp3: ",e)})},PeerTunes.prototype.removeLastTorrent=function(){null!=this.currentTorrentID&&(console.log("Removing torrent: ",this.currentTorrentID),this.torrentClient.remove(this.currentTorrentID),this.currentTorrentID=null)},PeerTunes.prototype.avatarChatPopover=function(e,o){o='<div class="text-center">'+o+"</div>";var t="#user-"+e+" .audience-head";$user=$(t);var n={title:"",placement:"top",content:o,trigger:"manual",width:190,animation:"pop",multi:!0,cache:!1,autoHide:2600,onHide:function(e){$user.webuiPopover("destroy")}};$user.webuiPopover(n),$user.webuiPopover("show")},PeerTunes.prototype.doSongSearch=function(){var e=this,o=$("#song-search-input").val();o.length<1||YT.getSearchResults(o,function(o){console.log("Search results: ",o);var t=$("#songSearchResultTmpl").html();Mustache.parse(t),$("#song-search-results").html("");var n="";o.forEach(function(e){var o={title:e.title,id:e.id,duration:e.duration},s=Mustache.render(t,o);n+=s}),$("#song-search-results").append(n),$(".song-search-result").click(function(o){$(this).addClass("active");var t="YOUTUBE",n=$(this).data("id"),s=$(this).data("title"),r=$(this).data("duration"),i={title:s,id:n,source:t,duration:r};e.songQueue.addSong(i)})})},module.exports=PeerTunes;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"./YT":233,"./chat":234,"./peer-handler":235,"./queue":237,"./tag-reader":239,"bittorrent-tracker/client":1,"buffer":33,"hat":76,"localforage":92,"mustache":93,"simple-peer":97,"webtorrent":117}],237:[function(require,module,exports){
function Queue(e){var t=this;this.$songQueue=$(e.queue),this.songQueue=e.queue,this.queueItem=e.queueItem,this.localstorageKey=e.localstorageKey,this.$itemTemplate=$(e.itemTemplate),this.tagReader=new TagReader,dragDrop("#my-queue",function(e){var o=e[0],r=o.name;console.log("Reading tags"),t.tagReader.tagsFromFile(o,function(e){SongDuration.get(o,function(o){t.addSong({title:e.combinedTitle,source:"MP3",id:r,duration:o})})});var a=new Blob([o]);localforage.setItem(r,a).then(function(){return console.log("Done saving file to localstorage"),localforage.getItem(r)}).then(function(e){}).catch(function(e){console.log("Error retreiving file:",e)})})}var localforage=require("localforage"),Mustache=require("mustache"),dragDrop=require("drag-drop"),TagReader=require("./tag-reader"),SongDuration=require("./song-duration");module.exports=Queue,Queue.prototype.front=function(){var e=this.$songQueue.find("li"),t=e.length;if(t>0){var o=e.first(),r={id:o.data("id"),source:o.data("source"),title:o.data("title"),duration:o.data("duration")};return console.log("Front of queue: ",r),r}return null},Queue.prototype.cycle=function(){this.$songQueue.find("li").first().detach().appendTo(this.songQueue),this.saveToLocalStorage()},Queue.prototype.addSong=function(e){this.appendSong(e),this.saveToLocalStorage()},Queue.prototype.appendSong=function(e){var t=this,o=this.prettyDuration(e.duration),r=this.$itemTemplate.html();Mustache.parse(r);var a={title:e.title,source:e.source,id:e.id,duration:e.duration,prettyDuration:o},n=$(Mustache.render(r,a));this.$songQueue.append(n),n.find(".song-remove").click(function(e){n.remove(),t.saveToLocalStorage()}),n.find(".song-top-control").click(function(e){n.detach().prependTo(t.$songQueue),t.saveToLocalStorage()})},Queue.prototype.saveToLocalStorage=function(){var e=[];this.$songQueue.find(this.queueItem).each(function(t){var o=$(this).data("title"),r=$(this).data("source"),a=$(this).data("id"),n=$(this).data("duration");e.push({title:o,source:r,id:a,duration:n})});var t={queue:e};localforage.setItem(this.localstorageKey,t).then(function(e){}).catch(function(e){console.log("Error saving queue: ",e)})},Queue.prototype.getFromLocalStorage=function(e){localforage.getItem(this.localstorageKey).then(function(t){e(t.queue)}).catch(function(e){console.log("Error retreiving queue from localstorage, maybe this is the first use"),console.log(e)})},Queue.prototype.setFromArray=function(e){var t=this;e.forEach(function(e){t.appendSong(e)})},Queue.prototype.restore=function(){var e=this;this.getFromLocalStorage(function(t){e.setFromArray(t)})},Queue.prototype.prettyDuration=function(e){var t=moment.duration(e,"seconds"),o=t.seconds(),r=t.minutes(),a=t.hours();o=("0"+o).slice(-2);var n=r+":"+o;return a>0&&(a=("0"+a).slice(-2),n=a+":"+n),n};
},{"./song-duration":238,"./tag-reader":239,"drag-drop":73,"localforage":92,"mustache":93}],238:[function(require,module,exports){
var SongDuration={get:function(o,e){var r=URL.createObjectURL(o),n=$('<audio id="sd-temp"></audio>');n.css("display","none"),n.on("canplaythrough",function(o){var n=o.currentTarget.duration;URL.revokeObjectURL(r),$(this).remove(),e(n)}),$("body").append(n),n.prop("src",r)}};module.exports=SongDuration;
},{}],239:[function(require,module,exports){
function TagReader(){}var mediaTags=require("jsmediatags");module.exports=TagReader,TagReader.prototype.tagsFromFile=function(e,t){mediaTags.read(e,{onSuccess:function(e){if(e=e.tags,e.picture){for(var a="",r=0;r<e.picture.data.length;r++)a+=String.fromCharCode(e.picture.data[r]);var i="data:image/jpeg;base64,"+window.btoa(a);e.picture=i}else e.picture=null;var o={artist:e.artist,title:e.title,cover:e.picture,combinedTitle:e.title+" - "+e.artist};t(o)},onError:function(e){console.log("Error reading MP3 tags: ",e)}})};
},{"jsmediatags":90}]},{},[232]);

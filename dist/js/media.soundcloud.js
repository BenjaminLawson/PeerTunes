/*! video.js-soundcloud v1.0.0_12-02-2016 */
var addScriptTag;

addScriptTag = function(a) {
    var b, c;
    return c = document.createElement("script"), c.src = a, b = document.getElementsByTagName("head")[0], 
    b.parentNode.appendChild(c);
}, videojs.Soundcloud = videojs.MediaTechController.extend({
    init: function(a, b, c) {
        var d = this;
        return videojs.MediaTechController.call(this, a, b, c), this.volumeVal = 0, this.durationMilliseconds = 1, 
        this.currentPositionSeconds = 0, this.loadPercentageDecimal = 0, this.paused_ = !0, 
        this.player_ = a, this.soundcloudSource = null, "string" == typeof b.source ? this.soundcloudSource = b.source : "object" == typeof b.source && (this.soundcloudSource = b.source.src), 
        this.scWidgetId = "" + this.player_.id() + "_soundcloud_api_" + Date.now(), this.scWidgetElement = videojs.Component.prototype.createEl("iframe", {
            id: this.scWidgetId,
            className: "vjs-tech",
            scrolling: "no",
            marginWidth: 0,
            marginHeight: 0,
            frameBorder: 0,
            webkitAllowFullScreen: "true",
            mozallowfullscreen: "true",
            allowFullScreen: "true",
            src: "https://w.soundcloud.com/player/?url=" + this.soundcloudSource
        }), this.scWidgetElement.style.opacity = 0, this.player_.el().appendChild(this.scWidgetElement), 
        this.player_.el().classList.add("backgroundContainer"), this.player_.options().autoplay && (this.playOnReady = !0), 
        this.readyToPlay = !1, this.ready(function() {
            return d.readyToPlay = !0, d.player_.trigger("loadstart");
        }), this.loadSoundcloud();
    }
}), videojs.Soundcloud.prototype.dispose = function() {
    return this.scWidgetElement && this.scWidgetElement.parentNode.removeChild(this.scWidgetElement), 
    this.player_.el().classList.remove("backgroundContainer"), this.player_.el().style.backgroundImage = "", 
    this.soundcloudPlayer ? delete this.soundcloudPlayer : void 0;
}, videojs.Soundcloud.prototype.load = function() {
    return this.loadSoundcloud();
}, videojs.Soundcloud.prototype.src = function(a) {
    var b = this;
    return a ? this.soundcloudPlayer.load(a, {
        callback: function() {
            return b.soundcloudSource = a, b.onReady(), b.player_.trigger("newSource");
        }
    }) : this.soundcloudSource;
}, videojs.Soundcloud.prototype.updatePoster = function() {
    var a, b = this;
    try {
        return this.soundcloudPlayer.getSounds(function(a) {
            var c, d;
            if (1 === a.length && (d = a[0], d.artwork_url)) return c = d.artwork_url.replace("large.jpg", "t500x500.jpg"), 
            b.player_.el().style.backgroundImage = "url('" + c + "')";
        });
    } catch (c) {
        return void (a = c);
    }
}, videojs.Soundcloud.prototype.play = function() {
    return this.readyToPlay ? this.soundcloudPlayer.play() : this.playOnReady = !0;
}, videojs.Soundcloud.prototype.toggle = function() {
    return this.player_.paused() ? this.player_.play() : this.player_.pause();
}, videojs.Soundcloud.prototype.pause = function() {
    return this.soundcloudPlayer.pause();
}, videojs.Soundcloud.prototype.paused = function() {
    return this.paused_;
}, videojs.Soundcloud.prototype.currentTime = function() {
    return this.currentPositionSeconds;
}, videojs.Soundcloud.prototype.setCurrentTime = function(a) {
    return this.soundcloudPlayer.seekTo(1e3 * a), this.player_.trigger("seeking");
}, videojs.Soundcloud.prototype.duration = function() {
    return this.durationMilliseconds / 1e3;
}, videojs.Soundcloud.prototype.buffered = function() {
    var a;
    return a = this.duration() * this.loadPercentageDecimal, videojs.createTimeRange(0, a);
}, videojs.Soundcloud.prototype.volume = function() {
    return this.volumeVal;
}, videojs.Soundcloud.prototype.setVolume = function(a) {
    return a !== this.volumeVal ? (this.volumeVal = a, this.soundcloudPlayer.setVolume(this.volumeVal), 
    this.player_.trigger("volumechange")) : void 0;
}, videojs.Soundcloud.prototype.muted = function() {
    return 0 === this.volumeVal;
}, videojs.Soundcloud.prototype.setMuted = function(a) {
    return a ? (this.unmuteVolume = this.volumeVal, this.setVolume(0)) : this.setVolume(this.unmuteVolume);
}, videojs.Soundcloud.isSupported = function() {
    return !0;
}, videojs.Soundcloud.prototype.supportsFullScreen = function() {
    return !0;
}, videojs.Soundcloud.prototype.enterFullScreen = function() {
    return this.scWidgetElement.webkitEnterFullScreen();
}, videojs.Soundcloud.prototype.exitFullScreen = function() {
    return this.scWidgetElement.webkitExitFullScreen();
}, videojs.Soundcloud.prototype.isSoundcloudUrl = function(a) {
    return /^(https?:\/\/)?(www.|api.)?soundcloud.com\//i.test(a);
}, videojs.Soundcloud.prototype.canPlaySource = videojs.Soundcloud.canPlaySource = function(a) {
    var b;
    return "string" == typeof a ? videojs.Soundcloud.prototype.isSoundcloudUrl(a) : b = "audio/soundcloud" === a.type || videojs.Soundcloud.prototype.isSoundcloudUrl(a.src);
}, videojs.Soundcloud.prototype.loadSoundcloud = function() {
    var a, b = this;
    return videojs.Soundcloud.apiReady && !this.soundcloudPlayer ? this.initWidget() : videojs.Soundcloud.apiLoading ? void 0 : (a = function() {
        return "undefined" != typeof window.SC ? (videojs.Soundcloud.apiReady = !0, window.clearInterval(videojs.Soundcloud.intervalId), 
        void b.initWidget()) : void 0;
    }, addScriptTag("http://w.soundcloud.com/player/api.js"), videojs.Soundcloud.apiLoading = !0, 
    videojs.Soundcloud.intervalId = window.setInterval(a, 10));
}, videojs.Soundcloud.prototype.initWidget = function() {
    var a = this;
    return this.soundcloudPlayer = SC.Widget(this.scWidgetId), this.soundcloudPlayer.bind(SC.Widget.Events.READY, function() {
        return a.onReady();
    }), this.soundcloudPlayer.bind(SC.Widget.Events.PLAY_PROGRESS, function(b) {
        return a.onPlayProgress(b.relativePosition);
    }), this.soundcloudPlayer.bind(SC.Widget.Events.LOAD_PROGRESS, function(b) {
        return a.onLoadProgress(b.loadedProgress);
    }), this.soundcloudPlayer.bind(SC.Widget.Events.ERROR, function() {
        return a.onError();
    }), this.soundcloudPlayer.bind(SC.Widget.Events.PLAY, function() {
        return a.onPlay();
    }), this.soundcloudPlayer.bind(SC.Widget.Events.PAUSE, function() {
        return a.onPause();
    }), this.soundcloudPlayer.bind(SC.Widget.Events.FINISH, function() {
        return a.onFinished();
    }), this.soundcloudPlayer.bind(SC.Widget.Events.SEEK, function(b) {
        return a.onSeek(b.currentPosition);
    }), this.soundcloudSource ? void 0 : this.triggerReady();
}, videojs.Soundcloud.prototype.onReady = function() {
    var a, b = this;
    this.soundcloudPlayer.getVolume(function(a) {
        return b.unmuteVolume = a, b.setVolume(b.unmuteVolume);
    });
    try {
        this.soundcloudPlayer.getDuration(function(a) {
            return b.durationMilliseconds = a, b.player_.trigger("durationchange"), b.player_.trigger("canplay");
        });
    } catch (c) {
        a = c;
    }
    this.updatePoster(), this.triggerReady();
    try {
        this.playOnReady && this.soundcloudPlayer.play();
    } catch (c) {
        a = c;
    }
    return void 0;
}, videojs.Soundcloud.prototype.onPlayProgress = function(a) {
    return this.currentPositionSeconds = this.durationMilliseconds * a / 1e3, this.player_.trigger("playing");
}, videojs.Soundcloud.prototype.onLoadProgress = function(a) {
    return this.loadPercentageDecimal = a, this.player_.trigger("timeupdate");
}, videojs.Soundcloud.prototype.onSeek = function(a) {
    return this.currentPositionSeconds = a / 1e3, this.player_.trigger("seeked");
}, videojs.Soundcloud.prototype.onPlay = function() {
    return this.paused_ = !1, this.playing = !this.paused_, this.player_.trigger("play");
}, videojs.Soundcloud.prototype.onPause = function() {
    return this.paused_ = !0, this.playing = !this.paused_, this.player_.trigger("pause");
}, videojs.Soundcloud.prototype.onFinished = function() {
    return this.paused_ = !1, this.playing = !this.paused_, this.player_.trigger("ended");
}, videojs.Soundcloud.prototype.onError = function() {
    return this.player_.error("There was a soundcloud error. Check the view.");
};
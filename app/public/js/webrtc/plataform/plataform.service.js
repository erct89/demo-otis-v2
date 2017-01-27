'use strict';

angular.module('webrtc')
	.factory('Plataform', ['$window', function($window){ 
		var self = this;
		self.window = $window;
		self.navigator = $window.navigator;
		self.mimesType = {
			firefox: {
				audio: {mime: 'audio/ogg', ext: 'oga'},
				video:{mime: 'video/webm;codecs=vp8', ext: 'webm'}
			},chrome:{
				audio:{mime: 'audio/webm;codecs=opus', ext: 'opus'},
				video:{mime: 'video/webm;codecs=vp9', ext: 'webm'}
			}
		};

		self.getBrowser = function(){
			var nVer = self.navigator.appVersion;
			var nAgt = self.navigator.userAgent;
			var browserName  = self.navigator.appName;
			var fullVersion  = ''+parseFloat(self.navigator.appVersion);
			var majorVersion = parseInt(self.navigator.appVersion,10);
			var nameOffset,verOffset,ix;

			// In Opera, the true version is after "Opera" or after "Version"
			if ((verOffset=nAgt.indexOf("Opera"))!=-1) {
				browserName = "Opera";
				fullVersion = nAgt.substring(verOffset+6);

				if ((verOffset=nAgt.indexOf("Version"))!=-1){
					fullVersion = nAgt.substring(verOffset+8);
				}
			}
			// In MSIE, the true version is after "MSIE" in userAgent
			else if ((verOffset=nAgt.indexOf("MSIE"))!=-1) {
				browserName = "Microsoft Internet Explorer";
				fullVersion = nAgt.substring(verOffset+5);
			}
			// In Chrome, the true version is after "Chrome"
			else if ((verOffset=nAgt.indexOf("Chrome"))!=-1) {
				browserName = "Chrome";
				fullVersion = nAgt.substring(verOffset+7);
			}
			// In Safari, the true version is after "Safari" or after "Version"
			else if ((verOffset=nAgt.indexOf("Safari"))!=-1) {
				browserName = "Safari";
				fullVersion = nAgt.substring(verOffset+7);
				
				if ((verOffset=nAgt.indexOf("Version"))!=-1){
					fullVersion = nAgt.substring(verOffset+8);
				}
			}
			// In Firefox, the true version is after "Firefox"
			else if ((verOffset=nAgt.indexOf("Firefox"))!=-1) {
				browserName = "Firefox";
				fullVersion = nAgt.substring(verOffset+8);
			}
			// In most other browsers, "name/version" is at the end of userAgent
			else if ( (nameOffset=nAgt.lastIndexOf(' ')+1) < (verOffset=nAgt.lastIndexOf('/')) ){
				browserName = nAgt.substring(nameOffset,verOffset);
				fullVersion = nAgt.substring(verOffset+1);
				
				if (browserName.toLowerCase()==browserName.toUpperCase()) {
					browserName = navigator.appName;
				}
			}
			// trim the fullVersion string at semicolon/space if present
			if ((ix=fullVersion.indexOf(";"))!=-1){
				fullVersion=fullVersion.substring(0,ix);
			}

			if ((ix=fullVersion.indexOf(" "))!=-1)
				fullVersion=fullVersion.substring(0,ix);

			majorVersion = parseInt(''+fullVersion,10);
		
			if (isNaN(majorVersion)) {
				fullVersion  = ''+parseFloat(navigator.appVersion);
				majorVersion = parseInt(navigator.appVersion,10);
			}

			return {name: browserName, 
					version: fullVersion, 
					isMobile: self.isMobile(), 
					enabledCookies: self.cookieEnabled()
				};
		};

		self.cookieEnabled = function(){
			return (self.navigator.cookieEnabled) ? true : false;
		};

		self.isMobile = function(){
			return /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(self.navigator.appVersion);
		};

		self.getScreen = function(){
			var screen = self.window.screen;
			var screenSize = {};
			if (screen.width) {
	            screenSize.width = (screen.width) ? screen.width : '';
	            screenSize.height = (screen.height) ? screen.height : '';
	        }
	        return screenSize;
		};

		self.getOS = function(){
			var os = {};
			var osVersion = null;
	        var clientStrings = [
	            {s:'Windows 10', r:/(Windows 10.0|Windows NT 10.0)/},
	            {s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
	            {s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
	            {s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
	            {s:'Windows Vista', r:/Windows NT 6.0/},
	            {s:'Windows Server 2003', r:/Windows NT 5.2/},
	            {s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
	            {s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
	            {s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
	            {s:'Windows 98', r:/(Windows 98|Win98)/},
	            {s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
	            {s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
	            {s:'Windows CE', r:/Windows CE/},
	            {s:'Windows 3.11', r:/Win16/},
	            {s:'Android', r:/Android/},
	            {s:'Open BSD', r:/OpenBSD/},
	            {s:'Sun OS', r:/SunOS/},
	            {s:'Linux', r:/(Linux|X11)/},
	            {s:'iOS', r:/(iPhone|iPad|iPod)/},
	            {s:'Mac OS X', r:/Mac OS X/},
	            {s:'Mac OS', r:/(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
	            {s:'QNX', r:/QNX/},
	            {s:'UNIX', r:/UNIX/},
	            {s:'BeOS', r:/BeOS/},
	            {s:'OS/2', r:/OS\/2/},
	            {s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
	        ];

	        for (var id in clientStrings) {
	            var cs = clientStrings[id];
	            if (cs.r.test(self.navigator.userAgent)) {
	                os.name = cs.s;
	                break;
	            }
	        }

	        if (/Windows/.test(os)) {
	            os.version = /Windows (.*)/.exec(os.name)[1];
	            os.name = 'Windows';
	        }

	        switch (os.name) {
	            case 'Mac OS X':
	                os.version = /Mac OS X (10[\.\_\d]+)/.exec(self.navigator.userAgent)[1];
	                break;

	            case 'Android':
	                os.version = /Android ([\.\_\d]+)/.exec(self.navigator.userAgent)[1];
	                break;

	            case 'iOS':
	                os.version = /OS (\d+)_(\d+)_?(\d+)?/.exec(self.navigator.appVersion);
	                os.version = os.version[1] + '.' + os.version[2] + '.' + (os.version[3] | 0);
	                break;
	        }

	        return os;
		};

		self.getMimeType = function() {
			var browser = self.getBrowser().name.toLowerCase(); 
			return self.mimesType[browser];
		};

		return {
			getOS: function(){ return self.getOS(); },
			getBrowser: function() { return self.getBrowser(); },
			getLanguages: function (){ return self.navigator.languages; },
			getScreen: function(){ return self.getScreen(); },
			getMimeType: function(){ return self.getMimeType();},
		};
	}]);
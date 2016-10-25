angular.module('gui.menu').constant('MENU', {
	id: 'main-menu',
	name: 'Menu',
	route: '/',
	template: 'home.html', 
	items: [{
		id: 'video-call',
		name: 'Video Call',
		url: 'videocall',
		template :''
	},{
		id: 'mirroring',
		name: 'Mirroring',
		url: 'mirroring',
		template: ''
	},{
		id: 'video-record',
		name: 'Video Recording',
		url: 'videorecord',
		template: ''
	},{
		id: 'audio-record',
		name: 'Audio Recording',
		url: 'audiorecord',
		template: ''
	}]
})
angular.module('gui.menu').constant('MENU', {
	id: 'main-menu',
	name: 'Menu',
	route: '/',
	template: 'home.html', 
	items: [{
		id: 'features',
		name: 'Caracteristicas',
		url: 'features',
		template: ''
	},{
		id: 'video-call',
		name: 'Video Call',
		url: 'videocall',
		template :''
	},{
		id: 'video-call-record',
		name: 'Video Call Record',
		url: 'videocallrecord',
		template: ''
	},{
		id: 'video-record',
		name: 'Video Recording',
		url: 'video/record',
		template: ''
	},{
		id: 'audio-record',
		name: 'Audio Recording',
		url: 'audio/record',
		template: ''
	}]
})
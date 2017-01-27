angular.module('otisDemo').controller('mainController', ['App', function(App){
	var self = this;
	self.version = App.get('version');
	self.title = App.get('name') + " V " + self.version;
	self.logoUrl = App.get('logoUrl');
	self.author = App.get('author')[0];
	self.lastModification = App.get('lastModification');
}])
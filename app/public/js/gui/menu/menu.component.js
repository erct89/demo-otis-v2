angular.module('gui.menu').component('menu',{
	templateUrl: 'js/gui/menu/menu.template.html',
	controller: ['MENU',function (MENU) {
		var self = this;
		self.menu = MENU;
		self.menu.currentItem = '';
		self.menu.currentItemIndex = 0;
		
		self.changeCurrentItem = function(itemId,itemIndex){
			self.menu.currentItem = itemId;
			self.menu.currentItemIndex = itemIndex;
		};
	}]
});
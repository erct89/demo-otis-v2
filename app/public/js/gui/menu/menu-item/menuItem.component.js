angular.module('gui.menu').component('menuItem',{
	templateUrl: 'js/gui/menu/menu-item/menuItem.template.html',
	controller: [function(){
		var self = this;
		
		self.changeSelect= function(){
			self.onSelect({itemId: self.meItem.id, itemIndex: +self.meIndex});
		}
	}],
	bindings:{
		meItem:'<',
		meIndex:'@',
		meCurrentIndex:'@',
		onSelect:'&'
	}
});
LW.pages.conditions.init = function(params, $scope, $page) {

	$scope.cgu_version = __CGU_VERSION

	this.render()

	LW.setTitle(_.lang.get('conditions', 'title'))
}

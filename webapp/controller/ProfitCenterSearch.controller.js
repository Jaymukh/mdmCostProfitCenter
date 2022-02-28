sap.ui.define([
	"murphy/mdm/costProfit/mdmCostProfitCenter/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("murphy.mdm.costProfit.mdmCostProfitCenter.controller.ProfitCenterSearch", {

		onInit: function () {

		},
		
		onHandleVMSelect: function (oEvent) {
			var sSelectionKey = oEvent.getSource().getSelectionKey();
			this.clearFilterValues("idPCSearchFB");
			this.byId("idPCSearchFB").getFilterGroupItems().forEach(oItem => {
				oItem.setVisibleInFilterBar(oItem.getGroupName() === sSelectionKey ? true : false);
			});
		}
	});

});
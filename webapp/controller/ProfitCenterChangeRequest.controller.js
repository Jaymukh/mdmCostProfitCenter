sap.ui.define([
	"murphy/mdm/costProfit/mdmCostProfitCenter/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("murphy.mdm.costProfit.mdmCostProfitCenter.controller.ProfitCenterChangeRequest", {
		onInit: function () {

		},

		onSearchPCCR: function () {
			this.getAllPCChangeRequests(1);
		}
	});

});
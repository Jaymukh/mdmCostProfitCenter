sap.ui.define([
	"murphy/mdm/costProfit/mdmCostProfitCenter/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("murphy.mdm.costProfit.mdmCostProfitCenter.controller.App", {
		onInit: function () {
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		},

		onSideItemSelect: function (oEvent) {
			this.getRouter().getTargets().display(oEvent.getParameter("item").getKey());
		},

		onSideNavPress: function (oEvent) {
			let oAppModel = this.getModel("App");
			oAppModel.setProperty("/sideNavExp", !oAppModel.getProperty("/sideNavExp"));
		}
	});
});
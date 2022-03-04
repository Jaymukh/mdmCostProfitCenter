sap.ui.define([
	"murphy/mdm/costProfit/mdmCostProfitCenter/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("murphy.mdm.costProfit.mdmCostProfitCenter.controller.App", {
		onInit: function () {
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		},

		onSideItemSelect: function (oEvent) {
			let oAppModel = this.getModel("App"),
				sKey = oEvent.getParameter("item").getKey();
			this.getRouter().getTargets().display(sKey);
			oAppModel.setProperty("/appTitle", this.getText(sKey));

			switch (sKey) {
			case "CostCenterCreate":
				this.createCCEntity();
				break;
			}
		},

		onSideNavPress: function (oEvent) {
			let oAppModel = this.getModel("App");
			oAppModel.setProperty("/sideNavExp", !oAppModel.getProperty("/sideNavExp"));
		}
	});
});
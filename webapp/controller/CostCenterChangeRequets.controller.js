sap.ui.define([
	"murphy/mdm/costProfit/mdmCostProfitCenter/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("murphy.mdm.costProfit.mdmCostProfitCenter.controller.CostCenterChangeRequets", {

		onInit: function () {},

		onSearchCCCR: function () {
			this.getAllCCChangeRequests(1);
		},

		onSelectCRinTable: function (oEvent) {
			var oCRObject = oEvent.getParameter("listItem").getBindingContext("ChangeRequestsModel").getObject();
			this.getSidePanelDetails(oCRObject);
			var oToggleBtn = this.getView().byId("slideToggleButtonID");
			oToggleBtn.firePress({
				pressed: true
			});
			oToggleBtn.setPressed(true);
		},

		handleCRSideMenu: function (oEvent) {
			var bPressed = oEvent.getParameter("pressed");
			var oDynamicSideContent = this.getView().byId("idCCCRDynamicPage");
			oEvent.getSource().setIcon(bPressed ? "sap-icon://arrow-right" : "sap-icon://arrow-left");
			oDynamicSideContent.setShowSideContent(bPressed);
		}

	});

});
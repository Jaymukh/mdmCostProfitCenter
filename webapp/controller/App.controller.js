sap.ui.define([
	"murphy/mdm/costProfit/mdmCostProfitCenter/controller/BaseController",
	"sap/m/MessageToast"
], function (BaseController, MessageToast) {
	"use strict";

	return BaseController.extend("murphy.mdm.costProfit.mdmCostProfitCenter.controller.App", {
		onInit: function () {
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			this.getDropDownData();
		},

		onSideItemSelect: function (oEvent) {
			let oAppModel = this.getModel("App"),
				sKey = oEvent.getParameter("item").getKey();
			this.clearAllButtons();
			this.getRouter().getTargets().display(sKey);
			oAppModel.setProperty("/appTitle", this.getText(sKey));

			switch (sKey) {
			case "CostCenterCreate":
				this.createCCEntity();
				oAppModel.setProperty("/edit", true);
				oAppModel.setProperty("/saveButton", true);
				oAppModel.setProperty("/checkButton", true);
				oAppModel.setProperty("/previousPage", "");
				break;
			case "ProfitCenterCreate":
				this.createPCEntity();
				oAppModel.setProperty("/edit", true);
				oAppModel.setProperty("/saveButton", true);
				oAppModel.setProperty("/checkButton", true);
				oAppModel.setProperty("/previousPage", "");
				break;
			case "CostCenterChangeRequets":
				this.getAllCCChangeRequests();
				this.getCcCrStatistics();
				break;
			case "ProfitCenterChangeRequest":
				this.getAllPCChangeRequests();
				this.getPcCrStatistics();
				break;
			}
		},

		onSideNavPress: function (oEvent) {
			let oAppModel = this.getModel("App");
			oAppModel.setProperty("/sideNavExp", !oAppModel.getProperty("/sideNavExp"));
		},

		getDropDownData: function () {
			this.getModel("Dropdowns").setSizeLimit(100000);
			var aDropDowns = [
				"TAXONOMY", //Multiple values 
				"TSAD3", //Title,
				"T005K", //Tel Country Codes
				"T005", //Country
				"T005S", //Region
				"T002", //Language
				"T001", //Company Codes,
				"TKA05", //Cost Center Category
				"TFKB", //Functional Area
				"TCURC", //Currency Codes
				"FAGL_SEGM" //Segment 
			];
			aDropDowns.forEach(function (sValue) {
				this.getDropdownTableData(sValue);
			}, this);
		},

		getDropdownTableData: function (sValue) {
			$.ajax({
				url: "/mdmccpc/config-service/configurations/configuration/filter",
				type: "POST",
				contentType: "application/json",
				data: JSON.stringify({
					"configType": sValue,
					"currentPage": 1,
					"maxResults": 10000
				}),
				success: function (oData) {
					this.getModel("Dropdowns").setProperty("/" + sValue, oData.result.modelMap);
				}.bind(this)
			});
		},

		getCcCrStatistics: function () {
			var oChangeRequestsModel = this.getModel("ChangeRequestsModel"),
				oDataResources = this.getView().getModel("userManagementModel").getData(),
				objParam = {
					url: "/mdmccpc/change-request-service/changerequests/changerequest/statistics/get",
					hasPayload: true,
					type: "POST",
					data: {
						"userId": oDataResources.data.user_id,
						"changeRequestSearchDTO": {
							"entityType": "COST_CENTER"
						}
					}

				};

			this.serviceCall.handleServiceRequest(objParam).then(function (oData) {
				oChangeRequestsModel.setProperty("/Statistics", oData.result);
			});
		},

		getPcCrStatistics: function () {
			var oChangeRequestsModel = this.getModel("ChangeRequestsModel"),
				oDataResources = this.getView().getModel("userManagementModel").getData(),
				objParam = {
					url: "/mdmccpc/change-request-service/changerequests/changerequest/statistics/get",
					hasPayload: true,
					type: "POST",
					data: {
						"userId": oDataResources.data.user_id,
						"changeRequestSearchDTO": {
							"entityType": "PROFIT_CENTER"
						}
					}

				};

			this.serviceCall.handleServiceRequest(objParam).then(function (oData) {
				oChangeRequestsModel.setProperty("/Statistics", oData.result);
			});
		}

	});
});
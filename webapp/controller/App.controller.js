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
				break;
			case "ProfitCenterCreate":
				this.createPCEntity();
				break;
			case "CostCenterChangeRequets":
				this.getCcCrStatistics();
				break;
			case "ProfitCenterChangeRequest":
				this.getPcCrStatistics();
				break;
			}
		},

		createCCEntity: function () {
			var oCCModel = this.getModel("CostCenter"),
				oAppModel = this.getModel("App"),
				oChangeRequest = Object.assign({}, oAppModel.getProperty("/changeReq")),
				oCsks = Object.assign({}, oAppModel.getProperty("/csks")),
				oDate = new Date(),
				sDate = `${oDate.getFullYear()}-${("0" + (oDate.getMonth() + 1) ).slice(-2)}-${("0" + oDate.getDate()).slice(-2)}`;

			this.clearSidePanelDetails();
			this.getView().setBusy(true);
			this.createEntityId("COST_CENTER").then(oData => {
				var oBusinessEntity = oData.result.costCenterDTOs[0].businessEntityDTO;
				oCsks.entity_id = oBusinessEntity.entity_id;
				oCsks.datab = sDate;
				oChangeRequest.change_request_id = 50001;
				oChangeRequest.reason = "";
				oChangeRequest.timeCreation = `${("0" + oDate.getHours()).slice(-2)}:${("0" + oDate.getMinutes()).slice(-2)}`;
				oChangeRequest.dateCreation = sDate;
				oChangeRequest.change_request_by = oBusinessEntity.hasOwnProperty("created_by") ? oBusinessEntity.created_by : {};
				oChangeRequest.modified_by = oBusinessEntity.hasOwnProperty("modified_by") ? oBusinessEntity.modified_by : {};
				this.getModel("AuditLogModel").setProperty("/details/businessID", oBusinessEntity.entity_id);

				oCCModel.setData({
					workflowID: "",
					ChangeRequest: oChangeRequest,
					Csks: oCsks,
					Cskt: []
				});
				oAppModel.setProperty("/edit", true);
				oAppModel.setProperty("/crEdit", true);
				oAppModel.setProperty("/saveButton", true);
				oAppModel.setProperty("/checkButton", true);
				oAppModel.setProperty("/previousPage", "");
				this.getView().setBusy(false);
			}, oError => {
				MessageToast.show("Failed to create entity id, please try again");
				this.getView().setBusy(false);
			});
		},

		createPCEntity: function () {
			var oPCModel = this.getModel("ProfitCenter"),
				oAppModel = this.getModel("App"),
				oChangeRequest = Object.assign({}, oAppModel.getProperty("/changeReq")),
				oCepc = Object.assign({}, oAppModel.getProperty("/cepc")),
				oDate = new Date(),
				sDate = `${oDate.getFullYear()}-${("0" + (oDate.getMonth() + 1) ).slice(-2)}-${("0" + oDate.getDate()).slice(-2)}`;

			this.clearSidePanelDetails();
			this.getView().setBusy(true);
			this.createEntityId("PROFIT_CENTER").then(
				//Success Handler
				oData => {
					var oBusinessEntity = oData.result.profitCenterDTOs[0].businessEntityDTO;
					oCepc.entity_id = oBusinessEntity.entity_id;
					oCepc.datab = sDate;
					oCepc.ersda = sDate;
					oChangeRequest.change_request_id = 50001;
					oChangeRequest.reason = "";
					oChangeRequest.timeCreation = `${("0" + oDate.getHours()).slice(-2)}:${("0" + oDate.getMinutes()).slice(-2)}`;
					oChangeRequest.dateCreation = sDate;
					oChangeRequest.change_request_by = oBusinessEntity.hasOwnProperty("created_by") ? oBusinessEntity.created_by : {};
					oChangeRequest.modified_by = oBusinessEntity.hasOwnProperty("modified_by") ? oBusinessEntity.modified_by : {};
					this.getModel("AuditLogModel").setProperty("/details/businessID", oBusinessEntity.entity_id);

					oPCModel.setData({
						workflowID: "",
						ChangeRequest: oChangeRequest,
						Cepc: oCepc,
						Cepct: [],
						CepcBukrs: [],
						Cepc_bukrs: Object.assign({}, oAppModel.getProperty("/cepc_bukrs"))
					});
					oAppModel.setProperty("/edit", true);
					oAppModel.setProperty("/crEdit", true);
					oAppModel.setProperty("/saveButton", true);
					oAppModel.setProperty("/checkButton", true);
					oAppModel.setProperty("/previousPage", "");
					this.getView().setBusy(false);
				},
				//Error Handler 
				oError => {
					MessageToast.show("Failed to create entity id, please try again");
					this.getView().setBusy(false);
				});
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
				"TKT05", //Cost Center Category
				"vw_TFKB", //Functional Area
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
				objParam = {
					url: "/mdmccpc/change-request-service/changerequests/changerequest/statistics/get",
					hasPayload: true,
					type: "POST",
					data: {
						"userId": this.getModel("userManagementModel").getProperty("/data/user_id"),
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
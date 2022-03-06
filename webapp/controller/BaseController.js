sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"murphy/mdm/costProfit/mdmCostProfitCenter/shared/serviceCall",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast"
], function (Controller, ServiceCall, Fragment, MessageToast) {
	"use strict";

	return Controller.extend("murphy.mdm.costProfit.mdmCostProfitCenter.controller.BaseController", {

		constructor: function () {
			this.serviceCall = new ServiceCall();
		},

		getModel: function (sModelName) {
			return this.getOwnerComponent().getModel(sModelName);
		},

		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		getText: function (sText, aArgs = []) {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sText, aArgs);
		},

		getFilterValues: function (sFilterBarId) {
			var oFilterValues = {};
			this.byId(sFilterBarId).getAllFilterItems().forEach(oFilterItem => {
				var oControl = oFilterItem.getControl();
				switch (oControl.getMetadata().getName()) {
				case "sap.m.Input":
					oFilterValues[oFilterItem.getName()] = oControl.getValue();
					break;
				case "sap.m.ComboBox":
					oFilterValues[oFilterItem.getName()] = oControl.getSelectedKey();
					break;
				}
			});
			return oFilterValues;
		},

		clearFilterValues: function (sFilterBarId) {
			this.byId(sFilterBarId).getAllFilterItems().forEach(oFilterItem => {
				var oControl = oFilterItem.getControl();
				switch (oControl.getMetadata().getName()) {
				case "sap.m.Input":
					oControl.setValue("");
					break;
				case "sap.m.ComboBox":
					oControl.setSelectedKey("");
					break;
				}
			});
		},

		createCCEntity: function () {
			var oCCModel = this.getModel("CostCenter"),
				oAppModel = this.getModel("App"),
				oChangeRequest = Object.assign({}, oAppModel.getProperty("/changeReq")),
				oCsks = Object.assign({}, oAppModel.getProperty("/csks")),
				sUserId = this.getView().getModel("userManagementModel").getProperty("/data/user_id"),
				oDate = new Date(),
				sDate = `${oDate.getFullYear()}-${("0" + (oDate.getMonth() + 1) ).slice(-2)}-${("0" + oDate.getDate()).slice(-2)}`;

			var objParam = {
				url: "/murphyCustom/entity-service/entities/entity/create",
				hasPayload: true,
				type: "POST",
				data: {
					"entityType": "COST_CENTER",
					"parentDTO": {
						"customData": {
							"business_entity": {
								"entity_type_id": "41004",
								"created_by": sUserId,
								"modified_by": sUserId,
								"is_draft": true
							}
						}
					}
				}
			};

			this.serviceCall.handleServiceRequest(objParam).then(
				//Success Handler
				oData => {
					var oBusinessEntity = oData.result.customerDTOs[0].businessEntityDTO;
					oCsks.entity_id = oBusinessEntity.entity_id;
					oChangeRequest.change_request_id = 50001;
					oChangeRequest.reason = "";
					oChangeRequest.timeCreation = `${("0" + oDate.getHours()).slice(-2)}-${("0" + oDate.getMinutes()).slice(-2)}`;
					oChangeRequest.dateCreation = sDate;
					oChangeRequest.change_request_by = oBusinessEntity.hasOwnProperty("created_by") ? oBusinessEntity.created_by : {};
					oChangeRequest.modified_by = oBusinessEntity.hasOwnProperty("modified_by") ? oBusinessEntity.modified_by : {};

					oCCModel.setData({
						ChangeRequest: oChangeRequest,
						Csks: oCsks,
						Cskt: []
					});
				},
				//Error Handler 
				oError => {

				});
		},

		createPCEntity: function () {
			var oPCModel = this.getModel("ProfitCenter"),
				oAppModel = this.getModel("App"),
				oChangeRequest = Object.assign({}, oAppModel.getProperty("/changeReq")),
				oCepc = Object.assign({}, oAppModel.getProperty("/cepc")),
				sUserId = this.getView().getModel("userManagementModel").getProperty("/data/user_id"),
				oDate = new Date(),
				sDate = `${oDate.getFullYear()}-${("0" + (oDate.getMonth() + 1) ).slice(-2)}-${("0" + oDate.getDate()).slice(-2)}`;

			oPCModel.setData({
				ChangeRequest: oChangeRequest,
				Cepc: oCepc,
				Cepct: []
			});
		}

	});
});
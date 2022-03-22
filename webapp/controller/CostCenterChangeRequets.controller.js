sap.ui.define([
	"murphy/mdm/costProfit/mdmCostProfitCenter/controller/BaseController",
	"sap/m/MessageToast"
], function (BaseController, MessageToast) {
	"use strict";

	return BaseController.extend("murphy.mdm.costProfit.mdmCostProfitCenter.controller.CostCenterChangeRequets", {

		onInit: function () {
			this.getAllCCChangeRequests(1);
		},

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
		},

		onCCCRPress: function (oEvent) {
			var oCRObject = oEvent.getSource().getBindingContext("ChangeRequestsModel").getObject(),
				oAppModel = this.getModel("App"),
				oCCModel = this.getModel("CostCenter"),
				oCsks = Object.assign({}, oAppModel.getProperty("/csks")),
				aCskt = [],
				oChangeRequest = Object.assign({}, oAppModel.getProperty("/changeReq")),
				sWorkFlowId = "",
				oEntityParam = {
					url: "/mdmccpc/entity-service/entities/entity/get",
					type: "POST",
					hasPayload: true,
					data: {
						"entitySearchType": "CC_GET_BY_ENTITY_ID",
						"entityType": "COST_CENTRE",
						"parentDTO": {
							"customData": {
								"business_entity": {
									"entity_id": oCRObject.crDTO.entity_id
								}
							}
						}
					}
				};
			this.getView().setBusy(true);
			this.serviceCall.handleServiceRequest(oEntityParam).then(oData => {
				oData.result.costCenterDTOs.forEach(oItem => {
					if (oItem.hasOwnProperty("costCenterCsksDTO") && oItem.costCenterCsksDTO) {
						oCsks = oItem.costCenterCsksDTO;
					}

					if (oItem.hasOwnProperty("costCenterCsktDTOs") && oItem.costCenterCsktDTOs) {
						aCskt = oItem.costCenterCsktDTOs;
					}

					if (oItem.hasOwnProperty("changeRequestDTO") && oItem.changeRequestDTO) {
						oChangeRequest.desc = oItem.changeRequestDTO.change_request_desc;
						oChangeRequest.priority = oItem.changeRequestDTO.change_request_priority_id;
						oChangeRequest.dueDate = oItem.changeRequestDTO.change_request_due_date;
						oChangeRequest.reason = oItem.changeRequestDTO.change_request_reason_id;
						oChangeRequest.status = "";
						oChangeRequest.createdBy = oItem.changeRequestDTO.change_request_by;
						oChangeRequest.currWrkItem = "";
						oChangeRequest.timeCreation = oItem.changeRequestDTO.change_request_date;
						oChangeRequest.dateCreation = oItem.changeRequestDTO.change_request_date;
						oChangeRequest.change_request_by = oItem.changeRequestDTO.change_request_by;
						oChangeRequest.modified_by = oItem.changeRequestDTO.modified_by;
						sWorkFlowId = oItem.changeRequestDTO.workflow_task_id;
					}
				});

				this.clearAllButtons();
				oAppModel.setProperty("/editButton", true);
				oAppModel.setProperty("/appTitle", "Create Cost Center");

				oCCModel.setData({
					workflowID: sWorkFlowId,
					ChangeRequest: oChangeRequest,
					Csks: oCsks,
					Cskt: aCskt
				});
				this.getRouter().getTargets().display("CostCenterCreate");
				this.getView().setBusy(false);
			}, oError => {
				this.getView().setBusy(false);
				MessageToast.show("Failed to fetch CR Details, please try again later");
			});
		},

	});

});
sap.ui.define([
	"murphy/mdm/costProfit/mdmCostProfitCenter/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function (BaseController, Fragment, MessageToast, MessageBox) {
	"use strict";

	return BaseController.extend("murphy.mdm.costProfit.mdmCostProfitCenter.controller.CostCenterSearch", {

		onInit: function () {
			var oParameters = {
				sPageNo: 1
			};
			this.costCenterSearch(oParameters);
		},

		onHandleVMSelect: function (oEvent) {
			var sSelectionKey = oEvent.getSource().getSelectionKey();
			this.clearFilterValues("idCCSearchFB");
			this.byId("idCCSearchFB").getFilterGroupItems().forEach(oItem => {
				oItem.setVisibleInFilterBar(oItem.getGroupName() === sSelectionKey ? true : false);
			});
		},

		costCenterSearch: function (oParameters) {
			var oSearchModel = this.getModel("SearchCCModel"),
				iPageNo = oParameters.hasOwnProperty("sPageNo") ? oParameters.sPageNo : 1;
			oSearchModel.setProperty("/LeftEnabled", false);
			oSearchModel.setProperty("/RightEnabled", false);

			//Get filter details
			var oFilterValues = this.getFilterValues("idCCSearchFB"),
				sFilterBy = this.byId("idCCVm").getSelectionKey(),
				oObjectParam = {
					"entitySearchType": "GET_BY_COST_CENTER_FILTERS",
					"entityType": "COST_CENTER",
					"costCenterSearchDTO": {},
					"currentPage": iPageNo
				};

			oFilterValues.costCenterSearchType = sFilterBy === "*standard*" ? "SEARCH_BY_ADDRESS" : "SEARCH_BY_GEN_DETAIL";
			oObjectParam.costCenterSearchDTO = oFilterValues;

			var objParam = {
				url: "/mdmccpc/entity-service/entities/entity/get",
				type: "POST",
				hasPayload: true,
				data: oObjectParam
			};

			this.serviceCall.handleServiceRequest(objParam).then(function (oData) {
				var aResultDataArr = oData.result.costCenterDTOs,
					aPageJson = [];
				oData.result.totalRecords = aResultDataArr[0].totalCount;

				if (aResultDataArr[0].currentPage === 1) {
					//Calculate no of pages available 
					for (var i = 0; i < aResultDataArr[0].totalPageCount; i++) {
						aPageJson.push({
							key: i + 1,
							text: i + 1
						});
					}
					oSearchModel.setProperty("/PageData", aPageJson);
				}
				oSearchModel.setProperty("/SelectedPageKey", aResultDataArr[0].currentPage);
				oSearchModel.setProperty("/RightEnabled", aResultDataArr[0].totalPageCount > aResultDataArr[0].currentPage ? true : false);
				oSearchModel.setProperty("/LeftEnabled", aResultDataArr[0].currentPage > 1 ? true : false);
				oSearchModel.setProperty("/CostCenters", aResultDataArr);
			});
		},

		onCostCenterAction: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext("SearchCCModel"),
				oButton = oEvent.getSource();
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: this.getView().getId(),
					name: "murphy.mdm.costProfit.mdmCostProfitCenter.fragments.CCActions",
					controller: this
				}).then(oPopover => {
					this.getView().addDependent(oPopover);
					return oPopover;
				});
			}

			this._pPopover.then(function (oPopover) {
				oPopover.bindElement({
					path: oContext.getPath(),
					model: "SearchCCModel"
				});
				oPopover.openBy(oButton);
			});
		},

		onPreviewCC: function (oEvent) {
			var oCC = oEvent.getSource().getBindingContext("SearchCCModel").getObject();
			this.navToCCPage(oCC.costCenterCsksDTO.kostl, "PREVIEW");
		},

		onEditCC: function (oEvent) {
			var oCC = oEvent.getSource().getBindingContext("SearchCCModel").getObject();
			this.navToCCPage(oCC.costCenterCsksDTO.kostl, "EDIT");
			this.closeSearchAction();
		},

		onCopyCC: function (oEvent) {
			var oCC = oEvent.getSource().getBindingContext("SearchCCModel").getObject();
			this.navToCCPage(oCC.costCenterCsksDTO.kostl, "COPY");
			this.closeSearchAction();
		},

		onBlockCC: function (oEvent) {
			var oCC = oEvent.getSource().getBindingContext("SearchCCModel").getObject();
			MessageBox.confirm(
				`Are you sure, you wan to block Cost Center ${oCC.costCenterCsksDTO.kostl} - ${oCC.costCenterCsksDTO.name1} ?`, {
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
					onClose: sAction => {
						if (sAction === "OK") {
							this.navToCCPage(oCC.costCenterCsksDTO.kostl, "BLOCK");
						}
					}
				});
			this.closeSearchAction();
		},

		onDeleteCC: function (oEvent) {
			var oCC = oEvent.getSource().getBindingContext("SearchCCModel").getObject();
			MessageBox.confirm(
				`Are you sure, you wan to delete Cost Center ${oCC.costCenterCsksDTO.kostl} - ${oCC.costCenterCsksDTO.name1} ?`, {
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
					onClose: sAction => {
						if (sAction === "OK") {
							this.navToCCPage(oCC.costCenterCsksDTO.kostl, "DELETE");
						}
					}
				});
			this.closeSearchAction();
		},

		closeSearchAction: function () {
			this._pPopover.then(oPopover => {
				oPopover.close();
			});
		},

		navToCCPage: function (sCostCenter, sAction) {
			let oAppModel = this.getModel("App"),
				oCCModel = this.getModel("CostCenter"),
				oChangeRequest = Object.assign({}, oAppModel.getProperty("/changeReq")),
				oCsks = Object.assign({}, oAppModel.getProperty("/csks")),
				aCskt = [],
				oDate = new Date(),
				sMonth = oDate.getMonth() + 1,
				sMinutes = oDate.getMinutes();

			this.clearAllButtons();
			this.getView().setBusy(true);
			this.getCostCenterDetails(sCostCenter)
				.then(oData => {
					oData.result.costCenterDTOs.forEach(oItem => {
						if (oItem.hasOwnProperty("costCenterCsksDTO") && oItem.costCenterCsksDTO) {
							oCsks = oItem.costCenterCsksDTO;
						}

						if (oItem.hasOwnProperty("costCenterCsktDTOs") && oItem.costCenterCsktDTOs) {
							aCskt = oItem.costCenterCsktDTOs;
						}
					});
					switch (sAction) {
					case "EDIT":
					case "COPY":
						oChangeRequest.change_request_id = sAction === "COPY" ? 50003 : 50002;
						oAppModel.setProperty("/saveButton", true);
						oAppModel.setProperty("/checkButton", true);
						oAppModel.setProperty("/edit", true);
						oAppModel.setProperty("/crEdit", true);
						oAppModel.setProperty("/appTitle", "Create Cost Center");
						if (sAction === "COPY") {
							oCsks.kostl = "";
						}
						break;
					case "BLOCK":
						oChangeRequest.change_request_id = 50004;
						oAppModel.setProperty("/saveButton", true);
						oAppModel.setProperty("/checkButton", true);
						oAppModel.setProperty("/edit", false);
						oAppModel.setProperty("/crEdit", true);
						oAppModel.setProperty("/appTitle", "Block Cost Center");
						break;
					case "DELETE":
						oChangeRequest.change_request_id = 50005;
						oAppModel.setProperty("/saveButton", true);
						oAppModel.setProperty("/checkButton", true);
						oAppModel.setProperty("/edit", false);
						oAppModel.setProperty("/crEdit", true);
						oAppModel.setProperty("/appTitle", "Delete Cost Center");
						break;
					case "PREVIEW":
						oAppModel.setProperty("/editButton", true);
						oAppModel.setProperty("/appTitle", "Create Cost Center");
						oAppModel.setProperty("/previousPage", "ALL_CC");
						oAppModel.setProperty("/erpPreview", true);
					}

					oCCModel.setData({
						workflowID: "",
						ChangeRequest: {},
						Csks: oCsks,
						Cskt: aCskt
					});
					this.getRouter().getTargets().display("CostCenterCreate");
					this.getView().setBusy(false);

					//Create Entity ID for Cost Center
					if (sAction !== "PREVIEW") {
						this.getView().setBusy(true);
						this.createEntityId("COST_CENTER").then(oData => {
							var oBusinessEntity = oData.result.costCenterDTOs[0].businessEntityDTO,
								sEntityId = oBusinessEntity.entity_id;
							oChangeRequest.reason = "";
							oChangeRequest.timeCreation = oDate.getHours() + ":" + (sMinutes < 10 ? "0" + sMinutes : sMinutes);
							oChangeRequest.dateCreation = oDate.getFullYear() + "-" + (sMonth < 10 ? "0" + sMonth : sMonth) + "-" + oDate.getDate();
							oChangeRequest.change_request_by = oBusinessEntity.hasOwnProperty("created_by") ? oBusinessEntity.created_by : {};
							oChangeRequest.modified_by = oBusinessEntity.hasOwnProperty("modified_by") ? oBusinessEntity.modified_by : {};
							oCsks.entity_id = sEntityId;

							oCCModel.setData({
								workflowID: "",
								ChangeRequest: oChangeRequest,
								Csks: oCsks,
								Cskt: aCskt
							});
							this.getView().setBusy(false);
						}, oError => {
							this.getView().setBusy(false);
							MessageToast.show("Entity ID not created. Please try after some time");
							this.getRouter().getTargets().display("CostCenterSearch");
							oAppModel.setProperty("/appTitle", "Search Cost Center");
						});
					}
				}, oError => {
					MessageToast.show("Failed to fetch Cost Center Details, please try again");
					this.getView().setBusy(false);
				});
		}

	});

});
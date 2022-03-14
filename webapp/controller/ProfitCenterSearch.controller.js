sap.ui.define([
	"murphy/mdm/costProfit/mdmCostProfitCenter/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function (BaseController, Fragment, MessageToast, MessageBox) {
	"use strict";

	return BaseController.extend("murphy.mdm.costProfit.mdmCostProfitCenter.controller.ProfitCenterSearch", {

		onInit: function () {
			var oParameters = {
				sPageNo: 1
			};
			this.profitCenterSearch(oParameters);
		},

		onHandleVMSelect: function (oEvent) {
			var sSelectionKey = oEvent.getSource().getSelectionKey();
			this.clearFilterValues("idPCSearchFB");
			this.byId("idPCSearchFB").getFilterGroupItems().forEach(oItem => {
				oItem.setVisibleInFilterBar(oItem.getGroupName() === sSelectionKey ? true : false);
			});
		},

		profitCenterSearch: function (oParameters) {
			var oSearchModel = this.getModel("SearchPCModel"),
				iPageNo = oParameters.hasOwnProperty("sPageNo") ? oParameters.sPageNo : 1;
			oSearchModel.setProperty("/LeftEnabled", false);
			oSearchModel.setProperty("/RightEnabled", false);

			//Get filter details
			var oFilterValues = this.getFilterValues("idPCSearchFB"),
				sFilterBy = this.byId("idPCVm").getSelectionKey(),
				oObjectParam = {
					"entitySearchType": "GET_BY_PROFIT_CENTER_FILTERS",
					"entityType": "PROFIT_CENTER",
					"profitCenterSearchDTO": {},
					"currentPage": iPageNo
				};

			oFilterValues.profitCenterSearchType = sFilterBy === "*standard*" ? "SEARCH_BY_ADDRESS" : "SEARCH_BY_GEN_DETAIL";
			oObjectParam.profitCenterSearchDTO = oFilterValues;

			var objParam = {
				url: "/mdmccpc/entity-service/entities/entity/get",
				type: "POST",
				hasPayload: true,
				data: oObjectParam
			};

			this.serviceCall.handleServiceRequest(objParam).then(function (oData) {
				var aResultDataArr = oData.result.profitCenterDTOs,
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
				oSearchModel.setProperty("/ProfitCenters", aResultDataArr);
			});
		},

		onProfitCenterAction: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext("SearchPCModel"),
				oButton = oEvent.getSource();
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: this.getView().getId(),
					name: "murphy.mdm.costProfit.mdmCostProfitCenter.fragments.PCActions",
					controller: this
				}).then(oPopover => {
					this.getView().addDependent(oPopover);
					return oPopover;
				});
			}

			this._pPopover.then(function (oPopover) {
				oPopover.bindElement({
					path: oContext.getPath(),
					model: "SearchPCModel"
				});
				oPopover.openBy(oButton);
			});
		},

		onPreviewPC: function (oEvent) {
			var oPC = oEvent.getSource().getBindingContext("SearchPCModel").getObject();
			this.navToPCPage(oPC.profitCenterCepcDTO.prctr, "PREVIEW");
		},

		onEditPC: function (oEvent) {
			var oPC = oEvent.getSource().getBindingContext("SearchPCModel").getObject();
			this.navToPCPage(oPC.profitCenterCepcDTO.prctr, "EDIT");
			this.closeSearchAction();
		},

		onCopyPC: function (oEvent) {
			var oPC = oEvent.getSource().getBindingContext("SearchPCModel").getObject();
			this.navToPCPage(oPC.profitCenterCepcDTO.prctr, "COPY");
			this.closeSearchAction();
		},

		onBlockPC: function (oEvent) {
			var oPC = oEvent.getSource().getBindingContext("SearchPCModel").getObject();
			MessageBox.confirm(
				`Are you sure, you wan to block Profit Center ${oPC.profitCenterCepcDTO.prctr} - ${oPC.profitCenterCepcDTO.name1} ?`, {
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
					onClose: sAction => {
						if (sAction === "OK") {
							this.navToPCPage(oPC.profitCenterCepcDTO.prctr, "BLOCK");
						}
					}
				});
			this.closeSearchAction();
		},

		onDeletePC: function (oEvent) {
			var oPC = oEvent.getSource().getBindingContext("SearchPCModel").getObject();
			MessageBox.confirm(
				`Are you sure, you wan to delete Profit Center ${oPC.profitCenterCepcDTO.prctr} - ${oPC.profitCenterCepcDTO.name1} ?`, {
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
					onClose: sAction => {
						if (sAction === "OK") {
							this.navToPCPage(oPC.profitCenterCepcDTO.prctr, "DELETE");
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

		navToPCPage: function (sProfitCenter, sAction) {
			let oAppModel = this.getModel("App"),
				oPCModel = this.getModel("ProfitCenter"),
				oCepc = Object.assign({}, oAppModel.getProperty("/cepc")),
				aCepct = [],
				oChangeRequest = Object.assign({}, oAppModel.getProperty("/changeReq")),
				oDate = new Date(),
				sDate = `${oDate.getFullYear()}-${("0" + (oDate.getMonth() + 1) ).slice(-2)}-${("0" + oDate.getDate()).slice(-2)}`;

			oCepc.datab = sDate;
			oCepc.ersda = sDate;
			this.clearAllButtons();
			this.getView().setBusy(true);
			this.getProfitCenterDetails(sProfitCenter)
				.then(oData => {
					oData.result.profitCenterDTOs.forEach(oItem => {
						if (oItem.hasOwnProperty("profitCenterCepcDTO") && oItem.profitCenterCepcDTO) {
							oCepc = oItem.profitCenterCepcDTO;
						}
						if (oItem.hasOwnProperty("profitCenterCepctDTOs") && oItem.profitCenterCepctDTOs) {
							aCepct = oItem.profitCenterCepctDTOs;
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
						oAppModel.setProperty("/appTitle", "Create Profit Center");
						if (sAction === "COPY") {
							oCepc.prctr = "";
						}
						break;
					case "BLOCK":
						oChangeRequest.change_request_id = 50004;
						oAppModel.setProperty("/saveButton", true);
						oAppModel.setProperty("/checkButton", true);
						oAppModel.setProperty("/edit", false);
						oAppModel.setProperty("/crEdit", true);
						oAppModel.setProperty("/appTitle", "Block Profit Center");
						break;
					case "DELETE":
						oChangeRequest.change_request_id = 50005;
						oAppModel.setProperty("/saveButton", true);
						oAppModel.setProperty("/checkButton", true);
						oAppModel.setProperty("/edit", false);
						oAppModel.setProperty("/crEdit", true);
						oAppModel.setProperty("/appTitle", "Delete Profit Center");
						break;
					case "PREVIEW":
						oAppModel.setProperty("/editButton", true);
						oAppModel.setProperty("/appTitle", "Create Profit Center");
						oAppModel.setProperty("/previousPage", "ALL_PC");
						oAppModel.setProperty("/erpPreview", true);
					}

					oPCModel.setData({
						workflowID: "",
						ChangeRequest: {},
						Cepc: oCepc,
						Cepct: aCepct,
						CepcBukrs: [],
						Cepc_bukrs: Object.assign({}, oAppModel.getProperty("/cepc_bukrs"))
					});
					this.getRouter().getTargets().display("ProfitCenterCreate");
					this.getView().setBusy(false);

					//Create Entity ID for Cost Center
					if (sAction !== "PREVIEW") {
						this.getView().setBusy(true);
						this.createEntityId("PROFIT_CENTER").then(oData => {
							var oBusinessEntity = oData.result.profitCenterDTOs[0].businessEntityDTO,
								sEntityId = oBusinessEntity.entity_id;

							oChangeRequest.reason = "";
							oChangeRequest.timeCreation = `${("0" + oDate.getMinutes()).slice(-2)}:${("0" + oDate.getHours()).slice(-2)}`;
							oChangeRequest.dateCreation = sDate;
							oChangeRequest.change_request_by = oBusinessEntity.hasOwnProperty("created_by") ? oBusinessEntity.created_by : {};
							oChangeRequest.modified_by = oBusinessEntity.hasOwnProperty("modified_by") ? oBusinessEntity.modified_by : {};
							oCepc.entity_id = sEntityId;

							oPCModel.setData({
								workflowID: "",
								ChangeRequest: oChangeRequest,
								Cepc: oCepc,
								Cepct: aCepct,
								CepcBukrs: [],
								Cepc_bukrs: Object.assign({}, oAppModel.getProperty("/cepc_bukrs"))
							});
							this.getView().setBusy(false);
						}, oError => {
							this.getView().setBusy(false);
							MessageToast.show("Entity ID not created. Please try after some time");
							this.getRouter().getTargets().display("ProfitCenterSearch");
							oAppModel.setProperty("/appTitle", "Search Profit Center");
						});
					}
				}, oError => {
					MessageToast.show("Failed to fetch Profit Center Details, please try again");
					this.getView().setBusy(false);
				});
		}

	});

});
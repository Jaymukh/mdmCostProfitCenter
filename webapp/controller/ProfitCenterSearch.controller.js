sap.ui.define([
	"murphy/mdm/costProfit/mdmCostProfitCenter/controller/BaseController"
], function (BaseController) {
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
			var oFilterValues = this.getFilterValues("idCCSearchFB"),
				sFilterBy = this.byId("idCCVm").getSelectionKey(),
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
				oSearchModel.setProperty("/ProfitCenters", oData.result);
			});
		}
	});

});
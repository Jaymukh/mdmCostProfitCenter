sap.ui.define([
	"murphy/mdm/costProfit/mdmCostProfitCenter/controller/BaseController"
], function (BaseController) {
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
					"customerSearchDTO": {},
					"currentPage": iPageNo
				};

			oFilterValues.customerSearchType = sFilterBy === "*standard*" ? "SEARCH_BY_ADDRESS" : "SEARCH_BY_BANK_DETAILS";
			oObjectParam.customerSearchDTO = oFilterValues;

			var objParam = {
				url: "/mdmccpc/entity-service/entities/entity/get",
				type: "POST",
				hasPayload: true,
				data: oObjectParam
			};

			this.serviceCall.handleServiceRequest(objParam).then(function (oData) {
				var aResultDataArr = oData.result.customerDTOs,
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
				oSearchModel.setProperty("/SearchAllModelData", oData.result);
			});
		},

	});

});
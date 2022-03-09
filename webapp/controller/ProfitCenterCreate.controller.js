sap.ui.define([
	"murphy/mdm/costProfit/mdmCostProfitCenter/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/List",
	"sap/m/TextArea",
	"sap/m/StandardListItem"
], function (BaseController, Filter, FilterOperator, MessageToast, Dialog, Button, List, TextArea, StandardListItem) {
	"use strict";

	return BaseController.extend("murphy.mdm.costProfit.mdmCostProfitCenter.controller.ProfitCenterCreate", {

		onInit: function () {

		},

		onAddDescription: function (oEvent) {
			var oProfitCenterModel = this.getModel("ProfitCenter"),
				oProfitCenter = oProfitCenterModel.getData(),
				oCepct = Object.assign({}, this.getModel("App").getProperty("/cepct"));
			oProfitCenter.Cepct.push(oCepct);
			oCepct.entity_id = oProfitCenter.Cepc.entity_id;
			oProfitCenterModel.setData(oProfitCenter);
		},

		onDeleteDesc: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext("ProfitCenter").getPath(),
				oPCModel = this.getModel("ProfitCenter"),
				oPCData = oPCModel.getData(),
				iIndex = Number(sPath.replace("/Cepct/", ""));
			if (iIndex > -1) {
				oPCData.Cepct.splice(iIndex, 1);
				oPCModel.setData(oPCData);
			}
		},

		onChangeName: function (oEvent) {
			var sName = oEvent.getSource().getValue(),
				oPCModel = this.getModel("ProfitCenter"),
				oProfitCenter = oPCModel.getData(),
				oCepct = Object.assign({}, this.getModel("App").getProperty("/cepct"));

			var oEnCepct = oProfitCenter.Cepct.find(oItem => {
				return oItem.spras === "E";
			});

			if (oEnCepct) {
				oEnCepct.ktext = sName;
			} else {
				oCepct.entity_id = oProfitCenter.Cepc.entity_id;
				oCepct.ktext = sName;
				oCepct.spras = "E";
				oProfitCenter.Cepct.push(oCepct);
			}
			oPCModel.setData(oProfitCenter);
		},

		onChangeMText: function (oEvent) {
			var sName = oEvent.getSource().getValue(),
				oPCModel = this.getModel("ProfitCenter"),
				oProfitCenter = oPCModel.getData(),
				oCepct = Object.assign({}, this.getModel("App").getProperty("/cepct"));

			var oEnCepct = oProfitCenter.Cepct.find(oItem => {
				return oItem.spras === "E";
			});

			if (oEnCepct) {
				oEnCepct.ltext = sName;
			} else {
				oCepct.entity_id = oProfitCenter.Cepc.entity_id;
				oCepct.ltext = sName;
				oCepct.spras = "E";
				oProfitCenter.Cepct.push(oCepct);
			}
			oPCModel.setData(oProfitCenter);
		},

		onChangeCountry: function (oEvent) {
			this.byId("idPCRegion").getBinding("items").filter([
				new Filter("land1", FilterOperator.EQ, this.getModel("ProfitCenter").getProperty(
					"/Cepc/land1"))
			]);
		}
	});

});
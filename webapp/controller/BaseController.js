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

	});
});
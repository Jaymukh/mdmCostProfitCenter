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

		onDeleteComp: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext("ProfitCenter").getPath(),
				oPCModel = this.getModel("ProfitCenter"),
				oPCData = oPCModel.getData(),
				iIndex = Number(sPath.replace("/CepcBukrs/", ""));
			if (iIndex > -1) {
				oPCData.CepcBukrs.splice(iIndex, 1);
				oPCModel.setData(oPCData);
			}
		},

		onShowComp: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext("ProfitCenter").getPath(),
				oPCModel = this.getModel("ProfitCenter"),
				oPCData = oPCModel.getData(),
				iIndex = Number(sPath.replace("/CepcBukrs/", ""));
			if (iIndex > -1) {
				var oCepcBukrs = oPCData.CepcBukrs[iIndex];
				oPCData.Cepc_bukrs = oCepcBukrs;
				oPCData.CepcBukrs.splice(iIndex, 1);
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
		},

		onSaveCR: function () {
			if (this.onCheckCR()) {
				var oPCModel = this.getModel("ProfitCenter"),
					oPCData = oPCModel.getData(),
					oAppModel = this.getModel("App"),
					oFormData = {
						"entityType": "PROFIT_CENTRE",
						"parentDTO": {
							"customData": {
								"fin_cepc": oPCData.Cepc,
								"fin_cepct": {},
								"fin_cepc_bukrs": {}
							}
						}
					};

				oPCData.Cepct.forEach((oItem, iIndex) => {
					oItem.kokrs = oPCData.Cepc.kokrs;
					oItem.kostl = oPCData.Cepc.kostl;
					oFormData.parentDTO.customData.fin_cepct[iIndex + 1] = oItem;
				});

				oPCData.CepcBukrs.forEach((oItem, iIndex) => {
					oFormData.parentDTO.customData.fin_cepc_bukrs[iIndex + 1] = oItem;
				});

				var oObjParamCreate = {
					url: "/mdmccpc/entity-service/entities/entity/update",
					hasPayload: true,
					data: oFormData,
					type: "POST"
				};

				this.getView().setBusy(true);
				this.serviceCall.handleServiceRequest(oObjParamCreate).then(
					oDataResp => {
						//Success Handle after save CR
						this.getView().setBusy(false);
						this.getAllCommentsForCR(oFormData.parentDTO.customData.fin_cepc.entity_id);
						this.getAllDocumentsForCR(oFormData.parentDTO.customData.fin_cepc.entity_id);
						this.getAuditLogsForCR(oFormData.parentDTO.customData.fin_cepc.entity_id);
						this.clearAllButtons();
						oAppModel.setProperty("/edit", false);
						oAppModel.setProperty("/submitButton", true);
						oAppModel.setProperty("/editButton", true);
					},
					oError => {
						//Error Hanlder while saving CR
						this.getView().setBusy(false);
						MessageToast.show("Error In Creating Draft Version");
					});
			}
		},

		onEditClick: function () {
			var oPCModel = this.getModel("ProfitCenter"),
				oAppModel = this.getModel("App"),
				oChangeRequest = Object.assign({}, oAppModel.getProperty("/changeReq")),
				oPCData = oPCModel.getData(),
				oDate = new Date(),
				sDate = `${oDate.getFullYear()}-${("0" + (oDate.getMonth() + 1) ).slice(-2)}-${("0" + oDate.getDate()).slice(-2)}`;
			if (oAppModel.getProperty("/erpPreview")) {
				oPCData.ChangeRequest = oChangeRequest;
				this.clearAllButtons();
				this.getView().setBusy(true);
				this.createEntityId("PROFIT_CENTRE").then(oData => {
					var oBusinessEntity = oData.result.profitCenterDTOs[0].commonEntityDTO.customBusinessDTO,
						sEntityId = oBusinessEntity.entity_id,
						oAudLogModel = this.getView().getModel("AuditLogModel");
					if (!oAudLogModel.getProperty("/details")) {
						oAudLogModel.setProperty("/details", {});
					}

					oAudLogModel.setProperty("/details/desc", "");
					oAudLogModel.setProperty("/details/businessID", sEntityId);
					oAudLogModel.setProperty("/details/ChangeRequestID", "");

					oPCData.Cepc.entity_id = oBusinessEntity.entity_id;
					oPCData.ChangeRequest.change_request_id = 50001;
					oPCData.ChangeRequest.reason = "";
					oPCData.ChangeRequest.timeCreation = `${("0" + oDate.getHours()).slice(-2)}:${("0" + oDate.getMinutes()).slice(-2)}`;
					oPCData.ChangeRequest.dateCreation = sDate;
					oPCData.ChangeRequest.change_request_by = oBusinessEntity.hasOwnProperty("created_by") ? oBusinessEntity.created_by : {};
					oPCData.ChangeRequest.modified_by = oBusinessEntity.hasOwnProperty("modified_by") ? oBusinessEntity.modified_by : {};
					this.getModel("AuditLogModel").setProperty("/details/businessID", oBusinessEntity.entity_id);

					oPCModel.setData(oPCData);
					oAppModel.setProperty("/edit", true);
					oAppModel.setProperty("/submitButton", false);
					oAppModel.setProperty("/editButton", false);
					oAppModel.setProperty("/saveButton", true);
					oAppModel.setProperty("/crEdit", true);
					this.filterCRReasons(oPCData.ChangeRequest.change_request_id, "PC_CR_REASON");
					this.getView().setBusy(false);
				}, oError => {
					this.getView().setBusy(false);
					MessageToast.show("Entity ID not created. Please try after some time");
				});
			} else {
				this.clearAllButtons();
				oAppModel.setProperty("/edit", true);
				oAppModel.setProperty("/submitButton", false);
				oAppModel.setProperty("/editButton", false);
				oAppModel.setProperty("/saveButton", true);
				oAppModel.setProperty("/crEdit", true);
			}
		},

		onCheckCR: function () {
			var oPostCheck = this._handlePostalCodeCheck(),
				aMessages = oPostCheck.aMessage,
				bValid = oPostCheck.bValid;
			if (bValid) {
				var aForms = ["idPCChangeReqForm", "idPcDetails", "idPCAddress", "idPCCommunication"];
				aForms.forEach(sForm => {
					var oMessages = this.checkFormReqFields(sForm);
					if (!oMessages.bValid) {
						aMessages = aMessages.concat(this.checkFormReqFields(sForm).message);
						bValid = false;
					}
				});
			}

			//Atleast One Company Code Required to Submit
			var oPCData = this.getModel("ProfitCenter").getData();
			if (oPCData.CepcBukrs.length < 1) {
				aMessages.push("Add at least one Company Code Assignment");
				bValid = false;
			}

			if (aMessages.length && !bValid) {
				var oList = new List();
				aMessages.forEach(sMessage => {
					oList.addItem(new StandardListItem({
						title: sMessage
					}));
				});
				this.sMessageDialog = new Dialog({
					title: "Missing Fields",
					content: oList,
					endButton: new Button({
						text: "Close",
						press: () => {
							this.sMessageDialog.close();
							this.sMessageDialog.destroy();
						}
					})
				});
				this.getView().addDependent(this.sMessageDialog);
				this.sMessageDialog.open();
			} else {
				MessageToast.show("Validation Successful");
				bValid = true;
			}
			return bValid;

		},

		_handlePostalCodeCheck: function () {
			var oPCData = this.getModel("ProfitCenter").getData(),
				oReturnObj = {
					bValid: true,
					aMessage: []
				},
				iPostLength = 0;
			if (oPCData.Cepc.pstlz) {
				iPostLength = oPCData.Cepc.pstlz.length;
			}
			if (oPCData.Cepc.land1 === "US") {
				if (iPostLength !== 5 && iPostLength !== 10) {
					oReturnObj.bValid = false;
					oReturnObj.aMessage.push("Postal Code should be 5 or 10 digits for USA.");
				}
			} else if (oPCData.Cepc.land1 === "CA") {
				if (iPostLength !== 6) {
					oReturnObj.bValid = false;
					oReturnObj.aMessage.push("Postal Code should be 6 digits for Canada.");
				}
			}
			return oReturnObj;
		},

		onSubmitCR: function () {
			if (this.onCheckCR()) {
				/*this.getView().setBusy(true);
				var objParamSubmit = {
					url: "/mdmccpc/workflow-service/workflows/tasks/task/action",
					type: "POST",
					hasPayload: true,
					data: {
						"changeRequestDTO": {
							"entity_id": this.getModel("ProfitCenter").getProperty("/Cepc/entity_id"),
							"entity_type_id": 41004,
							"change_request_type_id": 50001
						}
					}
				};
				this.serviceCall.handleServiceRequest(objParamSubmit).then(function (oDataResp) {
					this.getView().setBusy(false);
					MessageToast.show("Submission Successful");
					this._CreateCRID();
					this.getView().getModel("Customer").refresh(true);
				}.bind(this), function (oError) {
					this.getView().setBusy(false);
					var sError = "";
					var aError = [];
					if (oError.responseJSON.result && oError.responseJSON.result.workboxCreateTaskResponseDTO && oError.responseJSON.result.workboxCreateTaskResponseDTO
						.response.EXT_MESSAGES.MESSAGES.item &&
						oError.responseJSON.result.workboxCreateTaskResponseDTO.response.EXT_MESSAGES.MESSAGES.item.length > 0) {
						oError.responseJSON.result.workboxCreateTaskResponseDTO.response.EXT_MESSAGES.MESSAGES.item.forEach(function (oItem) {
							sError = sError + oItem.MESSAGE + "\n";
							aError.push({
								ErrorMessage: oItem.MESSAGE
							});
						});
					} else if (!oError.responseJSON.result) {
						aError.push({
							ErrorMessage: oError.responseJSON.error
						});
						sError = oError.responseJSON.error;
					}
					MessageToast.show(sError, {
						duration: 6000,
						width: "100%"
					});
				}.bind(this));*/
				this._createTask();
			}
		},

		_createTask: function () {
			var oPCData = this.getModel("ProfitCenter").getData(),
				oData = {
					"workboxCreateTaskRequestDTO": {
						"listOfProcesssAttributes": [{
							"customAttributeTemplateDto": [{
								"processName": "STANDARD",
								"key": "description",
								"label": "Description",
								"processType": "",
								"isEditable": true,
								"isActive": true,
								"isMandatory": true,
								"isEdited": 2,
								"attrDes": "",
								"value": oPCData.Cepct[0].ktext,
								"dataType": null,
								"valueList": null,
								"attachmentType": null,
								"attachmentSize": null,
								"attachmentName": null,
								"attachmentId": null,
								"dataTypeKey": 0,
								"dropDownType": null,
								"url": null,
								"taskId": null,
								"origin": null,
								"attributePath": null,
								"dependantOn": null,
								"rowNumber": 0,
								"tableAttributes": null,
								"tableContents": null,
								"isDeleted": false,
								"isRunTime": null,
								"isVisible": null
							}, {
								"processName": "MDGPCWorkflow",
								"key": "928h7e536jbeb",
								"label": "CountryCode",
								"processType": null,
								"isEditable": true,
								"isActive": true,
								"isMandatory": true,
								"isEdited": 2,
								"attrDes": "Country Code",
								"value": "US",
								"dataType": "INPUT",
								"valueList": [],
								"attachmentType": null,
								"attachmentSize": null,
								"attachmentName": null,
								"attachmentId": null,
								"dataTypeKey": 0,
								"dropDownType": null,
								"url": null,
								"taskId": null,
								"origin": "Process",
								"attributePath": null,
								"dependantOn": null,
								"rowNumber": 0,
								"tableAttributes": null,
								"tableContents": null,
								"isDeleted": false,
								"isRunTime": null,
								"isVisible": null
							}, {
								"processName": "MDGPCWorkflow",
								"key": "20801f6d9fie2",
								"label": "AccountGroup",
								"processType": null,
								"isEditable": true,
								"isActive": true,
								"isMandatory": true,
								"isEdited": 2,
								"attrDes": "Account Group",
								"value": "ZZZZ",
								"dataType": "INPUT",
								"valueList": [],
								"attachmentType": null,
								"attachmentSize": null,
								"attachmentName": null,
								"attachmentId": null,
								"dataTypeKey": 0,
								"dropDownType": null,
								"url": null,
								"taskId": null,
								"origin": "Process",
								"attributePath": null,
								"dependantOn": null,
								"rowNumber": 0,
								"tableAttributes": null,
								"tableContents": null,
								"isDeleted": false,
								"isRunTime": false,
								"isVisible": null
							}, {
								"processName": "MDGPCWorkflow",
								"key": "a4f3032fgc3j9",
								"label": "Data Domain",
								"processType": null,
								"isEditable": true,
								"isActive": true,
								"isMandatory": true,
								"isEdited": 2,
								"attrDes": "Data Domain",
								"value": "PC",
								"dataType": "INPUT",
								"valueList": [],
								"attachmentType": null,
								"attachmentSize": null,
								"attachmentName": null,
								"attachmentId": null,
								"dataTypeKey": 0,
								"dropDownType": null,
								"url": null,
								"taskId": null,
								"origin": "Process",
								"attributePath": null,
								"dependantOn": null,
								"rowNumber": 0,
								"tableAttributes": null,
								"tableContents": null,
								"isDeleted": false,
								"isRunTime": false,
								"isVisible": null
							}, {
								"processName": "MDGPCWorkflow",
								"key": "3eb58ff9jgcf9",
								"label": "CountryCodeAccountGroup",
								"processType": null,
								"isEditable": true,
								"isActive": true,
								"isMandatory": true,
								"isEdited": 2,
								"attrDes": "CountryCodeAccountGroup",
								"value": "US+ZZZZ",
								"dataType": "INPUT",
								"valueList": [],
								"attachmentType": null,
								"attachmentSize": null,
								"attachmentName": null,
								"attachmentId": null,
								"dataTypeKey": 0,
								"dropDownType": null,
								"url": null,
								"taskId": null,
								"origin": "Process",
								"attributePath": null,
								"dependantOn": null,
								"rowNumber": 0,
								"tableAttributes": null,
								"tableContents": null,
								"isDeleted": false,
								"isRunTime": false,
								"isVisible": null
							}, {
								"processName": "MDGPCWorkflow",
								"key": "i4ihde93g1e4b",
								"label": "CR Number",
								"processType": null,
								"isEditable": true,
								"isActive": true,
								"isMandatory": true,
								"isEdited": 2,
								"attrDes": "CR Number",
								"value": oPCData.Cepc.entity_id,
								"dataType": "INPUT",
								"valueList": [],
								"attachmentType": null,
								"attachmentSize": null,
								"attachmentName": null,
								"attachmentId": null,
								"dataTypeKey": 0,
								"dropDownType": null,
								"url": null,
								"taskId": null,
								"origin": "Process",
								"attributePath": null,
								"dependantOn": null,
								"rowNumber": 0,
								"tableAttributes": null,
								"tableContents": null,
								"isDeleted": false,
								"isRunTime": false,
								"isVisible": null
							}],
							"userId": this.getView().getModel("userManagementModel").getProperty("/data/user_id")
						}],
						"type": "Multiple Instance",
						"resourceid": null,
						"actionType": "Submit",
						"processName": "MDGPCWorkflow",
						"processId": null,
						"isEdited": 2,
						"requestId": null,
						"responseMessage": null,
						"userId": this.getView().getModel("userManagementModel").getProperty("/data/user_id"),
						"emailId": this.getView().getModel("userManagementModel").getProperty("/data/email_id"),
						"userName": this.getView().getModel("userManagementModel").getProperty("/data/display_name")
					},
					"changeRequestDTO": {
						"entity_id": oPCData.Cepc.entity_id,
						"change_request_by": {
							"user_id": this.getView().getModel("userManagementModel").getProperty("/data/user_id")
						},
						"modified_by": {
							"user_id": this.getView().getModel("userManagementModel").getProperty("/data/user_id")
						},
						"entity_type_id": "41004",
						"change_request_type_id": oPCData.ChangeRequest.change_request_id,
						"change_request_priority_id": oPCData.ChangeRequest.priority,
						"change_request_due_date": "",
						"change_request_desc": oPCData.ChangeRequest.desc,
						"change_request_reason_id": oPCData.ChangeRequest.reason
					}
				};
			var objParamCreate = {
				url: "/mdmccpc/workflow-service/workflows/tasks/task/create",
				hasPayload: true,
				data: oData,
				type: "POST"
			};
			this.getView().setBusy(true);
			this.serviceCall.handleServiceRequest(objParamCreate).then(function (oDataResp) {
				this.getView().setBusy(false);
				if (oDataResp.result && oDataResp.result.changeRequestDTO) {
					MessageToast.show("Change Request ID - " + oDataResp.result.changeRequestDTO.change_request_id + " Generated.");
					this._EntityIDDraftFalse();
				}
			}.bind(this), function (oError) {
				this.getView().setBusy(false);
				MessageToast.show("Error In Creating Workflow Task");
			}.bind(this));
		},

		_EntityIDDraftFalse: function () {
			var oPCData = this.getModel("ProfitCenter").getData();
			var objParamSubmit = {
				url: "/mdmccpc/entity-service/entities/entity/create",
				type: "POST",
				hasPayload: true,
				data: {
					"entityType": "PROFIT_CENTRE",
					"parentDTO": {
						"customData": {
							"business_entity": {
								"entity_id": oPCData.Cepc.entity_id,
								"is_draft": "false"
							}
						}
					}
				}

			};
			this.getView().setBusy(true);
			this.serviceCall.handleServiceRequest(objParamSubmit).then(
				oData => {
					this.getView().setBusy(false);
					this.onBackToPCChangeReq();
				},
				oError => {
					this.getView().setBusy(false);
					MessageToast.show("Error while updating draft falg.");
				});
		},

		onBackToPCChangeReq: function () {
			this.nPageNo = 1;
			this.getAllPCChangeRequests(this.nPageNo);
			this.getPcCrStatistics();
			this.clearAllButtons();
			this.getView().getParent().getParent().getSideContent().setSelectedItem(this.getView().getParent().getParent().getSideContent().getItem()
				.getItems()[2]);

			this.getModel("App").setProperty("/appTitle", "Profit Center Change Requests");
			this.getRouter().getTargets().display("ProfitCenterChangeRequest");
		},

		onApproveClick: function () {
			var sWorkFlowID = this.getView().getModel("ProfitCenter").getProperty("/workflowID");
			this._claimTask(sWorkFlowID, "Approve", "");
		},

		onRejectClick: function () {
			if (!this.oRejectDailog) {
				this.oRejectDailog = new Dialog({
					title: "Confirmation",
					width: "40%",
					type: "Message",
					state: "Warning",
					content: [
						new sap.m.VBox({
							items: [
								new Text({
									text: "Please enter reject reason and click 'Ok' to reject:"
								}),
								new TextArea({
									id: "idRejectReason",
									width: "100%"
								})
							]
						})
					],
					beginButton: new Button({
						text: "Ok",
						press: function () {
							var sRejectReason = sap.ui.getCore().byId("idRejectReason").getValue();
							if (sRejectReason) {
								var sWorkFlowID = this.getView().getModel("ProfitCenter").getProperty("/workflowID");
								this._claimTask(sWorkFlowID, "Reject", sRejectReason);
								this.oRejectDailog.close();
							} else {
								MessageToast.show("Please provide reject reason to continoue");
							}
						}.bind(this)
					}),
					endButton: new Button({
						text: "Cancel",
						press: function () {
							this.oRejectDailog.close();
						}.bind(this)
					}),
					afterClose: function () {
						sap.ui.getCore().byId("idRejectReason").setValue("");
					}
				});
			}

			this.getView().addDependent(this.oRejectDailog);
			this.oRejectDailog.open();
		},

		_claimTask: function (sTaskID, sAction, sReason) {
			this.getView().setBusy(true);
			var oData = {
				"workboxTaskActionRequestDTO": {
					"isChatBot": true,
					"userId": this.getView().getModel("userManagementModel").getProperty("/data/user_id"),
					"userDisplay": this.getView().getModel("userManagementModel").getProperty("/data/firstname"),
					"task": [{
						"instanceId": sTaskID,
						"origin": "Ad-hoc",
						"actionType": "Claim",
						"isAdmin": false,
						"platform": "Web",
						"signatureVerified": "NO",
						"userId": this.getView().getModel("userManagementModel").getProperty("/data/user_id")
					}]
				}
			};
			var objParamCreate = {
				url: "/mdmccpc/workflow-service/workflows/tasks/task/claim",
				hasPayload: true,
				data: oData,
				type: "POST"
			};
			
			this.getView().setBusy(true);
			this.serviceCall.handleServiceRequest(objParamCreate).then(
				oDataResp => {
					this.getView().setBusy(false);
					if (oDataResp.result) {
						this._ApproveRejectTask(sTaskID, sAction, sReason);
					}
				},
				oError => {
					this.getView().setBusy(false);
					MessageToast.show("Error In Claiming Workflow Task");
				});
		},

		_ApproveRejectTask: function (sTaskID, sAction, sReason) {
			var sUrl = "";
			var oData = {
				"workboxTaskActionRequestDTO": {
					"isChatBot": true,
					"userId": this.getView().getModel("userManagementModel").getProperty("/data/user_id"),
					"userDisplay": this.getView().getModel("userManagementModel").getProperty("/data/firstname"),
					"task": [{
						"instanceId": sTaskID,
						"origin": "Ad-hoc",
						"actionType": sAction,
						"isAdmin": false,
						"platform": "Web",
						"signatureVerified": "NO",
						"comment": sAction + " task",
						"userId": this.getView().getModel("userManagementModel").getProperty("/data/user_id")
					}]
				}
			};
			if (sAction === "Approve") {
				sUrl = "approve";
				oData.changeRequestDTO = {
					"entity_id": this.getView().getModel("ProfitCenter").getProperty("/Cepc/entity_id")
				};
			} else {
				sUrl = "reject";
			}
			var objParamCreate = {
				url: "/mdmccpc/workflow-service/workflows/tasks/task/" + sUrl,
				hasPayload: true,
				data: oData,
				type: 'POST'
			};
			this.getView().setBusy(true);
			this.serviceCall.handleServiceRequest(objParamCreate).then(
				function (oDataResp) {
					if (oDataResp.result) {
						this.onBackToPCChangeReq();
					}

					//Adding rejection reason to comment section
					if (sAction.toLowerCase() === "reject") {
						this.onAddComment({
							sEntityID: this.getView().getModel("ProfitCenter").getProperty("/Cepc/entityId"),
							comment: sReason,
							sControlID: "previewCRCommentBoxId"
						});
					}

					this.getView().setBusy(false);
					var sMessage = sAction.toLowerCase() === "approve" ? "Approved" : "Rejected";
					MessageToast.show(sMessage);
				}.bind(this),
				function (oError) {
					this.getView().setBusy(false);
					var aError = [];
					if (oError.responseJSON.result && oError.responseJSON.result.workboxCreateTaskResponseDTO && oError.responseJSON.result.workboxCreateTaskResponseDTO
						.response.EXT_MESSAGES.MESSAGES.item &&
						oError.responseJSON.result.workboxCreateTaskResponseDTO.response.EXT_MESSAGES.MESSAGES.item.length > 0) {
						oError.responseJSON.result.workboxCreateTaskResponseDTO.response.EXT_MESSAGES.MESSAGES.item.forEach(function (oItem) {
							aError.push({
								ErrorMessage: oItem.MESSAGE
							});
						});
					} else if (!oError.responseJSON.result) {
						aError.push({
							ErrorMessage: oError.responseJSON.error
						});
					}
					MessageToast.show("Error In " + sAction + " Workflow Task");
				}.bind(this));
		},

		onAddBukrs: function () {
			if (this.checkFormReqFields("idCompForm").bValid) {
				var oPCModel = this.getModel("ProfitCenter"),
					oAppModel = this.getModel("App"),
					oPCData = oPCModel.getData();
				oPCData.Cepc_bukrs.entity_id = oPCData.Cepc.entity_id;
				oPCData.CepcBukrs.push(Object.assign({}, oPCData.Cepc_bukrs));
				oPCData.Cepc_bukrs = Object.assign({}, oAppModel.getProperty("/cepc_bukrs"));
				oPCModel.setData(oPCData);
			} else {
				MessageToast.show("Please Fill Mandatory Fields");
			}

		}
	});

});
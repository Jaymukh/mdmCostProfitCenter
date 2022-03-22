sap.ui.define([
	"murphy/mdm/costProfit/mdmCostProfitCenter/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/List",
	"sap/m/TextArea",
	"sap/m/StandardListItem",
], function (BaseController, Filter, FilterOperator, MessageToast, Dialog, Button, List, TextArea, StandardListItem) {
	"use strict";

	return BaseController.extend("murphy.mdm.costProfit.mdmCostProfitCenter.controller.CostCenterCreate", {

		onInit: function () {

		},

		onSelectBukrs: function (oEvent) {
			var oBukrs = oEvent.getParameter("selectedItem").getBindingContext("Dropdowns").getObject();
			this.getModel("CostCenter").setProperty("/Cskt/waers", oBukrs.waers);
		},

		onChangeCountry: function (oEvent) {
			this.byId("idCCRegion").getBinding("items").filter([
				new Filter("land1", FilterOperator.EQ, this.getModel("CostCenter").getProperty(
					"/Csks/land1"))
			]);
		},

		onSaveCR: function () {
			if (this.onCheckCR()) {
				var oCCModel = this.getModel("CostCenter"),
					oCCData = oCCModel.getData(),
					oAppModel = this.getModel("App"),
					oFormData = {
						"entityType": "COST_CENTER",
						"parentDTO": {
							"customData": {
								"csks": oCCData.Csks,
								"cskt": {}
							}
						}
					};

				oCCData.Cskt.forEach((oItem, iIndex) => {
					oItem.kokrs = oCCData.Csks.kokrs;
					oItem.kostl = oCCData.Csks.kostl;
					oFormData.parentDTO.customData.cskt[iIndex + 1] = oItem;
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
						this.getAllCommentsForCR(oFormData.parentDTO.customData.csks.entity_id);
						this.getAllDocumentsForCR(oFormData.parentDTO.customData.csks.entity_id);
						this.getAuditLogsForCR(oFormData.parentDTO.customData.csks.entity_id);
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
			var oCCModel = this.getModel("CostCenter"),
				oAppModel = this.getModel("App"),
				oChangeRequest = Object.assign({}, oAppModel.getProperty("/changeReq")),
				oCCData = oCCModel.getData(),
				oDate = new Date(),
				sDate = `${oDate.getFullYear()}-${("0" + (oDate.getMonth() + 1) ).slice(-2)}-${("0" + oDate.getDate()).slice(-2)}`;
			oCCData.ChangeRequest = oChangeRequest;
			if (oAppModel.getProperty("/erpPreview")) {
				this.clearAllButtons();
				this.getView().setBusy(true);
				this.createEntityId("COST_CENTER").then(oData => {
					var oBusinessEntity = oData.result.costCenterDTOs[0].commonEntityDTO.customBusinessDTO,
						sEntityId = oBusinessEntity.entity_id,
						oAudLogModel = this.getView().getModel("AuditLogModel");
					if (!oAudLogModel.getProperty("/details")) {
						oAudLogModel.setProperty("/details", {});
					}

					oAudLogModel.setProperty("/details/desc", "");
					oAudLogModel.setProperty("/details/businessID", sEntityId);
					oAudLogModel.setProperty("/details/ChangeRequestID", "");

					oCCData.Csks.entity_id = sEntityId;
					oCCData.ChangeRequest.change_request_id = 50001;
					oCCData.ChangeRequest.reason = "";
					oCCData.ChangeRequest.timeCreation = `${("0" + oDate.getHours()).slice(-2)}:${("0" + oDate.getMinutes()).slice(-2)}`;
					oCCData.ChangeRequest.dateCreation = sDate;
					oCCData.ChangeRequest.change_request_by = oBusinessEntity.hasOwnProperty("created_by") ? oBusinessEntity.created_by : {};
					oCCData.ChangeRequest.modified_by = oBusinessEntity.hasOwnProperty("modified_by") ? oBusinessEntity.modified_by : {};
					this.getModel("AuditLogModel").setProperty("/details/businessID", oBusinessEntity.entity_id);

					oCCModel.setData(oCCData);
					oAppModel.setProperty("/edit", true);
					oAppModel.setProperty("/submitButton", false);
					oAppModel.setProperty("/editButton", false);
					oAppModel.setProperty("/saveButton", true);
					oAppModel.setProperty("/crEdit", true);
					this.filterCRReasons(oCCData.ChangeRequest.change_request_id, "CC_CR_REASON");
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
				var aForms = ["idChangeReqForm", "idCCDetails", "idCCAddress", "idCCCommunication", "idCCJointVenture"];
				aForms.forEach(sForm => {
					var oMessages = this.checkFormReqFields(sForm);
					if (!oMessages.bValid) {
						aMessages = aMessages.concat(this.checkFormReqFields(sForm).message);
						bValid = false;
					}
				});
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
			var oCCData = this.getModel("CostCenter").getData(),
				oReturnObj = {
					bValid: true,
					aMessage: []
				},
				iPostLength = 0;
			if (oCCData.Csks.pstlz) {
				iPostLength = oCCData.Csks.pstlz.length;
			}
			if (oCCData.Csks.land1 === "US") {
				if (iPostLength !== 5 && iPostLength !== 10) {
					oReturnObj.bValid = false;
					oReturnObj.aMessage.push("Postal Code should be 5 or 10 digits for USA.");
				}
			} else if (oCCData.Csks.land1 === "CA") {
				if (iPostLength !== 6) {
					oReturnObj.bValid = false;
					oReturnObj.aMessage.push("Postal Code should be 6 digits for Canada.");
				}
			}
			return oReturnObj;
		},

		onSubmitCR: function () {
			if (this.onCheckCR()) {
				this.getView().setBusy(true);
				var objParamSubmit = {
					url: "/mdmccpc/workflow-service/workflows/tasks/task/action",
					type: 'POST',
					hasPayload: true,
					data: {
						"operationType": "CREATE",
						"changeRequestDTO": {
							"entity_type_id": "41003",
							"entity_id": this.getModel("CostCenter").getProperty("/Csks/entity_id")
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
					this.getView().getModel("Customer").refresh(true);
					MessageToast.show(sError, {
						duration: 6000,
						width: "100%"
					});
				}.bind(this));
				//	this._createTask();
			}
		},

		_createTask: function () {
			var oCCData = this.getModel("CostCenter").getData(),
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
								"value": oCCData.ChangeRequest.genData.desc,
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
								"processName": "MDGCustomerWorkflow",
								"key": "0b1j5f3b6a5jf",
								"label": "CountryCode",
								"processType": null,
								"isEditable": true,
								"isActive": true,
								"isMandatory": true,
								"isEdited": 2,
								"attrDes": "Country Code",
								"value": oCCData.Csks.land1,
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
								"processName": "MDGCustomerWorkflow",
								"key": "0161eec7ie65c8",
								"label": "AccountGroup",
								"processType": null,
								"isEditable": true,
								"isActive": true,
								"isMandatory": true,
								"isEdited": 2,
								"attrDes": "Account Group",
								"value": oCCData.Csks.ktokd,
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
								"processName": "MDGCustomerWorkflow",
								"key": "cafe0ee6f50c8",
								"label": "Data Domain",
								"processType": null,
								"isEditable": true,
								"isActive": true,
								"isMandatory": true,
								"isEdited": 2,
								"attrDes": "Data Domain",
								"value": "CUSTOMER",
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
								"processName": "MDGCustomerWorkflow",
								"key": "hhcie3a1d1a7a",
								"label": "CR Number",
								"processType": null,
								"isEditable": true,
								"isActive": true,
								"isMandatory": true,
								"isEdited": 2,
								"attrDes": "CR Number",
								"value": "CR0033",
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
						"processName": "MDGCustomerWorkflow",
						"processId": null,
						"isEdited": 2,
						"requestId": null,
						"responseMessage": null,
						"userId": this.getView().getModel("userManagementModel").getProperty("/data/user_id"),
						"emailId": this.getView().getModel("userManagementModel").getProperty("/data/email_id"),
						"userName": this.getView().getModel("userManagementModel").getProperty("/data/firstname") + " " +
							this.getView().getModel("userManagementModel").getProperty("/data/lastname")
					},
					"changeRequestDTO": {
						"entity_id": oCCData.Csks.entity_id,
						"change_request_by": {
							"user_id": this.getView().getModel("userManagementModel").getProperty("/data/user_id")
						},
						"modified_by": {
							"user_id": this.getView().getModel("userManagementModel").getProperty("/data/user_id")
						},
						"entity_type_id": "41002",
						"change_request_type_id": oCCData.ChangeRequest.genData.change_request_id,
						"change_request_priority_id": oCCData.ChangeRequest.genData.priority,
						"change_request_due_date": oCCData.ChangeRequest.genData.dueDate,
						"change_request_desc": oCCData.ChangeRequest.genData.desc,
						"change_request_reason_id": oCCData.ChangeRequest.genData.reason
					}
				};
			var objParamCreate = {
				url: "/mdmccpc/workflow-service/workflows/tasks/task/create",
				hasPayload: true,
				data: oData,
				type: "POST"
			};

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
			var objParamSubmit = {
				url: "/mdmccpc/entity-service/entities/entity/create",
				type: "POST",
				hasPayload: true,
				data: {
					"entityType": "CUSTOMER",
					"parentDTO": {
						"customData": {
							"business_entity": {
								"entity_id": this.getModel("CostCenter").getProperty("/Csks/entityId"),
								"is_draft": "false"
							}
						}
					}
				}

			};
			this.serviceCall.handleServiceRequest(objParamSubmit).then(
				oData => {
					this.getView().setBusy(false);
					this.onBackToAllChangeReq();
				},
				oError => {
					this.getView().setBusy(false);
					MessageToast.show("Error while updating draft falg.");
				});
		},

		onApproveClick: function () {
			var sWorkFlowID = this.getView().getModel("CostCenter").getProperty("/workflowID");
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
								var sWorkFlowID = this.getView().getModel("Customer").getProperty("/createCRCustomerData/workflowID");
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

			this.serviceCall.handleServiceRequest(objParamCreate).then(
				oDataResp => {
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
					"entity_id": this.getView().getModel("CostCenter").getProperty("/Csks/entity_id")
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

			this.serviceCall.handleServiceRequest(objParamCreate).then(
				function (oDataResp) {
					if (oDataResp.result) {
						this.nPageNo = 1;
						this.handleGetAllChangeRequests(this.nPageNo);
						this.handleChangeRequestStatistics();
						this.onAllChangeReqClick();
					}

					//Adding rejection reason to comment section
					if (sAction.toLowerCase() === "reject") {
						this.onAddComment({
							sEntityID: this.getView().getModel("CostCenter").getProperty("/Csks/entityId"),
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

		onAddDescription: function (oEvent) {
			var oCostCenterModel = this.getModel("CostCenter"),
				oCostCenter = oCostCenterModel.getData(),
				oCskt = Object.assign({}, this.getModel("App").getProperty("/cskt"));
			oCostCenter.Cskt.push(oCskt);
			oCskt.entity_id = oCostCenter.Csks.entity_id;
			oCostCenterModel.setData(oCostCenter);
		},

		onDeleteDesc: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext("CostCenter").getPath(),
				oCCModel = this.getModel("CostCenter"),
				oCCData = oCCModel.getData(),
				iIndex = Number(sPath.replace("/Cskt/", ""));
			if (iIndex > -1) {
				oCCData.Cskt.splice(iIndex, 1);
				oCCModel.setData(oCCData);
			}
		},

		onChangeName: function (oEvent) {
			var sName = oEvent.getSource().getValue(),
				oCostCenterModel = this.getModel("CostCenter"),
				oCostCenter = oCostCenterModel.getData(),
				oCskt = Object.assign({}, this.getModel("App").getProperty("/cskt"));

			var oEnCskt = oCostCenter.Cskt.find(oItem => {
				return oItem.spras === "E";
			});

			if (oEnCskt) {
				oEnCskt.ktext = sName;
			} else {
				oCskt.entity_id = oCostCenter.Csks.entity_id;
				oCskt.ktext = sName;
				oCskt.spras = "E";
				oCostCenter.Cskt.push(oCskt);
			}
			oCostCenterModel.setData(oCostCenter);
		},

		onChangeMText: function (oEvent) {
			var sName = oEvent.getSource().getValue(),
				oCostCenterModel = this.getModel("CostCenter"),
				oCostCenter = oCostCenterModel.getData(),
				oCskt = Object.assign({}, this.getModel("App").getProperty("/cskt"));

			var oEnCskt = oCostCenter.Cskt.find(oItem => {
				return oItem.spras === "E";
			});

			if (oEnCskt) {
				oEnCskt.ltext = sName;
			} else {
				oCskt.entity_id = oCostCenter.Csks.entity_id;
				oCskt.ltext = sName;
				oCskt.spras = "E";
				oCostCenter.Cskt.push(oCskt);
			}
			oCostCenterModel.setData(oCostCenter);
		}
	});

});
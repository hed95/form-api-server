export const basicForm: any = {
    "_id": "5d0b8b8b2d590d00161be8f6",
    "type": "form",
    "components": [
        {
            "label": "Text Field",
            "widget": {
                "type": "input"
            },
            "tableView": true,
            "inputFormat": "plain",
            "validate": {
                "required": true
            },
            "key": "textField",
            "type": "textfield",
            "input": true
        },
        {
            "type": "button",
            "label": "Submit",
            "key": "submit",
            "disableOnInvalid": true,
            "input": true,
            "tableView": false
        }
    ],
    "title": "testABC",
    "path": "testabc",
    "display": "form",
    "name": "testAbc",
    "submissionAccess": [],
    "access": []
};

export const numberForm: any = {
    "type": "form",
    "components": [{
        "autofocus": false,
        "input": true,
        "tableView": true,
        "inputType": "number",
        "label": "Number",
        "key": "number",
        "placeholder": "",
        "prefix": "",
        "suffix": "",
        "defaultValue": "",
        "protected": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "validate": {
            "required": false,
            "min": "",
            "max": "",
            "step": "any",
            "integer": "",
            "multiple": "",
            "custom": ""
        },
        "type": "number",
        "labelPosition": "top",
        "tags": [],
        "conditional": {"show": "", "when": null, "eq": ""},
        "properties": {}
    }, {
        "type": "button",
        "label": "Submit",
        "key": "submit",
        "disableOnInvalid": true,
        "theme": "primary",
        "input": true,
        "tableView": true,
        "autofocus": false,
        "size": "md",
        "leftIcon": "",
        "rightIcon": "",
        "block": false,
        "action": "submit"
    }],
    "revisions": "",
    "display": "form",
    "title": "APPLES",
    "name": "apples",
    "path": "apples",
    "access": [],
    "submissionAccess": [],

};

export const emailForm: any = {
    "type": "form",
    "components": [{
        "autofocus": false,
        "input": true,
        "tableView": true,
        "inputType": "email",
        "label": "Email",
        "key": "email",
        "placeholder": "",
        "prefix": "",
        "suffix": "",
        "defaultValue": "",
        "protected": false,
        "unique": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "kickbox": {"enabled": false},
        "type": "email",
        "labelPosition": "top",
        "inputFormat": "plain",
        "tags": [],
        "conditional": {"show": "", "when": null, "eq": ""},
        "properties": {}
    }, {
        "type": "button",
        "label": "Submit",
        "key": "submit",
        "disableOnInvalid": true,
        "theme": "primary",
        "input": true,
        "tableView": true,
        "autofocus": false,
        "size": "md",
        "leftIcon": "",
        "rightIcon": "",
        "block": false,
        "action": "submit"
    }],
    "display": "form",
    "title": "APPLES",
    "name": "apples",
    "path": "apples",
    "access": [],
    "submissionAccess": []
};

export const dataGridForm: any = {
    "type": "form",
    "components": [{
        "autofocus": false,
        "input": true,
        "tree": true,
        "components": [{
            "autofocus": false,
            "input": true,
            "tableView": true,
            "inputType": "text",
            "inputMask": "",
            "label": "Text",
            "key": "field",
            "placeholder": "",
            "prefix": "",
            "suffix": "",
            "multiple": false,
            "defaultValue": "",
            "protected": false,
            "unique": false,
            "persistent": true,
            "hidden": false,
            "clearOnHide": true,
            "spellcheck": true,
            "validate": {
                "required": true,
                "minLength": "",
                "maxLength": "",
                "pattern": "",
                "custom": "",
                "customPrivate": false
            },
            "conditional": {"show": "", "when": null, "eq": ""},
            "type": "textfield",
            "inDataGrid": true,
            "labelPosition": "top",
            "inputFormat": "plain",
            "tags": [],
            "properties": {},
            "lockKey": true
        }],
        "tableView": true,
        "label": "Data Grid",
        "key": "data",
        "protected": false,
        "persistent": true,
        "hidden": false,
        "clearOnHide": true,
        "type": "datagrid",
        "addAnotherPosition": "bottom",
        "tags": [],
        "conditional": {"show": "", "when": null, "eq": ""},
        "properties": {},
        "lockKey": true
    }, {
        "type": "button",
        "label": "Submit",
        "key": "submit",
        "disableOnInvalid": true,
        "theme": "primary",
        "input": true,
        "tableView": true,
        "autofocus": false,
        "size": "md",
        "leftIcon": "",
        "rightIcon": "",
        "block": false,
        "action": "submit"
    }],
    "display": "form",
    "title": "APPLES",
    "name": "apples",
    "path": "apples",
    "access": [],
    "submissionAccess": [],
};

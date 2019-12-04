const simpleForm = {
    name: 'simpleForm',
    components: [
        {
            type: 'textfield',
            key: 'firstName',
            label: 'First Name',
            placeholder: 'Enter your first name.',
            defaultValue: '{$.keycloakContext.givenName}',
            input: true,
        },
        {
            type: 'textfield',
            key: 'lastName',
            label: 'Last Name',
            placeholder: 'Enter your last name',
            defaultValue: '{$.keycloakContext.familyName}',
            input: true,
        },
        {
            type: 'textfield',
            key: 'businessKey',
            label: 'Reference',
            defaultValue: '',
            input: true,
        },
        {
            type: 'hidden',
            key: 'sessionId',
            label: 'sessionid',
            defaultValue: '{$.keycloakContext.sessionId}',
            input: true,
        },
        {
            type: 'button',
            action: 'submit',
            label: 'Submit',
            theme: 'primary',
        },
    ],
};
const simpleFormWithoutBusinessKey = {
    name: 'simpleFormWithoutBusinessKey',
    components: [
        {
            type: 'textfield',
            key: 'firstName',
            label: 'First Name',
            placeholder: 'Enter your first name.',
            defaultValue: '{$.keycloakContext.givenName}',
            input: true,
        },
        {
            type: 'textfield',
            key: 'lastName',
            label: 'Last Name',
            placeholder: 'Enter your last name',
            defaultValue: '{$.keycloakContext.familyName}',
            input: true,
        },
        {
            type: 'hidden',
            key: 'sessionId',
            label: 'sessionid',
            defaultValue: '{$.keycloakContext.sessionId}',
            input: true,
        },
        {
            type: 'button',
            action: 'submit',
            label: 'Submit',
            theme: 'primary',
        },
    ],
};
const simpleFormBusinessKeyWithDefaultValue = {
    name: 'simpleFormBusinessKeyWithDefaultValue',
    components: [
        {
            type: 'textfield',
            key: 'firstName',
            label: 'First Name',
            placeholder: 'Enter your first name.',
            defaultValue: '{$.keycloakContext.givenName}',
            input: true,
        },
        {
            type: 'textfield',
            key: 'lastName',
            label: 'Last Name',
            placeholder: 'Enter your last name',
            defaultValue: '{$.keycloakContext.familyName}',
            input: true,
        },
        {
            type: 'textfield',
            key: 'businessKey',
            label: 'Reference',
            defaultValue: 'test',
            input: true,
        },
        {
            type: 'hidden',
            key: 'sessionId',
            label: 'sessionid',
            defaultValue: '{$.keycloakContext.sessionId}',
            input: true,
        },
        {
            type: 'button',
            action: 'submit',
            label: 'Submit',
            theme: 'primary',
        },
    ],
};
const imgForm = {
         name: 'imgForm',
         components: [
            {
                key: 'content',
                input: false,
                // tslint:disable-next-line:max-line-length
                html: '<p>Image</p>\n\n<p><img src="{$.processContext.variable.img}" style="height: 125px; width: 100px;" /></p>\n',
                type: 'content',
                tags: [
                    'image',
                ],
                conditional: {
                    show: '',
                    when: null,
                    eq: '',
                },
                properties: {},
                lockKey: true,
                label: 'content',
                hideLabel: true,
            },
        ],
    };
const iframeForm = {
        name: 'iframeForm',
        components: [
            {
                key: 'content',
                input: false,
                // tslint:disable-next-line:max-line-length
                html: '<p>Iframe</p>\n\n<p><iframe src="{$.environmentContext.operationalDataUrl}/some?access_token={$.keycloakContext.accessToken}" style="height: 125px; width: 100px;" /></p>\n',
                type: 'content',
                tags: [],
                conditional: {
                    show: '',
                    when: null,
                    eq: '',
                },
                properties: {},
                lockKey: true,
                label: 'content',
                hideLabel: true,
            },
        ],
    };
const shiftForm = {
    name: 'shiftForm',
    components: [
        {
            type: 'textfield',
            key: 'currentlocationname',
            label: 'Current Location',
            placeholder: 'Current Location',
            defaultValue: '{$.shiftDetailsContext.currentlocationname}',
            input: true,
        },
        {
            type: 'textfield',
            key: 'portclassificationquery',
            label: 'Classification Query',
            placeholder: 'classificationquery',
            defaultValue: '{$.shiftDetailsContext.portclassificationquery}',
            input: true,
        },
        {
            type: 'button',
            action: 'submit',
            label: 'Submit',
            theme: 'primary',
        },
    ],
};
const dataUrlForm = {
        name: 'dataUrlForm',
        components: [
            {
                errorLabel: 'Region selection required to filter location',
                tooltip: 'Selecting a region will filter the location drop down list',
                customClass: '',
                conditional: {
                    show: '',
                    when: null,
                    eq: '',
                },
                tags: [],
                labelPosition: 'top',
                type: 'select',
                validate: {
                    required: true,
                },
                clearOnHide: true,
                hidden: false,
                persistent: true,
                unique: false,
                protected: false,
                multiple: false,
                template: '<span>{{ item.regionname }}</span>',
                authenticate: false,
                filter: '',
                refreshOn: '',
                defaultValue: '{$.processContext.person.firstName}',
                valueProperty: 'regionid',
                dataSrc: 'url',
                data: {
                    disableLimit: true,
                    values: [
                        {
                            value: '',
                            label: '',
                        },
                    ],
                    json: '',
                    url: '{$.environmentContext.referenceDataUrl}/region',
                    resource: '',
                    custom: '',
                    headers: [],
                },
                placeholder: 'Select a region',
                key: 'regionid',
                label: 'Region',
                tableView: true,
                input: true,
                lockKey: true,
                hideLabel: false,
                properties: {
                    widget: 'html5',
                    lazyLoad: true,
                },
            },
        ],
    };
const processContextForm = {
    name: 'processContextForm',
    components: [
        {
            type: 'textfield',
            key: 'firstName',
            label: 'First Name',
            placeholder: 'Enter your first name.',
            defaultValue: '{$.processContext.person.firstName}',
            input: true,
        },
        {
            type: 'textfield',
            key: 'lastName',
            label: 'Last Name',
            placeholder: 'Enter your last name',
            defaultValue: '{$.processContext.person.lastName}',
            input: true,
        },
        {
            type: 'hidden',
            key: 'id',
            label: 'id',
            defaultValue: '{$.processContext.person.id}',
            input: true,
        },
        {
            type: 'button',
            action: 'submit',
            label: 'Submit',
            theme: 'primary',
        },
    ],
};
const taskContextForm = {
    name: 'taskContextForm',
    components: [
        {
            type: 'textfield',
            key: 'formName',
            label: 'Form Name',
            defaultValue: '{$.taskContext.name}',
            input: true,
        },
        {
            type: 'textfield',
            key: 'firstName',
            label: 'First Name',
            placeholder: 'Enter your first name.',
            defaultValue: '{$.processContext.person.firstName}',
            input: true,
        },
        {
            type: 'textfield',
            key: 'lastName',
            label: 'Last Name',
            placeholder: 'Enter your last name',
            defaultValue: '{$.processContext.person.lastName}',
            input: true,
        },
        {
            type: 'hidden',
            key: 'id',
            label: 'id',
            defaultValue: '{$.taskContext.person.id}',
            input: true,
        },
        {
            type: 'button',
            action: 'submit',
            label: 'Submit',
            theme: 'primary',
        },
    ],
};
const userDetailsContextForm = {
    name: 'UserDetails',
    components: [
        {
            type: 'textfield',
            key: 'grade',
            label: 'Grade',
            placeholder: 'Enter your first name.',
            defaultValue: '{$.staffDetailsDataContext.gradeid}',
            input: true,
        },
        {
            type: 'textfield',
            key: 'personid',
            label: 'personid',
            placeholder: 'Enter your first name.',
            defaultValue: '{$.staffDetailsDataContext.staffid}',
            input: true,
        },
        {
            type: 'button',
            action: 'submit',
            label: 'Submit',
            theme: 'primary',
        },
    ],
};
const noContextData = {
    name: 'noContextData',
    components: [
        {
            type: 'textfield',
            key: 'firstName',
            label: 'First Name',
            placeholder: 'Enter your first name.',
            defaultValue: 'Test',
            input: true,
        },
        {
            type: 'textfield',
            key: 'lastName',
            label: 'Last Name',
            placeholder: 'Enter your last name',
            defaultValue: 'Test',
            input: true,
        },
        {
            type: 'button',
            action: 'submit',
            label: 'Submit',
            theme: 'primary',
        },
    ],
};

export {
    dataUrlForm,
    simpleForm,
    processContextForm,
    taskContextForm,
    userDetailsContextForm,
    noContextData,
    shiftForm,
    imgForm,
    iframeForm,
    simpleFormWithoutBusinessKey,
    simpleFormBusinessKeyWithDefaultValue,
};

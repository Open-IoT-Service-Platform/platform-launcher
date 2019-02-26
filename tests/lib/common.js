class Data {
    constructor(value, expectedActuation, expectedEmailReason) {
        this.value = value;
        this.expectedActuation = expectedActuation;
        this.expectedEmailReason = expectedEmailReason; 
        this.ts = null;
    }
}

class Rule {
    constructor(name, op, value, actions) {
        this.name = name;
        this.basicConditionOperator = op;
        this.basicConditionValue = value.toString();
        this.actions = [];
        if ( actions ) {
            this.actions = actions;
        }
        this.id = null;
        this.cid = null;
    }

    addAction(type, target) {
        for(var action of this.actions) {
            if ( action.type == type ) {
                action.target.push(target);
                return;
            }
        }

        var action = new Object();
        action.type = type;
        action.target = [];
        action.target.push(target)
        this.actions.push(action)
    }
}

class Component {
    constructor(name, dataType, format, unit, display, min, max, rules, getDataFn, checkDataFn) {
        this._name = name;
        this.catalog = new Object();
        this.catalog.dimension =  name;
        this.catalog.version = "1.0";
        this.catalog.type = "sensor";
        this.catalog.dataType = dataType;
        this.catalog.format = format;
        if ( min != null ) {
            this.catalog.min = min;
        }
        if ( max != null ) {
            this.catalog.max = max;
        }
        this.catalog.measureunit = unit;
        this.catalog.display = display;
        
        this.rules = []
        if ( rules ) {
            this.rules = rules;
        }
        this.data = [];
        if ( getDataFn ) {
            var values = getDataFn(this.name, this, function(obj, value) {
                obj.data.push(value)
            })
            if ( values ) {
                this.data = values;
            }
        }
        this.checkDataFn = checkDataFn;
        this.dataIndex = 0;
        this.next = null;
        this.prev = null;
        this.alerts = [];
    }

    get name() {
        return this._name + "-" + this.catalog.type;
    }

    get type() {
        return this._name + ".v" + this.catalog.version;
    }

    get cId() {
        return this.catalog.dimension + ".v" + this.catalog.version;
    }

    reset() {
        if ( this.data ) {
            for (var i = 0; i < this.data.length; i++) {
                this.data[i].ts = null;
            }
        }
        this.dataIndex = 0;
    }

    upgradeVersion() {
        var version = this.catalog.version.split(".");
        if ( version.length == 2 ) {
            this.catalog.version = version[0] + "." + (parseInt(version[1]) + 1);
            return true;
        }
        else {
            return false;
        }
    }

    checkData(data) {
        if ( data && this.checkDataFn ) {
            return this.checkDataFn(this.data, data)
        }

        return "Cannot check data";
    }

    alertsNumber() {
        var nb = 0;
        this.data.forEach(function(data) {
            if ( data.expectedActuation != null ) {
                nb++;
            }
        })
        return nb;
    }

    checkAlert(value, condition ) {
        for (var i=0; i<this.data.length; i++) {
            if ( this.data[i].value == value && this.data[i].expectedEmailReason === condition ) {
                return true;
            }
        }
        return false;
    }

}

class Components {
    constructor() {
        this.list = []
    }

    add(component) {
        component.next = null;
        component.prev = null;
        if ( this.list.length > 0 ) {
            this.list[this.list.length-1].next = component;
            component.prev = this.list[this.list.length-1];
        }

        this.list.push(component);
    }

    get size() {
        return this.list.length;
    }

    reset() {
        for (var i=0; i<this.list.size; i++) {
            this.list[i].reset()
        }
    }

    get first() {
        if ( this.list.length > 0 ) {
            return this.list[0];
        }
        else {
            return null;
        }
    }
    get last() {
        if ( this.list.length > 0 ) {
            return this.list[this.list.length-1];
        }
        else {
            return null;
        }
    }
}

module.exports = {
    Data,
    Rule,
    Component,
    Components
}


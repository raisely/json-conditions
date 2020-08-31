Simple conditional logic testing of JSON objects

Simple json takes an array of conditions that can be compared against a JSON object to test if that object passes or fails the conditions.

# Quickstart

```sh
npm install json-conditions
```

```javascript
const checkConditions = require('json-conditions');

const reference = {
	user: {
		preferredName: 'Alex',
		age: 4,
	},
	toy: {
		name: 'Model Train',
		tracks: 18,
		engines: 1
		battery: true,
	}
};

const simpleRules = [
	{ property: 'toy.engines', op: 'gt', value: 2 },
	{ property: 'batteries', op: 'eq', value: true },
];

// Returns true
checkConditions({
	rules: simpleRules,
	satisfy: 'ANY',
	log: console.log,
}, reference);

// Returns false
checkConditions({
	rules: simpleRules,
	satisfy: 'ALL',
	log: console.log,
}, reference);

// Returns true
checkConditions({
	rules: [
		// A required condition must always be satisfied regardless of the value
		{ property: 'toy.tracks', op: 'gt', value: 2, required: true },
		{ property: 'batteries', op: 'eq', value: true },
		{ property: 'solarPanels', op: 'gte', value: 0 },
	],
	satisfy: 'ANY',
	log: console.log,
}, reference);
```

### Parameters
| Param  | Type  | Default | Description |
|---|---|---|---|
| settings.log | function | | Optional function to log debug output from the evaluation |
| settings.rules | object[] |   | Rules, see below |
| settings.satisfy | string | ANY | How many rules must be satisfied to pass, 'ALL' or 'ANY' |
| reference | object |   | The javascript object to evaluate the rules against |

#### Rules
Each rule is described by an object with the following properties
| property  | Type  | Default | Description |
|---|---|---|---|
| op | string |   | The logical operator to use for comparison (see below) |
| property | string |  | The property in the reference object to check, evaluated by |
| required | boolean | false | If true, this rule must always evaluate to true for the object to pass the conditions | 
| value | * |  | Value to compare the property to |

Property is passed to [lodash.get](https://lodash.com/docs/4.17.15#get) to lookup the value in the object.
So effectively the rules are evaluated to `get(reference, rule.property) ${rule.op} ${rule.value}`

#### Operators

The following operators can be used in rules. Operators use javascript coersion (ie == not ===)
Additionally, we assume that rule values may have come from a form, and so try to be forgiving when dealing with
booleans. If the value of the property is a boolean, then the strings 'true' and 'false' (case insensitive) will
be converted to booleans.

| Operator  | Javascript operation |
|---|---|
| eq | == |
| neq | != |
| gt | > |
| gte | >= |
| lt | < |
| lte | <= |
| absent | ! |
| present | !! |


## License
Licensed under the [NoHarm license](https://github.com/raisely/noharm)

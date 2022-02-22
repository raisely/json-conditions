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
		prevTracks: 5,
		tracks: 18,
		engines: 1
		battery: true,
		previousOwners: ['Alice', 'Ahmed'],
		batteryStatus: [{
			type: 'AA',
			charge: 'empty',
		}, {
			type: 'AA',
			charge: 'full',
		}]
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

// Array rules - all return true
checkConditions({
	rules: [
		// A required condition must always be satisfied regardless of the value
		{ property: 'toy.previousOwners[]', op: 'some', value: 'Alice' },
	],
	satisfy: 'ANY',
	log: console.log,
}, reference);

checkConditions({
	rules: [
		// A required condition must always be satisfied regardless of the value
		{ property: 'toy.batteryStatus[].type', op: 'all', value: 'AA' },
	],
	satisfy: 'ANY',
	log: console.log,
}, reference);

checkConditions({
	rules: [
		{ property: 'toy.tracks', op: 'crosses', value: 10 },
	],
	satisfy: 'ANY',
	log: console.log,
	previousValueFn: (ref) => ref.toy.prevTracks,
}, reference);

checkConditions({
	rules: [
		// A required condition must always be satisfied regardless of the value
		{ property: 'toy.batteryStatus[].type', op: 'none', value: 'AAA' },
	],
	satisfy: 'ANY',
	log: console.log,
}, reference);
```

### Parameters

| Param                    | Type     | Default | Description                                                                        |
| ------------------------ | -------- | ------- | ---------------------------------------------------------------------------------- |
| settings.log             | function |         | Optional function to log debug output from the evaluation                          |
| settings.rules           | object[] |         | Rules, see below                                                                   |
| settings.satisfy         | string   | ANY     | How many rules must be satisfied to pass, 'ALL' or 'ANY'                           |
| settings.previousValueFn | function |         | Function that returns a previous value, takes arguments (reference, rule.property) |
| reference                | object   |         | The javascript object to evaluate the rules against                                |

#### Rules

Each rule is described by an object with the following properties
| property | Type | Default | Description |
|---|---|---|---|
| op | string | | The logical operator to use for comparison (see below) |
| property | string | | The property in the reference object to check (evaluated by [lodash.get()](https://lodash.com/docs/4.17.15#get) |
| required | boolean | false | If true, this rule must always evaluate to true for the object to pass the conditions |
| value | \* | | Value to compare the property to |

Property is passed to [lodash.get](https://lodash.com/docs/4.17.15#get) to lookup the value in the object.
So effectively the rules are evaluated to `get(reference, rule.property) ${rule.op} ${rule.value}`

#### Operators

The following operators can be used in rules. Operators use javascript coersion (ie == not ===)
Additionally, we assume that rule values may have come from a form, and so try to be forgiving when dealing with
booleans. If the value of the property is a boolean, then the strings 'true' and 'false' (case insensitive) will
be converted to booleans.

| Operator   | Javascript operation                           | Notes              |
| ---------- | ---------------------------------------------- | ------------------ |
| eq         | ==                                             |                    |
| neq        | !=                                             |                    |
| ne         | !=                                             | (Alias for neq)    |
| gt         | >                                              |                    |
| gte        | >=                                             |                    |
| lt         | <                                              |                    |
| lte        | <=                                             |                    |
| crosses    | Greater than, but previous value was less than | (See below)        |
| absent     | !                                              |                    |
| empty      | !                                              | (Alias for absent) |
| present    | !!                                             |                    |
| startsWith | \_.toString(x).startsWith()                    |                    |
| endsWith   | \_.toString(x).endsWith()                      |                    |
| contains   | \_.toString(x).includes()                      |                    |

# Array Syntax

To check arrays for matches use `[]` in the property path to indicate that the preceeding path is an array.
You can specify further paths to reference into if the array contains an object
eg `toy.batteryStatus[].type` in the example at the top

| Operator | Javascript operation      | Notes                                       |
| -------- | ------------------------- | ------------------------------------------- |
| none     | !x.includes(value)        | Value is not in the array                   |
| some     | x.includes(value)         | Value is present at least once in the array |
| all      | !x.find(i => i !== value) | Every entry in the array matches value      |

# Crosses

Sometimes it's not enough to know if a property is greater than a given value, but you want to know if this is
the first time it has risen above that value.
For example, if you were running conditions against updates to some data and you want the condition to pass
the first time a counter passes 10, but not after that. You could pass in an object like `{ oldCount, newCount }`
and use the crosses operator.

When using the crosses operator, you must pass in a `previousValueFn` that will return a previous value that can
be used to check if the value has crossed the intended value

## License

Licensed under the [NoHarm license](https://github.com/raisely/noharm)

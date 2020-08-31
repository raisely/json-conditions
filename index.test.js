const assert = require('assert');
const checkConditions = require('./index');

const assertEq = assert.equal;

const reference = {
	text: 'Monday',
	nested: { val: 6 },
	bool: true,
	negative: false,
	blank: '',
}

const tests = {
	eq: {
		rules: [{ op: "eq", property: "text", value: "Monday" }],
		result: true,
	},
	"fuzzy eq": {
		rules: [{ op: "eq", property: "nested.val", value: "6" }],
		result: true,
	},
	neq: {
		rules: [{ op: "neq", property: "nested.val", value: "5" }],
		result: true,
	},
	gt: {
		rules: [{ op: "gt", property: "text", value: "Average" }],
		result: true,
	},
	gte: {
		rules: [{ op: "gte", property: "nested.val", value: 6 }],
		result: true,
	},
	lt: {
		rules: [{ op: "lt", property: "nested.val", value: 6 }],
		result: false,
	},
	lte: {
		rules: [{ op: "lte", property: "nested.val", value: 6 }],
		result: true,
	},
	present: {
		rules: [{ op: "present", property: "nested.val" }],
		result: true,
	},
	"not present": {
		rules: [{ op: "present", property: "nested.otherVal" }],
		result: false,
	},
	"blank not present": {
		rules: [{ op: "present", property: "blank" }],
		result: false,
	},
	absent: { rules: [{ op: "absent", property: "missing" }], result: true },
	absent: { rules: [{ op: "absent", property: "blank" }], result: true },
	"(not) absent": {
		rules: [{ op: "absent", property: "text" }],
		result: false,
	},
	"Satisfy: ALL": {
		rules: [
			{ op: "present", property: "text" },
			{ op: "eq", property: "nested.val", value: 6 },
		],
		satisfy: "ALL",
		result: true,
	},
	"Does not satisfy: ALL": {
		rules: [
			{ op: "present", property: "text" },
			{ op: "eq", property: "nested.val", value: 5 },
		],
		satisfy: "ALL",
		result: false,
	},
	"Satisfy: ANY": {
		rules: [
			{ op: "present", property: "text" },
			{ op: "eq", property: "nested.val", value: 5 },
		],
		satisfy: "ANY",
		result: true,
	},
	"Satisfy: ANY": {
		rules: [
			{ op: "absent", property: "text" },
			{ op: "eq", property: "nested.val", value: 5 },
		],
		satisfy: "ANY",
		result: false,
	},
	"Boolean True": {
		rules: [
			{ op: "eq", property: "bool", value: true },
			{ op: "eq", property: "bool", value: "true" },
			{ op: "eq", property: "bool", value: 1 },
		],
		satisfy: "ALL",
		result: true,
	},
	"Boolean False": {
		rules: [
			{ op: "eq", property: "negative", value: false },
			{ op: "eq", property: "negative", value: "false" },
			{ op: "eq", property: "negative", value: 0 },
		],
		satisfy: "ALL",
		result: true,
	},
	"Required Failed, Satisfy ANY": {
		rules: [
			{ op: "eq", property: "text", value: "Tuesday", required: true },
			{ op: "eq", property: "negative", value: "false" },
			{ op: "eq", property: "nested.val", value: 6 },
		],
		satisfy: "ANY",
		result: false,
	},
	"Required Passed, Satisfy ANY": {
		rules: [
			{ op: "eq", property: "text", value: "Monday", required: true },
			{ op: "eq", property: "negative", value: "false" },
			{ op: "eq", property: "nested.val", value: 2 },
		],
		satisfy: "ANY",
		result: true,
	},
	"Required Failed, Satisfy ALL": {
		rules: [
			{ op: "eq", property: "text", value: "Tuesday", required: true },
			{ op: "eq", property: "negative", value: "false" },
			{ op: "eq", property: "nested.val", value: 6 },
		],
		satisfy: "ALL",
		result: false,
	},
};

function check({ rules, satisfy, result }) {
	const res = checkConditions({ rules, satisfy, log: console.log }, reference);
	assertEq(res, result);
}

describe('checkConditions', () => {
	Object.keys(tests).forEach(name => it(name, () => check(tests[name])));
});

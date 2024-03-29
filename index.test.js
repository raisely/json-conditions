const assert = require("assert");
const checkConditions = require("./index");

const assertEq = assert.equal;

const reference = {
	text: "Monday",
	nested: { val: 6 },
	bool: true,
	negative: false,
	blank: "",
	months: ["January", "February"],
	lunches: [
		{ type: "veg", qty: 1, serve: "Monday" },
		{ type: "any", qty: 2, serve: "Monday" },
		{ type: "any", qty: 3, serve: "Monday" },
	],
	oldNumeric: 4,
	prevNumeric: 5,
	numeric: 5,
};

const tests = {
	eq: {
		rules: [{ op: "eq", property: "text", value: "Monday" }],
		result: true,
	},
	"fuzzy eq": {
		rules: [{ op: "eq", property: "nested.val", value: "6" }],
		result: true,
	},
	startsWith: {
		rules: [{ op: "startsWith", property: "text", value: "Mon" }],
		result: true,
	},
	endsWith: {
		rules: [{ op: "endsWith", property: "text", value: "day" }],
		result: true,
	},
	contains: {
		rules: [{ op: "contains", property: "text", value: "nd" }],
		result: true,
	},
	neq: {
		rules: [{ op: "neq", property: "nested.val", value: "5" }],
		result: true,
	},
	ne: {
		rules: [{ op: "ne", property: "nested.val", value: "5" }],
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
	empty: { rules: [{ op: "empty", property: "missing" }], result: true },
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
	"All Required - Passed, Satisfy ALL": {
		rules: [
			{ op: "eq", property: "text", value: "Monday", required: true },
			{ op: "eq", property: "negative", value: "false", required: true },
			{ op: "eq", property: "nested.val", value: 6, required: true },
		],
		satisfy: "ALL",
		result: true,
	},
	"All Required - Passed, Satisfy ANY": {
		rules: [
			{ op: "eq", property: "text", value: "Monday", required: true },
			{ op: "eq", property: "negative", value: "false", required: true },
			{ op: "eq", property: "nested.val", value: 6, required: true },
		],
		satisfy: "ANY",
		result: true,
	},
	"All Required - Failed, Satisfy ALL": {
		rules: [
			{ op: "eq", property: "text", value: "Tuesday", required: true },
			{ op: "eq", property: "negative", value: "true", required: true },
			{ op: "eq", property: "nested.val", value: 6, required: true },
		],
		satisfy: "ALL",
		result: false,
	},
	"All Required - Failed, Satisfy ANY": {
		rules: [
			{ op: "eq", property: "text", value: "Tuesday", required: true },
			{ op: "eq", property: "negative", value: "true", required: true },
			{ op: "eq", property: "nested.val", value: 6, required: true },
		],
		satisfy: "ANY",
		result: false,
	},
	"Array of strings, match some": {
		rules: [
			{
				property: "months[]",
				op: "some",
				value: "January",
			},
		],
		satisfy: "ANY",
		result: true,
	},
	"Array of strings, match some (no match)": {
		rules: [
			{
				property: "months[]",
				op: "some",
				value: "September",
			},
		],
		satisfy: "ANY",
		result: false,
	},
	"Array of strings, match none": {
		rules: [
			{
				property: "months[]",
				op: "none",
				value: "December",
			},
		],
		satisfy: "ANY",
		result: true,
	},
	"Array of strings, match none (no match)": {
		rules: [
			{
				property: "months[]",
				op: "none",
				value: "February",
			},
		],
		satisfy: "ANY",
		result: false,
	},
	"Array of objects, match all": {
		rules: [
			{
				property: "lunches[].serve",
				op: "all",
				value: "Monday",
			},
		],
		satisfy: "ANY",
		result: true,
	},
	"Array of objects, match all (no match)": {
		rules: [
			{
				property: "lunches[].type",
				op: "all",
				value: "veg",
			},
		],
		satisfy: "ANY",
		result: false,
	},
	"Array of objects, match some": {
		rules: [
			{
				property: "lunches[].type",
				op: "some",
				value: "veg",
			},
		],
		satisfy: "ANY",
		result: true,
	},
	"Array of objects, match some (no match)": {
		rules: [
			{
				property: "lunches[].type",
				op: "some",
				value: "pescatarian",
			},
		],
		satisfy: "ANY",
		result: false,
	},
	"Array of objects, match none": {
		rules: [
			{
				property: "lunches[].type",
				op: "none",
				value: "pescatarian",
			},
		],
		satisfy: "ANY",
		result: true,
	},
	"Non-Array of objects, match none": {
		rules: [
			{
				property: "lunches[].nothing",
				op: "none",
				value: "pescatarian",
			},
		],
		satisfy: "ANY",
		result: true,
	},
	"Array of objects, match none (no match)": {
		rules: [
			{
				property: "lunches[].type",
				op: "none",
				value: "veg",
			},
		],
		satisfy: "ANY",
		result: false,
	},
	"Crosses (current value is equal, prev value was less)": {
		rules: [
			{
				property: "numeric",
				op: "crosses",
				value: 5,
			},
		],
		satisfy: "ANY",
		previousValueFn: (ref) => ref.oldNumeric,
		result: true,
	},
	"Crosses (prev value was equal)": {
		rules: [
			{
				property: "numeric",
				op: "crosses",
				value: 5,
			},
		],
		satisfy: "ANY",
		previousValueFn: (ref, property) =>
			ref[`prevN${property.substring(1)}`],
		result: false,
	},
	"Transform value": {
		rules: [
			{
				property: "nested.val",
				op: "gt",
				value: "numeric",
			},
		],
		satisfy: "ANY",
		transformValueFn: (value, ref, property) => ref[value],
		result: true,
	},
};

function check({ rules, satisfy, previousValueFn, transformValueFn, result }) {
	const res = checkConditions(
		{ rules, satisfy, log: console.log, previousValueFn, transformValueFn },
		reference
	);
	assertEq(res, result);
}

describe("checkConditions", () => {
	Object.keys(tests).forEach((name) => it(name, () => check(tests[name])));
});

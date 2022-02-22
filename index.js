const get = require("lodash/get");
const toString = require("lodash/toString");

/**
 * @param {object} settings
 * @param {object[]} settings.rules array of rules { property, op, value, required }
 * @param {string} settings.satisfy 'ALL' or 'ANY'
 * @param {function} settings.log Function to log the evaluation process for debugging
 * @param {object} testReference The object under test
 * @returns {boolean} Null if there are no rules,therwise true/alse depending on if testReference
 */
function checkConditions(settings, reference) {
	if (!(settings && Array.isArray(settings.rules))) return null;

	let debugStr = "";
	let requiredPassed = 0;
	let normalPassed = 0;

	// build an array of booleans based on the test results
	const results = settings.rules.map((rule, index) => {
		let error;
		if (!rule.property) {
			error = new Error(`Property not specified for rule ${index}`);
			error.rule = rule;
			throw error;
		}
		let value = get(reference, rule.property);
		if (rule.property.includes("[]")) {
			let [topPath, nestedPath] = rule.property.split("[]");
			nestedPath = nestedPath.substring(1);
			value = get(reference, topPath).map((item) =>
				nestedPath ? get(item, nestedPath) : item
			);
		}
		let altComparison = null;
		if (
			typeof value === "boolean" &&
			(typeof rule.value === "string" || rule.value instanceof String)
		) {
			if (rule.value.toLowerCase() === "false") altComparison = false;
			if (rule.value.toLowerCase() === "true") altComparison = true;
		}
		let result;
		switch (rule.op) {
			case "eq":
				result = value == rule.value;
				if (altComparison !== null)
					result = result || value == altComparison;
				break;
			case "ne":
			case "neq":
				result = value != rule.value;
				if (altComparison !== null)
					result = result || value != altComparison;
				break;
			case "gt":
				result = value > rule.value;
				break;
			case "gte":
				result = value >= rule.value;
				break;
			case "lt":
				result = value < rule.value;
				break;
			case "lte":
				result = value <= rule.value;
				break;
			case "startsWith":
				result = toString(value).startsWith(rule.value);
				break;
			case "endsWith":
				result = toString(value).endsWith(rule.value);
				break;
			case "contains":
				result = toString(value).includes(rule.value);
				break;
			case "present":
				result = !!value;
				break;
			case "empty":
			case "absent":
				result = !value;
				break;
			case "all":
				// To match all, check we can't find at least 1
				// value that doesn't match the expected value
				result =
					Array.isArray(value) &&
					!value.find((v) => v !== rule.value);
				break;
			case "some":
				result = Array.isArray(value) && value.includes(rule.value);
				break;
			case "none":
				result = Array.isArray(value) && !value.includes(rule.value);
				break;
			case "crosses":
				console.log(typeof settings.previousValueFn);
				if (typeof settings.previousValueFn !== "function") {
					throw new Error(
						'Comparison "crosses" selected, but no function supplied to return previous value'
					);
				}
				const lastValue = settings.previousValueFn(
					reference,
					rule.property
				);
				result = rule.value > lastValue && rule.value <= value;
				debugStr = `(${index}) ${rule.property} was ${lastValue} and became ${value}. crossed ${rule.value}? ${result}\n`;
				break;
			default:
				error = new Error(`Unknown comparison for rule (${rule.op})`);
				error.rule = rule;
				throw error;
		}
		if (result) {
			if (rule.required) requiredPassed += 1;
			else normalPassed += 1;
		}
		if (!debugStr) {
			const unary = ["absent", "present"].includes(rule.op);
			debugStr += `(${index}) ${rule.property} (${value}) ${
				unary ? "is" : ""
			} ${rule.op} ${unary ? "" : rule.value}? ${result}\n`;
		}
		return result;
	});

	const requiredTotal = settings.rules.reduce(
		(total, rule) => total + (rule.required ? 1 : 0),
		0
	);
	const normalTotal = settings.rules.length - requiredTotal;

	// Count how many conditions passed
	const satisfy = settings.satisfy || "ANY";

	const requiredSatisfied =
		!requiredTotal || requiredTotal === requiredPassed;
	const normalSatisfied =
		satisfy === "ALL" ? normalPassed === normalTotal : normalPassed > 0;
	const outcome = normalSatisfied && requiredSatisfied;

	debugStr += `Passed ${normalPassed} / ${normalTotal} (need ${satisfy}, ${
		normalSatisfied ? "pass" : "fail"
	})`;
	if (requiredTotal > 0)
		debugStr += `, and ${requiredPassed} / ${requiredTotal} required conditions (${
			requiredSatisfied ? "pass" : "fail"
		})`;
	debugStr += ` (${outcome ? "PASS" : "FAIL"})`;
	if (settings.log) settings.log(debugStr);

	// test the result
	return outcome;
}

module.exports = checkConditions;

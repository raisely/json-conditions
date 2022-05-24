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

		let targetValue = rule.value;
		if (typeof settings.transformValueFn === "function") {
			targetValue = settings.transformValueFn(
				targetValue,
				reference,
				rule.property
			);
		}
		let altComparison = null;
		if (
			typeof value === "boolean" &&
			(typeof targetValue === "string" || targetValue instanceof String)
		) {
			if (targetValue.toLowerCase() === "false") altComparison = false;
			if (targetValue.toLowerCase() === "true") altComparison = true;
		}
		let result;
		switch (rule.op) {
			case "eq":
				result = value == targetValue;
				if (altComparison !== null)
					result = result || value == altComparison;
				break;
			case "ne":
			case "neq":
				result = value != targetValue;
				if (altComparison !== null)
					result = result || value != altComparison;
				break;
			case "gt":
				result = value > targetValue;
				break;
			case "gte":
				result = value >= targetValue;
				break;
			case "lt":
				result = value < targetValue;
				break;
			case "lte":
				result = value <= targetValue;
				break;
			case "startsWith":
				result = toString(value).startsWith(targetValue);
				break;
			case "endsWith":
				result = toString(value).endsWith(targetValue);
				break;
			case "contains":
				result = toString(value).includes(targetValue);
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
					!value.find((v) => v !== targetValue);
				break;
			case "some":
				result = Array.isArray(value) && value.includes(targetValue);
				break;
			case "none":
				result = Array.isArray(value) && !value.includes(targetValue);
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
				result = targetValue > lastValue && targetValue <= value;
				debugStr = `(${index}) ${rule.property} was ${lastValue} and became ${value}. crossed ${targetValue}? ${result}\n`;
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
			} ${rule.op} ${unary ? "" : targetValue}? ${result}\n`;
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
		!normalTotal ||
		(satisfy === "ALL" ? normalPassed === normalTotal : normalPassed > 0);
	const outcome = normalSatisfied && requiredSatisfied;

	if (normalTotal > 0) {
		debugStr += `Passed ${normalPassed} / ${normalTotal} (need ${satisfy}, ${
			normalSatisfied ? "pass" : "fail"
		})\n`;
	}
	if (requiredTotal > 0)
		debugStr += `Passed ${requiredPassed} / ${requiredTotal} required conditions (${
			requiredSatisfied ? "pass" : "fail"
		})\n`;
	debugStr += `Result: ${outcome ? "PASS" : "FAIL"}`;
	if (settings.log) settings.log(debugStr);

	// test the result
	return outcome;
}

module.exports = checkConditions;

// ===================================
// DOM Elements
// ===================================
const form = document.getElementById("mortgageForm");
const clearAllBtn = document.getElementById("clearAll");
const emptyState = document.getElementById("emptyState");
const resultsDisplay = document.getElementById("resultsDisplay");
const monthlyPaymentEl = document.getElementById("monthlyPayment");
const totalPaymentEl = document.getElementById("totalPayment");

// Form inputs
const mortgageAmountInput = document.getElementById("mortgageAmount");
const mortgageTermInput = document.getElementById("mortgageTerm");
const interestRateInput = document.getElementById("interestRate");
const mortgageTypeInputs = document.getElementsByName("mortgageType");

// Error message elements
const mortgageAmountError = document.getElementById("mortgageAmountError");
const mortgageTermError = document.getElementById("mortgageTermError");
const interestRateError = document.getElementById("interestRateError");
const mortgageTypeError = document.getElementById("mortgageTypeError");

// ===================================
// Utility Functions
// ===================================

/**
 * Format number with commas for thousands separator
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
function formatNumberWithCommas(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Remove commas from number string
 * @param {string} str - The string to clean
 * @returns {string} Clean number string
 */
function removeCommas(str) {
  return str.replace(/,/g, "");
}

/**
 * Format currency (GBP)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  return `£${formatNumberWithCommas(amount.toFixed(2))}`;
}

/**
 * Parse input value to float
 * @param {string} value - The value to parse
 * @returns {number} Parsed float value
 */
function parseInputValue(value) {
  return parseFloat(removeCommas(value)) || 0;
}

/**
 * Show error message for a field
 * @param {HTMLElement} errorElement - The error message element
 * @param {HTMLElement} inputWrapper - The input wrapper element
 * @param {string} message - The error message
 */
function showError(errorElement, inputWrapper, message) {
  errorElement.textContent = message;
  inputWrapper.classList.add("error");
}

/**
 * Clear error message for a field
 * @param {HTMLElement} errorElement - The error message element
 * @param {HTMLElement} inputWrapper - The input wrapper element
 */
function clearError(errorElement, inputWrapper) {
  errorElement.textContent = "";
  inputWrapper.classList.remove("error");
}

// ===================================
// Input Formatting
// ===================================

/**
 * Format input as user types (add commas)
 * @param {HTMLInputElement} input - The input element
 */
function formatInputOnType(input) {
  const cursorPosition = input.selectionStart;
  const oldLength = input.value.length;
  const cleanValue = removeCommas(input.value);

  // Only allow numbers and decimal point
  const validValue = cleanValue.replace(/[^\d.]/g, "");

  // Prevent multiple decimal points
  const parts = validValue.split(".");
  let formattedValue = parts[0];

  if (parts.length > 1) {
    formattedValue += "." + parts.slice(1).join("");
  }

  // Add commas to the integer part
  const [integerPart, decimalPart] = formattedValue.split(".");
  let formatted = formatNumberWithCommas(integerPart);

  if (decimalPart !== undefined) {
    formatted += "." + decimalPart;
  }

  input.value = formatted;

  // Restore cursor position
  const newLength = input.value.length;
  const diff = newLength - oldLength;
  input.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
}

// Add input event listeners for formatting
mortgageAmountInput.addEventListener("input", (e) =>
  formatInputOnType(e.target)
);
mortgageTermInput.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/[^\d]/g, "");
});
interestRateInput.addEventListener("input", (e) => {
  const value = e.target.value.replace(/[^\d.]/g, "");
  const parts = value.split(".");
  if (parts.length > 2) {
    e.target.value = parts[0] + "." + parts.slice(1).join("");
  } else {
    e.target.value = value;
  }
});

// ===================================
// Validation
// ===================================

/**
 * Validate form inputs
 * @returns {boolean} True if form is valid
 */
function validateForm() {
  let isValid = true;

  // Validate mortgage amount
  const mortgageAmount = parseInputValue(mortgageAmountInput.value);
  const mortgageAmountWrapper = mortgageAmountInput.closest(".input-wrapper");

  if (!mortgageAmountInput.value.trim() || mortgageAmount <= 0) {
    showError(
      mortgageAmountError,
      mortgageAmountWrapper,
      "This field is required"
    );
    isValid = false;
  } else {
    clearError(mortgageAmountError, mortgageAmountWrapper);
  }

  // Validate mortgage term
  const mortgageTerm = parseInputValue(mortgageTermInput.value);
  const mortgageTermWrapper = mortgageTermInput.closest(".input-wrapper");

  if (!mortgageTermInput.value.trim() || mortgageTerm <= 0) {
    showError(mortgageTermError, mortgageTermWrapper, "This field is required");
    isValid = false;
  } else {
    clearError(mortgageTermError, mortgageTermWrapper);
  }

  // Validate interest rate
  const interestRate = parseInputValue(interestRateInput.value);
  const interestRateWrapper = interestRateInput.closest(".input-wrapper");

  if (!interestRateInput.value.trim() || interestRate <= 0) {
    showError(interestRateError, interestRateWrapper, "This field is required");
    isValid = false;
  } else {
    clearError(interestRateError, interestRateWrapper);
  }

  return isValid;
}

// ===================================
// Mortgage Calculation
// ===================================

/**
 * Calculate mortgage repayments
 * @param {number} principal - Loan amount
 * @param {number} years - Loan term in years
 * @param {number} annualRate - Annual interest rate (percentage)
 * @param {string} type - Mortgage type ('repayment' or 'interestOnly')
 * @returns {Object} Calculation results
 */
function calculateMortgage(principal, years, annualRate, type) {
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = years * 12;

  let monthlyPayment;
  let totalPayment;

  if (type === "interestOnly") {
    // Interest Only: Monthly payment is just the interest
    monthlyPayment = principal * monthlyRate;
    // Total payment is interest over term plus principal at the end
    totalPayment = monthlyPayment * numberOfPayments + principal;
  } else {
    // Repayment (Amortizing): Using standard mortgage formula
    // M = P [ r(1 + r)^n ] / [ (1 + r)^n - 1 ]
    if (monthlyRate === 0) {
      monthlyPayment = principal / numberOfPayments;
    } else {
      const x = Math.pow(1 + monthlyRate, numberOfPayments);
      monthlyPayment = (principal * (monthlyRate * x)) / (x - 1);
    }
    totalPayment = monthlyPayment * numberOfPayments;
  }

  return {
    monthlyPayment: monthlyPayment,
    totalPayment: totalPayment,
  };
}

/**
 * Display calculation results
 * @param {number} monthlyPayment - Monthly payment amount
 * @param {number} totalPayment - Total payment amount
 */
function displayResults(monthlyPayment, totalPayment) {
  monthlyPaymentEl.textContent = formatCurrency(monthlyPayment);
  totalPaymentEl.textContent = formatCurrency(totalPayment);

  // Hide empty state and show results
  emptyState.hidden = true;
  resultsDisplay.hidden = false;

  // Animate results (fade in)
  resultsDisplay.style.opacity = "0";
  setTimeout(() => {
    resultsDisplay.style.transition = "opacity 0.3s ease";
    resultsDisplay.style.opacity = "1";
  }, 10);
}

// ===================================
// Form Submission
// ===================================

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  // Get form values
  const mortgageAmount = parseInputValue(mortgageAmountInput.value);
  const mortgageTerm = parseInputValue(mortgageTermInput.value);
  const interestRate = parseInputValue(interestRateInput.value);

  // Get selected mortgage type
  let mortgageType = "repayment";
  for (const input of mortgageTypeInputs) {
    if (input.checked) {
      mortgageType = input.value;
      break;
    }
  }

  // Calculate mortgage
  const results = calculateMortgage(
    mortgageAmount,
    mortgageTerm,
    interestRate,
    mortgageType
  );

  // Display results
  displayResults(results.monthlyPayment, results.totalPayment);
});

// ===================================
// Clear All Functionality
// ===================================

clearAllBtn.addEventListener("click", () => {
  // Reset form
  form.reset();

  // Clear all error messages
  clearError(
    mortgageAmountError,
    mortgageAmountInput.closest(".input-wrapper")
  );
  clearError(mortgageTermError, mortgageTermInput.closest(".input-wrapper"));
  clearError(interestRateError, interestRateInput.closest(".input-wrapper"));

  // Hide results and show empty state
  resultsDisplay.hidden = true;
  emptyState.hidden = false;

  // Focus on first input
  mortgageAmountInput.focus();
});

// ===================================
// Clear errors on input change
// ===================================

mortgageAmountInput.addEventListener("input", () => {
  if (mortgageAmountError.textContent) {
    clearError(
      mortgageAmountError,
      mortgageAmountInput.closest(".input-wrapper")
    );
  }
});

mortgageTermInput.addEventListener("input", () => {
  if (mortgageTermError.textContent) {
    clearError(mortgageTermError, mortgageTermInput.closest(".input-wrapper"));
  }
});

interestRateInput.addEventListener("input", () => {
  if (interestRateError.textContent) {
    clearError(interestRateError, interestRateInput.closest(".input-wrapper"));
  }
});

// ===================================
// Keyboard Navigation Enhancement
// ===================================

// Allow Enter key to submit from any input
const inputs = [mortgageAmountInput, mortgageTermInput, interestRateInput];
inputs.forEach((input) => {
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      form.requestSubmit();
    }
  });
});

// ===================================
// Initialization
// ===================================

// Ensure empty state is shown on page load
document.addEventListener("DOMContentLoaded", () => {
  emptyState.hidden = false;
  resultsDisplay.hidden = true;
});

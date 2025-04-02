/**
 * Validation Utility for Project-TMS
 * Provides common validation functions for forms and data
 */
class ValidationUtils {
    /**
     * Validate a required field
     * @param {string} value - Field value to validate
     * @param {string} [fieldName='field'] - Name of the field for error message
     * @returns {Object} Validation result { valid: boolean, message: string }
     */
    static required(value, fieldName = 'field') {
        const valid = !!value && typeof value === 'string' && value.trim() !== '';
        return {
            valid,
            message: valid ? '' : `${fieldName} is required`
        };
    }
    
    /**
     * Validate minimum length
     * @param {string} value - Field value to validate
     * @param {number} minLength - Minimum length required
     * @param {string} [fieldName='field'] - Name of the field for error message
     * @returns {Object} Validation result { valid: boolean, message: string }
     */
    static minLength(value, minLength, fieldName = 'field') {
        const valid = typeof value === 'string' && value.length >= minLength;
        return {
            valid,
            message: valid ? '' : `${fieldName} must be at least ${minLength} characters`
        };
    }
    
    /**
     * Validate maximum length
     * @param {string} value - Field value to validate
     * @param {number} maxLength - Maximum length allowed
     * @param {string} [fieldName='field'] - Name of the field for error message
     * @returns {Object} Validation result { valid: boolean, message: string }
     */
    static maxLength(value, maxLength, fieldName = 'field') {
        const valid = typeof value === 'string' && value.length <= maxLength;
        return {
            valid,
            message: valid ? '' : `${fieldName} must be no more than ${maxLength} characters`
        };
    }
    
    /**
     * Validate a date
     * @param {string} value - Date string to validate
     * @param {string} [fieldName='date'] - Name of the field for error message
     * @returns {Object} Validation result { valid: boolean, message: string }
     */
    static date(value, fieldName = 'date') {
        if (!value) {
            return { valid: true, message: '' }; // Allow empty dates
        }
        
        const dateObj = new Date(value);
        const valid = !isNaN(dateObj.getTime());
        
        return {
            valid,
            message: valid ? '' : `${fieldName} is not a valid date`
        };
    }
    
    /**
     * Validate a date is in the future
     * @param {string} value - Date string to validate
     * @param {string} [fieldName='date'] - Name of the field for error message
     * @returns {Object} Validation result { valid: boolean, message: string }
     */
    static futureDate(value, fieldName = 'date') {
        if (!value) {
            return { valid: true, message: '' }; // Allow empty dates
        }
        
        const dateObj = new Date(value);
        if (isNaN(dateObj.getTime())) {
            return {
                valid: false,
                message: `${fieldName} is not a valid date`
            };
        }
        
        // Compare with today (ignoring time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const inputDate = new Date(dateObj);
        inputDate.setHours(0, 0, 0, 0);
        
        const valid = inputDate >= today;
        
        return {
            valid,
            message: valid ? '' : `${fieldName} must be a future date`
        };
    }
    
    /**
     * Validate date range (end date comes after start date)
     * @param {string} startDate - Start date string
     * @param {string} endDate - End date string
     * @returns {Object} Validation result { valid: boolean, message: string }
     */
    static dateRange(startDate, endDate) {
        if (!startDate || !endDate) {
            return { valid: true, message: '' }; // Allow empty dates
        }
        
        const startObj = new Date(startDate);
        const endObj = new Date(endDate);
        
        if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
            return {
                valid: false,
                message: 'One or both dates are invalid'
            };
        }
        
        // Set time to midnight for pure date comparison
        startObj.setHours(0, 0, 0, 0);
        endObj.setHours(0, 0, 0, 0);
        
        const valid = endObj >= startObj;
        
        return {
            valid,
            message: valid ? '' : 'End date must be after start date'
        };
    }
    
    /**
     * Validate a form element, applying validation classes
     * @param {HTMLElement} element - Element to validate
     * @param {function|Array<function>} validators - Validation function(s) to use
     * @returns {boolean} True if valid, false otherwise
     */
    static validateElement(element, validators) {
        if (!element) return false;
        
        // Handle single validator (not in array)
        if (typeof validators === 'function') {
            validators = [validators];
        }
        
        // Get feedback element
        const feedbackElement = element.parentNode.querySelector('.invalid-feedback');
        
        // Reset state
        element.classList.remove('is-valid', 'is-invalid');
        if (feedbackElement) {
            feedbackElement.textContent = '';
            feedbackElement.classList.remove('visible');
        }
        
        // Apply each validator
        for (const validator of validators) {
            const result = validator(element.value);
            
            if (!result.valid) {
                element.classList.add('is-invalid');
                
                if (feedbackElement && result.message) {
                    feedbackElement.textContent = result.message;
                    feedbackElement.classList.add('visible');
                }
                
                return false;
            }
        }
        
        // If we got here, all validations passed
        element.classList.add('is-valid');
        return true;
    }
    
    /**
     * Validate an entire form
     * @param {HTMLFormElement} form - Form to validate
     * @param {Object} validationRules - Validation rules mapping field IDs to validators
     * @returns {boolean} True if all valid, false otherwise
     */
    static validateForm(form, validationRules) {
        if (!form || !validationRules) return false;
        
        let isValid = true;
        
        // Validate each field with rules
        Object.keys(validationRules).forEach(fieldId => {
            const element = form.elements[fieldId] || document.getElementById(fieldId);
            if (element) {
                const fieldValid = this.validateElement(element, validationRules[fieldId]);
                isValid = isValid && fieldValid;
            }
        });
        
        return isValid;
    }
    
    /**
     * Create a custom validator function
     * @param {function} validationFn - Function that returns true/false
     * @param {string} errorMessage - Error message to display
     * @returns {function} Validator function
     */
    static createValidator(validationFn, errorMessage) {
        return (value) => {
            const valid = validationFn(value);
            return {
                valid,
                message: valid ? '' : errorMessage
            };
        };
    }
}

// Make ValidationUtils available globally
window.ValidationUtils = ValidationUtils;
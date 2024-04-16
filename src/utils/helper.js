const validator = require('validator')

const validateInputs = (fields) => {

    for(const field of fields) {
        if (validator.isEmpty(field)) {
            console.log('asd')
            return false;
        }
    }

    return true;

}

module.exports = validateInputs
const ethUtil = require('ethereumjs-util');
const abi = require('ethereumjs-abi');


function initialize(typedData, domain, message) {
    typedData.domain = domain;
    typedData.message = message;
}

function dependencies(types, primaryType, found = []) {
    if (found.includes(primaryType)) {
        return found;
    }
    if (types[primaryType] === undefined) {
        return found;
    }
    found.push(primaryType);
    for (let field of types[primaryType]) {
        for (let dep of dependencies(types, field.type, found)) {
            if (!found.includes(dep)) {
                found.push(dep);
            }
        }
    }
    return found;
}

function encodeType(types, primaryType) {
    // Get dependencies primary first, then alphabetical
    let deps = dependencies(types, primaryType);
    deps = deps.filter(t => t != primaryType);
    deps = [primaryType].concat(deps.sort());

    // Format as a string with fields
    let result = '';
    for (let type of deps) {
        result += `${type}(${types[type].map(({ name, type }) => `${type} ${name}`).join(',')})`;
    }
    return result;
}

function typeHash(types, primaryType) {
    return ethUtil.keccakFromString(encodeType(types, primaryType), 256);
}

function encodeData(types, primaryType, data) {
    let encTypes = [];
    let encValues = [];

    // Add typehash
    encTypes.push('bytes32');
    encValues.push(typeHash(types, primaryType));

    // Add field contents
    for (let field of types[primaryType]) {
        let value = data[field.name];
        if (field.type == 'string' || field.type == 'bytes') {
            encTypes.push('bytes32');
            value = ethUtil.keccakFromString(value, 256);
            encValues.push(value);
        } else if (types[field.type] !== undefined) {
            encTypes.push('bytes32');
            value = ethUtil.keccak256(encodeData(types, field.type, value));
            encValues.push(value);
        } else if (field.type.lastIndexOf(']') === field.type.length - 1) {
            throw 'TODO: Arrays currently unimplemented in encodeData';
        } else {
            encTypes.push(field.type);
            encValues.push(value);
        }
    }

    return abi.rawEncode(encTypes, encValues);
}

function structHash(types, primaryType, data) {
    return ethUtil.keccak256(encodeData(types, primaryType, data));
}

function signHash(typedData) {
    return ethUtil.keccak256(
        Buffer.concat([
            Buffer.from('1901', 'hex'),
            structHash(typedData.types, 'EIP712Domain', typedData.domain),
            structHash(typedData.types, typedData.primaryType, typedData.message),
        ]),
    );
}

function prepareSignature(typedData, domain, message, privateKeyStr, checkAddress = false, address = undefined) {
    const privateKey = Buffer.from(privateKeyStr, "hex");

    initialize(typedData, domain, message);

    //check if you are signing with correct account
    if (checkAddress) {
        const address = (ethUtil.bufferToHex(ethUtil.privateToAddress(privateKey))).toString();

        if (address != address.toLowerCase()){
            throw `Invalid privateKey for address: ${address}`;
        }
    }
    
    const sig = ethUtil.ecsign(signHash(typedData), privateKey);

    const vrs = {
        v: parseInt(ethUtil.bufferToHex(sig.v), 16),
        r: ethUtil.bufferToHex(sig.r),
        s: ethUtil.bufferToHex(sig.s)
    }

    return vrs;
}

function hashTyped(typedData, domain, message) {
    
    initialize(typedData, domain, message);

    return ethUtil.bufferToHex(ethUtil.keccak256(encodeData(typedData.types, typedData.primaryType, typedData.message)));
}

module.exports = {
    encodeType,
    typeHash,
    encodeData,
    structHash,
    signHash,
    prepareSignature, 
    hashTyped
};

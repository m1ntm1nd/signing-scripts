const chai = require('chai');
const ethUtil = require('ethereumjs-util');
const expect = chai.expect;

const { encodeType,
    typeHash,
    encodeData,
    structHash,
    signHash,
    prepareSignature, 
    hashTyped 
} = require("../scripts/signTypedData");

const privateKey = ethUtil.keccakFromString('cow', 256);
const address = ethUtil.privateToAddress(privateKey);


const typedData = {
    types: {
        EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
        ],
        Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' }
        ],
        Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' }
        ],
    },
    primaryType: 'Mail',
    domain: undefined,
    message: undefined
};

const domain = {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
};

const message = {
    from: {
        name: 'Cow',
        wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
    },
    to: {
        name: 'Bob',
        wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
    },
    contents: 'Hello, Bob!',
};

const hash = hashTyped(typedData, domain, message);
const sig = prepareSignature(typedData, domain, message, privateKey, true, address);

//EIP provided tests
expect(encodeType(typedData.types, 'Mail')).to.equal('Mail(Person from,Person to,string contents)Person(string name,address wallet)');
expect(ethUtil.bufferToHex(typeHash(typedData.types,'Mail'))).to.equal(
    '0xa0cedeb2dc280ba39b857546d74f5549c3a1d7bdc2dd96bf881f76108e23dac2',
);
expect(ethUtil.bufferToHex(encodeData(typedData.types, typedData.primaryType, typedData.message))).to.equal(
    '0xa0cedeb2dc280ba39b857546d74f5549c3a1d7bdc2dd96bf881f76108e23dac2fc71e5fa27ff56c350aa531bc129ebdf613b772b6604664f5d8dbe21b85eb0c8cd54f074a4af31b4411ff6a60c9719dbd559c221c8ac3492d9d872b041d703d1b5aadf3154a261abdd9086fc627b61efca26ae5702701d05cd2305f7c52a2fc8',
);
expect(ethUtil.bufferToHex(structHash(typedData.types, typedData.primaryType, typedData.message))).to.equal(
    '0xc52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e',
);
expect(ethUtil.bufferToHex(structHash(typedData.types, 'EIP712Domain', typedData.domain))).to.equal(
    '0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f',
);
expect(ethUtil.bufferToHex(signHash(typedData))).to.equal('0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2');
expect(ethUtil.bufferToHex(address)).to.equal('0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826');

//tests export func
expect(hash).to.equal(
    '0xc52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e',
);
expect(sig.v).to.equal(28);
expect(sig.r).to.equal('0x4355c47d63924e8a72e509b65029052eb6c299d53a04e167c5775fd466751c9d');
expect(sig.s).to.equal('0x07299936d304c153f6443dfa05f40ff007d72911b6f72307f996231605b91562');

console.log('ALL TESTS PASSED!');
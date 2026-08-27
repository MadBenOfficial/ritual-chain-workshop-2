// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockScheduler {
    uint256 public nextId;
    mapping(uint256 => uint8) public state;
    bytes public lastData;
    uint32 public lastGasLimit;
    uint32 public lastStartBlock;
    uint32 public lastNumCalls;
    uint32 public lastFrequency;
    uint32 public lastTtl;
    address public lastPayer;

    function approveScheduler(address) external {}

    function schedule(
        bytes calldata data,
        uint32 gasLimit,
        uint32 startBlock,
        uint32 numCalls,
        uint32 frequency,
        uint32 ttl,
        uint256,
        uint256,
        uint256,
        address payer
    ) external returns (uint256 callId) {
        lastData = data;
        lastGasLimit = gasLimit;
        lastStartBlock = startBlock;
        lastNumCalls = numCalls;
        lastFrequency = frequency;
        lastTtl = ttl;
        lastPayer = payer;
        callId = ++nextId;
        state[callId] = 0;
    }

    function cancel(uint256 callId) external {
        state[callId] = 3;
    }

    function getCallState(uint256 callId) external view returns (uint8) {
        return state[callId];
    }
}

contract MockRitualWallet {
    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public lockUntil;

    function deposit(uint256 lockDuration) external payable {
        balanceOf[msg.sender] += msg.value;
        lockUntil[msg.sender] = block.number + lockDuration;
    }
}

contract MockRegistry {
    address public executor;
    bool public available;
    bool public finalized = true;

    function configure(address executor_, bool available_) external {
        executor = executor_;
        available = available_;
    }

    function setFinalized(bool finalized_) external {
        finalized = finalized_;
    }

    function getCapabilityIndexStatus()
        external
        view
        returns (uint256, uint256, bool, bool)
    {
        return (1, 1, true, finalized);
    }

    function pickServiceByCapability(uint8, bool, uint256, uint256)
        external
        view
        returns (address teeAddress, bool found)
    {
        return (executor, available);
    }

    struct NodeInfo {
        address paymentAddress;
        address teeAddress;
        uint8 teeType;
        bytes publicKey;
        string endpoint;
        bytes32 certPubKeyHash;
        uint8 capability;
    }

    struct Service {
        NodeInfo node;
        bool isValid;
        bytes32 workloadId;
    }

    function getServicesByCapability(uint8 capability, bool)
        external
        view
        returns (Service[] memory services)
    {
        if (!available) return new Service[](0);
        services = new Service[](1);
        services[0] = Service({
            node: NodeInfo({
                paymentAddress: executor,
                teeAddress: executor,
                teeType: 0,
                publicKey: bytes("mock-key"),
                endpoint: "local",
                certPubKeyHash: bytes32(0),
                capability: capability
            }),
            isValid: true,
            workloadId: bytes32(uint256(1))
        });
    }
}

contract MockHttp {
    uint16 public status;
    uint256 public value;
    string public errorMessage;
    bool public malformed;

    function configure(
        uint16 status_,
        uint256 value_,
        string calldata errorMessage_,
        bool malformed_
    ) external {
        status = status_;
        value = value_;
        errorMessage = errorMessage_;
        malformed = malformed_;
    }

    fallback(bytes calldata input) external returns (bytes memory) {
        if (malformed) return hex"1234";
        (
            address executor,
            bytes[] memory encryptedSecrets,
            uint256 ttl,
            bytes[] memory secretSignatures,
            bytes memory userPublicKey,
            string memory url,
            uint8 method,
            string[] memory headerKeys,
            string[] memory headerValues,
            bytes memory body,
            uint256 dkmsKeyIndex,
            uint8 dkmsKeyFormat,
            bool piiEnabled
        ) = abi.decode(
                input,
                (
                    address,
                    bytes[],
                    uint256,
                    bytes[],
                    bytes,
                    string,
                    uint8,
                    string[],
                    string[],
                    bytes,
                    uint256,
                    uint8,
                    bool
                )
            );
        require(executor != address(0), "executor missing");
        require(ttl == 100, "wrong HTTP ttl");
        require(method == 1, "wrong HTTP method");
        require(bytes(url).length != 0, "url missing");
        require(encryptedSecrets.length == 0 && secretSignatures.length == 0, "unexpected secrets");
        require(userPublicKey.length == 0 && body.length == 0, "unexpected payload");
        require(headerKeys.length == 0 && headerValues.length == 0, "unexpected headers");
        require(dkmsKeyIndex == 0 && dkmsKeyFormat == 0 && !piiEnabled, "wrong dKMS fields");
        bytes memory inner = abi.encode(
            status,
            new string[](0),
            new string[](0),
            bytes(string.concat('{"value":', _toString(value), "}")),
            errorMessage
        );
        return abi.encode(input, inner);
    }

    function _toString(uint256 number) private pure returns (string memory) {
        if (number == 0) return "0";
        uint256 copy = number;
        uint256 digits;
        while (copy != 0) {
            digits++;
            copy /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (number != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + (number % 10)));
            number /= 10;
        }
        return string(buffer);
    }
}

contract MockJq {
    uint256 public value;
    bool public returnEmpty;

    function configure(uint256 value_, bool returnEmpty_) external {
        value = value_;
        returnEmpty = returnEmpty_;
    }

    fallback(bytes calldata input) external returns (bytes memory) {
        (string memory query, string memory json, uint8 outputType) = abi.decode(
            input,
            (string, string, uint8)
        );
        require(bytes(query).length != 0 && bytes(json).length != 0, "empty JQ input");
        require(outputType == 1, "wrong JQ output type");
        if (returnEmpty) return bytes("");
        return abi.encode(value);
    }
}

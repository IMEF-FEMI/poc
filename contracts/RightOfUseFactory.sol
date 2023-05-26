pragma solidity ^0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "hardhat/console.sol";
import "./RightOfUseCertificate.sol";
import "./Verify.sol";


contract RightOfUseFactory is Ownable, VerifySignature {
    using EnumerableSet for EnumerableSet.AddressSet;

    // Set to store the addresses of different right of use contracts
    EnumerableSet.AddressSet private rightOfUseCertificateRequests;
    // Mapping to store the role of each address
    mapping(address => Role) public roles;

    mapping(address => uint256) public nonces;

    // Enum for different roles
    enum Role {
        NO_ROLE,
        DEMATERIALIZATION_OPERATOR,
        HOD_DOCUMENTATION,
        HEAD_OF_CENTRE,
        DDU_DIRECTOR,
        HEAD_OF_DEPARTMENT_AD
    }


    // Event to emit when a new request is created
    event RequestCreated(address indexed requestAddress);

    // Event to emit when a role is set
    event RoleSet(address indexed account, Role role);

    // Modifier to check if the current role is allowed to set the current stage as passed
    modifier onlyRole(Role _role) {
        require(roles[msg.sender] == _role, "Role not authorized.");
        _;
    }

    // Function to set the role of an address
    function setRole(address _address, Role _role) public onlyOwner {
        roles[_address] = _role;
        emit RoleSet(_address, _role);
    }

    function createNewRequest(
        string memory _userInfoUrl,
        bytes memory _userInfoHash,
        // uint256 _nonce,
        address _dematerialisationOperator,
        bytes memory _signature
    ) public returns (address) {
        bytes32 messageHash = keccak256(abi.encodePacked(_userInfoUrl, _userInfoHash, nonces[_dematerialisationOperator]));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        address signer = recoverSigner(ethSignedMessageHash, _signature);

        require(roles[signer] == Role.DEMATERIALIZATION_OPERATOR, "Signer does not have the DEMATERIALIZATION_OPERATOR role");

        RightOfUseCertificate newRequest = new RightOfUseCertificate(_userInfoUrl, _userInfoHash);
        rightOfUseCertificateRequests.add(address(newRequest));
        emit RequestCreated(address(newRequest));
        nonces[_dematerialisationOperator] += 1;
        return address(newRequest);
    }


    function setUserData(
        address _rightOfUseCertificateRequestAddress,
        address _dematerialisationOperator,
        string memory _userInfoUrl,
        bytes memory _userInfoHash,
        bytes memory _signature
    ) public {
        bytes32 messageHash = keccak256(abi.encodePacked(_userInfoUrl, _userInfoHash, nonces[_dematerialisationOperator]));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        address signer = recoverSigner(ethSignedMessageHash, _signature);

        require(roles[signer] == Role.DEMATERIALIZATION_OPERATOR, "Signer does not have the DEMATERIALIZATION_OPERATOR role");

        RightOfUseCertificate newRequest = RightOfUseCertificate(_rightOfUseCertificateRequestAddress);
        newRequest.setUserData(_userInfoUrl, _userInfoHash);
        nonces[_dematerialisationOperator] += 1;
    }

    function verifyImportedData(
        address _rightOfUseCertificateRequestAddress,
        address _headOfCenter,
        bool _verify,
        bytes memory _signature
    ) public {
        bytes32 messageHash = keccak256(abi.encodePacked(_verify, nonces[_headOfCenter]));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        address signer = recoverSigner(ethSignedMessageHash, _signature);

        require(roles[signer] == Role.HEAD_OF_CENTRE, "Signer does not have the HEAD_OF_CENTRE role");
        RightOfUseCertificate newRequest = RightOfUseCertificate(_rightOfUseCertificateRequestAddress);
        newRequest.verifyImportedData(_verify);
        nonces[_headOfCenter] += 1;
    }

    function generateAndPrintCPFHNotification(
        address _rightOfUseCertificateRequestAddress,
        string memory _cpfhNotificationLetterUrl,
        address _headOfDepartmentAD,
        bytes memory _signature
    ) public {
        bytes32 messageHash = keccak256(abi.encodePacked(_cpfhNotificationLetterUrl, nonces[_headOfDepartmentAD]));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        address signer = recoverSigner(ethSignedMessageHash, _signature);

        require(roles[signer] == Role.HEAD_OF_DEPARTMENT_AD, "Signer does not have the HEAD_OF_DEPARTMENT_AD role");

        RightOfUseCertificate newRequest = RightOfUseCertificate(_rightOfUseCertificateRequestAddress);
        newRequest.generateAndPrintCPFHNotification(_cpfhNotificationLetterUrl);
        nonces[_headOfDepartmentAD] += 1;
    }

    function endorseCPFHNotificationLetter(
        address _rightOfUseCertificateRequestAddress,
        address _headOfCenter,
        bool _endorse,
        bytes memory _signature
    ) public {
        bytes32 messageHash = keccak256(abi.encodePacked(_endorse, nonces[_headOfCenter]));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        address signer = recoverSigner(ethSignedMessageHash, _signature);

        require(roles[signer] == Role.HEAD_OF_CENTRE, "Signer does not have the HEAD_OF_CENTRE role");

        RightOfUseCertificate newRequest = RightOfUseCertificate(_rightOfUseCertificateRequestAddress);
        newRequest.endorseCPFHNotificationLetter(_endorse);
        nonces[_headOfCenter] += 1;
    }


    function validateCPFHNotificationTransmission(
        address _rightOfUseCertificateRequestAddress,
        address _dduDirector,
        bool _validate,
        bytes memory _signature
    ) public {
        bytes32 messageHash = keccak256(abi.encodePacked(_validate, nonces[_dduDirector]));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        address signer = recoverSigner(ethSignedMessageHash, _signature);

        require(roles[signer] == Role.DDU_DIRECTOR, "Signer does not have the DDU_DIRECTOR role");

        RightOfUseCertificate newRequest = RightOfUseCertificate(_rightOfUseCertificateRequestAddress);
        newRequest.validateCPFHNotificationTransmission(_validate);
        nonces[_dduDirector] += 1;
    }

    function importAppliedPlan(
        address _rightOfUseCertificateRequestAddress,
        address _hodDocumentation,
        string memory _appliedPlanUrl,
        bytes memory _signature
    ) public {
        bytes32 messageHash = keccak256(abi.encodePacked(_appliedPlanUrl, nonces[_hodDocumentation]));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        address signer = recoverSigner(ethSignedMessageHash, _signature);

        require(roles[signer] == Role.HOD_DOCUMENTATION, "Signer does not have the HOD_DOCUMENTATION role");

        RightOfUseCertificate newRequest = RightOfUseCertificate(_rightOfUseCertificateRequestAddress);
        newRequest.importAppliedPlan(_appliedPlanUrl);
        nonces[_hodDocumentation] += 1;
    }

    function checkTFNumbersAndGenerateROU(
        address _rightOfUseCertificateRequestAddress,
        address _headOfcenter,
        string memory _generatedCertificateUrl,
        bytes memory _signature
    ) public {
        bytes32 messageHash = keccak256(abi.encodePacked(_generatedCertificateUrl, nonces[_headOfcenter]));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        address signer = recoverSigner(ethSignedMessageHash, _signature);

        require(roles[signer] == Role.HEAD_OF_CENTRE, "Signer does not have the HEAD_OF_CENTRE role");

        RightOfUseCertificate newRequest = RightOfUseCertificate(_rightOfUseCertificateRequestAddress);
        newRequest.checkTFNumbersAndGenerateROU(_generatedCertificateUrl);
        nonces[_headOfcenter] += 1;
    }

    function validateROUCertificate(
        address _rightOfUseCertificateRequestAddress,
        address _dduDirector,
        bool _validate,
        bytes memory _signature
    ) public {
        bytes32 messageHash = keccak256(abi.encodePacked(_validate, nonces[_dduDirector]));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        address signer = recoverSigner(ethSignedMessageHash, _signature);

        require(roles[signer] == Role.DDU_DIRECTOR, "Signer does not have the DDU_DIRECTOR role");

        RightOfUseCertificate newRequest = RightOfUseCertificate(_rightOfUseCertificateRequestAddress);
        newRequest.validateROUCertificate(_validate);
        nonces[_dduDirector] += 1;
    }


}
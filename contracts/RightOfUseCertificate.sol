pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

contract RightOfUseCertificate is Ownable  {


    ProcessStage public currentStage;

    // user details
    string public userInfoUrl;
    bytes public userInfoHash;

    //cpfh notification
    string public cpfhNotificationLetterUrl;

    string public appliedPlan;

    string public rightOfUseCertificate;

    constructor(string memory _userInfoUrl, bytes memory _userInfoHash) {
        initializeStageData();
        setUserData(_userInfoUrl, _userInfoHash);
    }

    // Enum for different stages in the process
    enum ProcessStage {
        REQUEST_CREATED,
        DATA_INPORTED,// dematerialization operator imports user data
        VERIFY_IMPORTED_DATA,
        GENERATE_AND_PRINT_CPFH_NOTIFICATION,
        ENDORSE_CPFH_NOTIFICATION,
        VALIDATE_CPFH_NOTIFICATION_TRANSMISSION,
        IMPORT_APPLIED_PLAN,
        CHECK_TF_NUMBERS_AND_GENRATE_ROU,//right of usage certificates
        VALIDATE_ROU_CERTIFICATES,
        MINT_NFT
    }

    // Struct for process stage data
    struct StageData {
        ProcessStage stage;
        bool passed;
    }


    // Modifier to check if the previous stage has been passed
    modifier previousStagePassed(ProcessStage _stage) {
        require(uint(_stage) > 0 && uint(_stage) - 1 == uint(currentStage), "Stage not allowed");
        _;
    }


    // Function to update the stage data
    function updateStage(ProcessStage _stage) public onlyOwner {
        currentStage = _stage;
    }

    // Function to set the initial stage data
    function initializeStageData() internal {
        currentStage = ProcessStage.REQUEST_CREATED;
    }

    function setUserData(string memory _userInfoUrl, bytes memory _userInfoHash) public onlyOwner {
        userInfoUrl = _userInfoUrl;
        userInfoHash = _userInfoHash;
        updateStage(ProcessStage.DATA_INPORTED);
    }

    function verifyImportedData(bool _verify) public onlyOwner previousStagePassed(ProcessStage.VERIFY_IMPORTED_DATA) {
        if(_verify){
            updateStage(ProcessStage.VERIFY_IMPORTED_DATA);
        }else{
            //go back to the previous REQUEST_CREATED stage so the dematerialization operator can pass in new data
            updateStage(ProcessStage.REQUEST_CREATED);
        }
    }

    function generateAndPrintCPFHNotification(
        string memory _cpfhNotificationLetterUrl
    ) public onlyOwner previousStagePassed(ProcessStage.GENERATE_AND_PRINT_CPFH_NOTIFICATION){
        cpfhNotificationLetterUrl = _cpfhNotificationLetterUrl;
        updateStage(ProcessStage.GENERATE_AND_PRINT_CPFH_NOTIFICATION);
    }

    function endorseCPFHNotificationLetter(bool _endorse) public onlyOwner previousStagePassed(ProcessStage.ENDORSE_CPFH_NOTIFICATION){
        if(_endorse){
            updateStage(ProcessStage.ENDORSE_CPFH_NOTIFICATION);
        }else{
            updateStage(ProcessStage.VERIFY_IMPORTED_DATA);
        }
    }

    function validateCPFHNotificationTransmission(
        bool _validate
    ) public onlyOwner previousStagePassed(ProcessStage.VALIDATE_CPFH_NOTIFICATION_TRANSMISSION){
        if(_validate){
            updateStage(ProcessStage.VALIDATE_CPFH_NOTIFICATION_TRANSMISSION);
        }else{
            updateStage(ProcessStage.GENERATE_AND_PRINT_CPFH_NOTIFICATION);
        }
    }

    function importAppliedPlan(string memory _appliedPlan) public onlyOwner previousStagePassed(ProcessStage.IMPORT_APPLIED_PLAN){
        appliedPlan = _appliedPlan;
        updateStage(ProcessStage.IMPORT_APPLIED_PLAN);
    }

    function checkTFNumbersAndGenerateROU(
        string memory _rightOfUseCertificate
    ) public onlyOwner previousStagePassed(ProcessStage.CHECK_TF_NUMBERS_AND_GENRATE_ROU){
        rightOfUseCertificate = _rightOfUseCertificate;
        updateStage(ProcessStage.CHECK_TF_NUMBERS_AND_GENRATE_ROU);
    }

    function validateROUCertificate(bool _validate) public onlyOwner previousStagePassed(ProcessStage.VALIDATE_ROU_CERTIFICATES){
        if(_validate){
            updateStage(ProcessStage.VALIDATE_ROU_CERTIFICATES);
        }else{
            updateStage(ProcessStage.IMPORT_APPLIED_PLAN);
        }
    }
}

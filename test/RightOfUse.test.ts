
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { expect, } from "chai";
import { ethers } from "hardhat";
import { PinataClient } from "../utils/PinataClient";
import { checkTFNumbersAndGenerateROU, createNewRequest, endorseCPFHNotification, generateCPFHNotification, importAppliedPlan, validateCPFHNotificationTransmission, validateROUCertificate, verifyRightOfUseCertificate } from "./helpers";
// import userInfo from "../utils/constants/userInfo.json";

const pinataClient = new PinataClient()

async function tokenFixtures() {

  const accounts = await ethers.getSigners()

  const owner = accounts[0]
  const dematerializationOperator = accounts[1]
  const hodDocumentation = accounts[2]
  const headOfCenter = accounts[3]
  const dduDirector = accounts[4]
  const headOfDepartmentAd = accounts[5]


  const RightOfUseFactory = await ethers.getContractFactory("RightOfUseFactory");
  const rightOfUseFactory = await RightOfUseFactory.connect(owner).deploy({
    gasLimit: ethers.BigNumber.from(`30000000`),
  });

  await rightOfUseFactory.deployed()

  await rightOfUseFactory.connect(owner).setRole(dematerializationOperator.address, 1)
  await rightOfUseFactory.connect(owner).setRole(hodDocumentation.address, 2)
  await rightOfUseFactory.connect(owner).setRole(headOfCenter.address, 3)
  await rightOfUseFactory.connect(owner).setRole(dduDirector.address, 4)
  await rightOfUseFactory.connect(owner).setRole(headOfDepartmentAd.address, 5)


  // IPFS DATA
  // const userInfoUrlAndHash = await pinataClient.uploadJson(new Date().getMilliseconds().toString(), userInfo)
  const userInfoUrlAndHash = {
    hash: 'a4ee6bce91103012ff9a1521d0b4c932327190836e9c2f6d16ce87a1646c9b84',
    url: 'https://gateway.pinata.cloud/ipfs//QmVtkxh2DSFoUv22N3sSrW7fohVCYY92iBpBBw4wkJk324'
  };

  userInfoUrlAndHash.hash = "0x" + userInfoUrlAndHash.hash;

  const cpfhNotificationLetterUrl = "https://gateway.pinata.cloud/ipfs/QmWBdkQK5mBLopw4GfstvxZdR667KNJ9LUf2gK3bVX48eL";

  const appliedPlanUrl = "https://gateway.pinata.cloud/ipfs/QmdwWrU8W3GfJ4fKCzvnzhD8f57sE8bkHk6mEgVxUXZPSb"

  const generatedROU = "https://gateway.pinata.cloud/ipfs/Qmd1sDtSkzKXwvkuAX6W3PBQqW6UTbrFQP4zv9QZTmCitC"

  return {
    owner,
    dematerializationOperator,
    hodDocumentation,
    headOfCenter,
    dduDirector,
    headOfDepartmentAd,
    rightOfUseFactory,
    userInfoUrlAndHash,
    cpfhNotificationLetterUrl,
    appliedPlanUrl,
    generatedROU
  }
}


describe("RightOfUseFactory", async function () {


  describe("createNewRequest", function () {

    it("should create a new RightOfUseCertificate request", async () => {
      const { dematerializationOperator, userInfoUrlAndHash, rightOfUseFactory } = await loadFixture(tokenFixtures);


      const tx = await createNewRequest(userInfoUrlAndHash, rightOfUseFactory, dematerializationOperator)
      const receipt = await tx.wait();

      expect(receipt.status).to.equal(1);
      expect(receipt.events![1].event).to.equal("RequestCreated");
      expect(receipt.events![1].args![0]).to.be.properAddress;

      const rightOfUseCertificateAddress = receipt.events![1].args![0];
      const rightOfUseCertificate = await ethers.getContractAt('RightOfUseCertificate', rightOfUseCertificateAddress);
      const userInfoUrl = await rightOfUseCertificate.userInfoUrl()
      const userInfoHash = await rightOfUseCertificate.userInfoHash()
      const expectedOwner = await rightOfUseCertificate.owner()
      const currentStage = await rightOfUseCertificate.currentStage();


      expect(currentStage).to.equal(1);
      expect(userInfoUrl).to.equal(userInfoUrlAndHash.url);
      expect(userInfoHash).to.equal(userInfoUrlAndHash.hash);
      expect(expectedOwner).to.equal(rightOfUseFactory.address);

    });


    it("should make the Head of center reject the imported data", async () => {
      const { dematerializationOperator, headOfCenter, userInfoUrlAndHash, rightOfUseFactory } = await loadFixture(tokenFixtures);
      const tx = await createNewRequest(userInfoUrlAndHash, rightOfUseFactory, dematerializationOperator)
      const receipt = await tx.wait();

      const rightOfUseCertificateAddress = receipt.events![1].args![0]

      await verifyRightOfUseCertificate(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, false)

      const rightOfUseCertificate = await ethers.getContractAt('RightOfUseCertificate', rightOfUseCertificateAddress);
      const currentStage = await rightOfUseCertificate.currentStage();
      expect(currentStage).to.equal(0);

    })


    it("should make the Head of center verify the imported data", async () => {
      const { dematerializationOperator, headOfCenter, userInfoUrlAndHash, rightOfUseFactory } = await loadFixture(tokenFixtures);
      const tx = await createNewRequest(userInfoUrlAndHash, rightOfUseFactory, dematerializationOperator)
      const receipt = await tx.wait();

      const rightOfUseCertificateAddress = receipt.events![1].args![0]

      await verifyRightOfUseCertificate(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, true)

      const rightOfUseCertificate = await ethers.getContractAt('RightOfUseCertificate', rightOfUseCertificateAddress);
      const currentStage = await rightOfUseCertificate.currentStage();
      expect(currentStage).to.equal(2);

    })

    it("should generate and print cpfh notification letter (head of department AD)", async () => {
      const { dematerializationOperator, headOfCenter, headOfDepartmentAd, userInfoUrlAndHash, rightOfUseFactory, cpfhNotificationLetterUrl } = await loadFixture(tokenFixtures);
      const tx = await createNewRequest(userInfoUrlAndHash, rightOfUseFactory, dematerializationOperator)
      const receipt = await tx.wait();

      const rightOfUseCertificateAddress = receipt.events![1].args![0]

      await verifyRightOfUseCertificate(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, true)
      await generateCPFHNotification(rightOfUseFactory, rightOfUseCertificateAddress, cpfhNotificationLetterUrl, headOfDepartmentAd)

      const rightOfUseCertificate = await ethers.getContractAt('RightOfUseCertificate', rightOfUseCertificateAddress);
      const currentStage = await rightOfUseCertificate.currentStage();
      const cpfhNotification = await rightOfUseCertificate.cpfhNotificationLetterUrl()
      expect(currentStage).to.equal(3);
      expect(cpfhNotification).to.equal(cpfhNotificationLetterUrl);

    })

    it("should endorse the cpfhNotificationLetter (Head of center)", async () => {
      const { dematerializationOperator, headOfCenter, headOfDepartmentAd, userInfoUrlAndHash, rightOfUseFactory, cpfhNotificationLetterUrl } = await loadFixture(tokenFixtures);
      const tx = await createNewRequest(userInfoUrlAndHash, rightOfUseFactory, dematerializationOperator)
      const receipt = await tx.wait();

      const rightOfUseCertificateAddress = receipt.events![1].args![0]

      await verifyRightOfUseCertificate(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, true)
      await generateCPFHNotification(rightOfUseFactory, rightOfUseCertificateAddress, cpfhNotificationLetterUrl, headOfDepartmentAd)
      await endorseCPFHNotification(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, true)

      const rightOfUseCertificate = await ethers.getContractAt('RightOfUseCertificate', rightOfUseCertificateAddress);
      const currentStage = await rightOfUseCertificate.currentStage();
      expect(currentStage).to.equal(4);
    })

    it("should validate the cpfh Notification Letter Transmission (DDU director)", async () => {
      const { dematerializationOperator, headOfCenter, dduDirector, headOfDepartmentAd, userInfoUrlAndHash, rightOfUseFactory, cpfhNotificationLetterUrl } = await loadFixture(tokenFixtures);
      const tx = await createNewRequest(userInfoUrlAndHash, rightOfUseFactory, dematerializationOperator)
      const receipt = await tx.wait();

      const rightOfUseCertificateAddress = receipt.events![1].args![0]

      await verifyRightOfUseCertificate(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, true)
      await generateCPFHNotification(rightOfUseFactory, rightOfUseCertificateAddress, cpfhNotificationLetterUrl, headOfDepartmentAd)
      await endorseCPFHNotification(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, true)
      await validateCPFHNotificationTransmission(rightOfUseFactory, rightOfUseCertificateAddress, dduDirector, true)


      const rightOfUseCertificate = await ethers.getContractAt('RightOfUseCertificate', rightOfUseCertificateAddress);
      const currentStage = await rightOfUseCertificate.currentStage();
      expect(currentStage).to.equal(5);
    })


    it("should import applied plan (HOD documentation)", async () => {
      const { dematerializationOperator, headOfCenter, dduDirector, hodDocumentation, headOfDepartmentAd, userInfoUrlAndHash, appliedPlanUrl, rightOfUseFactory, cpfhNotificationLetterUrl } = await loadFixture(tokenFixtures);
      const tx = await createNewRequest(userInfoUrlAndHash, rightOfUseFactory, dematerializationOperator)
      const receipt = await tx.wait();

      const rightOfUseCertificateAddress = receipt.events![1].args![0]

      await verifyRightOfUseCertificate(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, true)
      await generateCPFHNotification(rightOfUseFactory, rightOfUseCertificateAddress, cpfhNotificationLetterUrl, headOfDepartmentAd)
      await endorseCPFHNotification(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, true)
      await validateCPFHNotificationTransmission(rightOfUseFactory, rightOfUseCertificateAddress, dduDirector, true)
      await importAppliedPlan(rightOfUseFactory, rightOfUseCertificateAddress, hodDocumentation, appliedPlanUrl)

      const rightOfUseCertificate = await ethers.getContractAt('RightOfUseCertificate', rightOfUseCertificateAddress);
      const currentStage = await rightOfUseCertificate.currentStage();
      expect(currentStage).to.equal(6);
    })
    it("should check TF number and generate ROU (HOD documentation)", async () => {
      const { dematerializationOperator, headOfCenter, dduDirector, hodDocumentation, headOfDepartmentAd, userInfoUrlAndHash, appliedPlanUrl, generatedROU, rightOfUseFactory, cpfhNotificationLetterUrl } = await loadFixture(tokenFixtures);
      const tx = await createNewRequest(userInfoUrlAndHash, rightOfUseFactory, dematerializationOperator)
      const receipt = await tx.wait();

      const rightOfUseCertificateAddress = receipt.events![1].args![0]

      await verifyRightOfUseCertificate(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, true)
      await generateCPFHNotification(rightOfUseFactory, rightOfUseCertificateAddress, cpfhNotificationLetterUrl, headOfDepartmentAd)
      await endorseCPFHNotification(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, true)
      await validateCPFHNotificationTransmission(rightOfUseFactory, rightOfUseCertificateAddress, dduDirector, true)
      await importAppliedPlan(rightOfUseFactory, rightOfUseCertificateAddress, hodDocumentation, appliedPlanUrl)
      await checkTFNumbersAndGenerateROU(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, generatedROU)

      const rightOfUseCertificate = await ethers.getContractAt('RightOfUseCertificate', rightOfUseCertificateAddress);
      const currentStage = await rightOfUseCertificate.currentStage();
      expect(currentStage).to.equal(7);
    })

    it("should validate ROU certificate (DDU director)", async () => {
      const { dematerializationOperator, headOfCenter, dduDirector, hodDocumentation, headOfDepartmentAd, userInfoUrlAndHash, appliedPlanUrl, generatedROU, rightOfUseFactory, cpfhNotificationLetterUrl } = await loadFixture(tokenFixtures);
      const tx = await createNewRequest(userInfoUrlAndHash, rightOfUseFactory, dematerializationOperator)
      const receipt = await tx.wait();

      const rightOfUseCertificateAddress = receipt.events![1].args![0]

      await verifyRightOfUseCertificate(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, true)
      await generateCPFHNotification(rightOfUseFactory, rightOfUseCertificateAddress, cpfhNotificationLetterUrl, headOfDepartmentAd)
      await endorseCPFHNotification(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, true)
      await validateCPFHNotificationTransmission(rightOfUseFactory, rightOfUseCertificateAddress, dduDirector, true)
      await importAppliedPlan(rightOfUseFactory, rightOfUseCertificateAddress, hodDocumentation, appliedPlanUrl)
      await checkTFNumbersAndGenerateROU(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, generatedROU)
      await validateROUCertificate(rightOfUseFactory, rightOfUseCertificateAddress, dduDirector, true,)

      const rightOfUseCertificate = await ethers.getContractAt('RightOfUseCertificate', rightOfUseCertificateAddress);
      const currentStage = await rightOfUseCertificate.currentStage();
      expect(currentStage).to.equal(8);
    })

    it("should validate used signature used to validate ROU Certificate", async () => {
      const { dematerializationOperator, headOfCenter, dduDirector, hodDocumentation, headOfDepartmentAd, userInfoUrlAndHash, appliedPlanUrl, generatedROU, rightOfUseFactory, cpfhNotificationLetterUrl } = await loadFixture(tokenFixtures);
      const tx = await createNewRequest(userInfoUrlAndHash, rightOfUseFactory, dematerializationOperator)
      const receipt = await tx.wait();

      const rightOfUseCertificateAddress = receipt.events![1].args![0]

      await verifyRightOfUseCertificate(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, true)
      await generateCPFHNotification(rightOfUseFactory, rightOfUseCertificateAddress, cpfhNotificationLetterUrl, headOfDepartmentAd)
      await endorseCPFHNotification(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, true)
      await validateCPFHNotificationTransmission(rightOfUseFactory, rightOfUseCertificateAddress, dduDirector, true)
      await importAppliedPlan(rightOfUseFactory, rightOfUseCertificateAddress, hodDocumentation, appliedPlanUrl)
      await checkTFNumbersAndGenerateROU(rightOfUseFactory, rightOfUseCertificateAddress, headOfCenter, generatedROU)

      const nonce = await rightOfUseFactory.nonces(dduDirector.address);
      const signature = await dduDirector.signMessage(
        ethers.utils.arrayify(
          ethers.utils.solidityKeccak256(
            ["bool", "uint256"],
            [true, nonce]
          )
        )
      );
      await rightOfUseFactory.validateROUCertificate(rightOfUseCertificateAddress, dduDirector.address, true, signature);

      //validate 
      const isValid = await rightOfUseFactory.verifyValidateROUCertificateSignature(dduDirector.address, true, nonce, signature)
      expect(isValid).to.equal(true);
    })
  });
});
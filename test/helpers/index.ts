
import { ethers } from "hardhat";
import { RightOfUseFactory } from "../../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


export async function createNewRequest(
  userInfoUrlAndHash: { url: string; hash: string; },
  rightOfUseFactory: RightOfUseFactory,
  dematerializationOperator: SignerWithAddress,
) {
  const nonce = await rightOfUseFactory.nonces(dematerializationOperator.address);

  const signature = await dematerializationOperator.signMessage(
    ethers.utils.arrayify(
      ethers.utils.solidityKeccak256(
        ["string", "bytes", "uint256"],
        [userInfoUrlAndHash.url, userInfoUrlAndHash.hash, nonce]
      )
    )
  );

  const tx = await rightOfUseFactory.createNewRequest(userInfoUrlAndHash.url, userInfoUrlAndHash.hash, dematerializationOperator.address, signature);

  return tx;
}

export async function verifyRightOfUseCertificate(
  rightOfUseFactory: RightOfUseFactory,
  rightOfUseCertificateAddress: string,
  headOfCenter: SignerWithAddress,
  verify: boolean,
) {
  const nonce = await rightOfUseFactory.nonces(headOfCenter.address);
  const signature = await headOfCenter.signMessage(
    ethers.utils.arrayify(
      ethers.utils.solidityKeccak256(
        ["bool", "uint256"],
        [verify, nonce]
      )
    )
  );
  await rightOfUseFactory.verifyImportedData(
    rightOfUseCertificateAddress,
    headOfCenter.address,
    verify,
    signature
  );
}

export async function generateCPFHNotification(
  rightOfUseFactory: RightOfUseFactory,
  rightOfUseCertificateAddress: string,
  cpfhNotificationLetterUrl: string,
  headOfDepartmentAd: SignerWithAddress
) {
  const nonce = await rightOfUseFactory.nonces(headOfDepartmentAd.address);

  const signature = await headOfDepartmentAd.signMessage(
    ethers.utils.arrayify(
      ethers.utils.solidityKeccak256(
        ["string", "uint256"],
        [cpfhNotificationLetterUrl, nonce]
      )
    )
  );

  await rightOfUseFactory.generateAndPrintCPFHNotification(rightOfUseCertificateAddress, cpfhNotificationLetterUrl, headOfDepartmentAd.address, signature);
}

export async function endorseCPFHNotification(
  rightOfUseFactory: RightOfUseFactory,
  rightOfUseCertificateAddress: string,
  headOfCenter: SignerWithAddress,
  endorse: boolean,
) {
  const nonce = await rightOfUseFactory.nonces(headOfCenter.address);

  const signature = await headOfCenter.signMessage(
    ethers.utils.arrayify(
      ethers.utils.solidityKeccak256(
        ["bool", "uint256"],
        [endorse, nonce]
      )
    )
  );

  await rightOfUseFactory.endorseCPFHNotificationLetter(rightOfUseCertificateAddress, headOfCenter.address, endorse, signature);
}

export async function validateCPFHNotificationTransmission(
  rightOfUseFactory: RightOfUseFactory,
  rightOfUseCertificateAddress: string,
  dduDirector: SignerWithAddress,
  validate: boolean,
) {
  const nonce = await rightOfUseFactory.nonces(dduDirector.address);

  const signature = await dduDirector.signMessage(
    ethers.utils.arrayify(
      ethers.utils.solidityKeccak256(
        ["bool", "uint256"],
        [validate, nonce]
      )
    )
  );

  await rightOfUseFactory.validateCPFHNotificationTransmission(rightOfUseCertificateAddress, dduDirector.address, validate, signature);
}

export async function importAppliedPlan(
  rightOfUseFactory: RightOfUseFactory,
  rightOfUseCertificateAddress: string,
  hodDocumentation: SignerWithAddress,
  appliedPlanUrl: string,
) {
  const nonce = await rightOfUseFactory.nonces(hodDocumentation.address);

  const signature = await hodDocumentation.signMessage(
    ethers.utils.arrayify(
      ethers.utils.solidityKeccak256(
        ["string", "uint256"],
        [appliedPlanUrl, nonce]
      )
    )
  );

  await rightOfUseFactory.importAppliedPlan(rightOfUseCertificateAddress, hodDocumentation.address, appliedPlanUrl, signature);
}
export async function checkTFNumbersAndGenerateROU(
  rightOfUseFactory: RightOfUseFactory,
  rightOfUseCertificateAddress: string,
  headOfCenter: SignerWithAddress,
  generatedROU: string,
) {
  const nonce = await rightOfUseFactory.nonces(headOfCenter.address);

  const signature = await headOfCenter.signMessage(
    ethers.utils.arrayify(
      ethers.utils.solidityKeccak256(
        ["string", "uint256"],
        [generatedROU, nonce]
      )
    )
  );

  await rightOfUseFactory.checkTFNumbersAndGenerateROU(rightOfUseCertificateAddress, headOfCenter.address, generatedROU, signature);
}

export async function validateROUCertificate(
  rightOfUseFactory: RightOfUseFactory,
  rightOfUseCertificateAddress: string,
  dduDirector: SignerWithAddress,
  validate: boolean,
) {
  const nonce = await rightOfUseFactory.nonces(dduDirector.address);

  const signature = await dduDirector.signMessage(
    ethers.utils.arrayify(
      ethers.utils.solidityKeccak256(
        ["bool", "uint256"],
        [validate, nonce]
      )
    )
  );

  await rightOfUseFactory.validateROUCertificate(rightOfUseCertificateAddress, dduDirector.address, validate, signature);
}
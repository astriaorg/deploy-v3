import { ContractInterface, ContractFactory } from '@ethersproject/contracts'
import { JsonRpcProvider } from "@ethersproject/providers";
import { MigrationState, MigrationStep, waitForNextBlock, waitForReceipt } from '../../migrations'

export default function createDeployLibraryStep({
  key,
  artifact: { contractName, abi, bytecode },
}: {
  key: keyof MigrationState
  artifact: { contractName: string; abi: ContractInterface; bytecode: string }
}): MigrationStep {
  return async (state, { signer, gasPrice, jsonRpcUrl }) => {
    if (state[key] === undefined) {
      const factory = new ContractFactory(abi, bytecode, signer)

      const provider = new JsonRpcProvider({ url: jsonRpcUrl.toString() })
      let currBlock = await provider.getBlockNumber()

      let nonce = await provider.getTransactionCount(signer.getAddress())
      console.log("current account nonce", nonce)
      console.log("deployer address", await signer.getAddress())

      const library = await factory.deploy({ gasPrice })

      await waitForReceipt(library.deployTransaction.hash, provider)
      await waitForNextBlock(currBlock, provider)

      state[key] = library.address

      return [
        {
          message: `Library ${contractName} deployed`,
          address: library.address,
          hash: library.deployTransaction.hash,
        },
      ]
    } else {
      return [{ message: `Library ${contractName} was already deployed`, address: state[key] }]
    }
  }
}

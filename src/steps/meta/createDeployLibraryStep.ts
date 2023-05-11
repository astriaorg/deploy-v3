import { ContractInterface, ContractFactory } from '@ethersproject/contracts'
import { JsonRpcProvider } from "@ethersproject/providers";
import { MigrationState, MigrationStep } from '../../migrations'

export default function createDeployLibraryStep({
  key,
  artifact: { contractName, abi, bytecode },
}: {
  key: keyof MigrationState
  artifact: { contractName: string; abi: ContractInterface; bytecode: string }
}): MigrationStep {
  return async (state, { signer, gasPrice }) => {
    if (state[key] === undefined) {
      const factory = new ContractFactory(abi, bytecode, signer)

      const provider = new JsonRpcProvider({ url: "http://localhost:8545" }) 
      let currBlock = await provider.getBlockNumber()

      let nonce = await provider.getTransactionCount(signer.getAddress())
      console.log("current account nonce", nonce)
      console.log("deployer address", await signer.getAddress())

      const library = await factory.deploy({ gasPrice })
    
      // wait for transaction receipt
      while (true) {
        console.log("waiting for transaction")
        let receipt = await provider.getTransactionReceipt(library.deployTransaction.hash)
        if (receipt && receipt.contractAddress) {
          break
        }
        await stall(1000)
      }

      // wait for next block
      while (true) {
        console.log("waiting for block")
        let block = await provider.getBlockNumber()
        if (block > currBlock) {
          break
        }
        await stall(1000)
      }

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

function stall(duration: number): Promise<void> {
  return new Promise((resolve) => {
      setTimeout(resolve, duration);
  });
}
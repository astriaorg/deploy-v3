import { Contract, ContractInterface, ContractFactory } from '@ethersproject/contracts'
import { JsonRpcProvider } from "@ethersproject/providers";
import { MigrationConfig, MigrationState, MigrationStep } from '../../migrations'
import linkLibraries from '../../util/linkLibraries'

type ConstructorArgs = (string | number | string[] | number[])[]

export default function createDeployContractStep({
  key,
  artifact: { contractName, abi, bytecode, linkReferences },
  computeLibraries,
  computeArguments,
}: {
  key: keyof MigrationState
  artifact: {
    contractName: string
    abi: ContractInterface
    bytecode: string
    linkReferences?: { [fileName: string]: { [contractName: string]: { length: number; start: number }[] } }
  }
  computeLibraries?: (state: Readonly<MigrationState>, config: MigrationConfig) => { [libraryName: string]: string }
  computeArguments?: (state: Readonly<MigrationState>, config: MigrationConfig) => ConstructorArgs
}): MigrationStep {
  if (linkReferences && Object.keys(linkReferences).length > 0 && !computeLibraries) {
    throw new Error('Missing function to compute library addresses')
  } else if (computeLibraries && (!linkReferences || Object.keys(linkReferences).length === 0)) {
    throw new Error('Compute libraries passed but no link references')
  }

  return async (state, config) => {
    if (state[key] === undefined) {
      const constructorArgs: ConstructorArgs = computeArguments ? computeArguments(state, config) : []

      const factory = new ContractFactory(
        abi,
        linkReferences && computeLibraries
          ? linkLibraries({ bytecode, linkReferences }, computeLibraries(state, config))
          : bytecode,
        config.signer
      )

      const provider = new JsonRpcProvider({ url: "http://localhost:8545" }) 
      let currBlock = await provider.getBlockNumber()

      let nonce = await provider.getTransactionCount(config.signer.getAddress())
      console.log("current account nonce", nonce)
      console.log("deployer address", await config.signer.getAddress())

      // let deployTx = factory.getDeployTransaction(...constructorArgs, { gasPrice: config.gasPrice, nonce: nonce })
      // let estimatedGas = await provider.estimateGas(deployTx)

      let contract: Contract
      try {
        contract = await factory.deploy(...constructorArgs, { gasPrice: config.gasPrice, nonce: nonce })
      } catch (error) {
        console.error(`Failed to deploy ${contractName}`)
        throw error
      }

      // wait for transaction receipt
      while (true) {
        console.log("waiting for transaction")
        let receipt = await provider.getTransactionReceipt(contract.deployTransaction.hash)
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

      state[key] = contract.address

      return [
        {
          message: `Contract ${contractName} deployed`,
          address: contract.address,
          hash: contract.deployTransaction.hash,
        },
      ]
    } else {
      return [{ message: `Contract ${contractName} was already deployed`, address: state[key] }]
    }
  }
}

function stall(duration: number): Promise<void> {
  return new Promise((resolve) => {
      setTimeout(resolve, duration);
  });
}
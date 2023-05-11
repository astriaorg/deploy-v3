import UniswapV3Factory from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from "@ethersproject/providers";
import { MigrationStep } from '../migrations'

export const TRANSFER_V3_CORE_FACTORY_OWNER: MigrationStep = async (state, { signer, gasPrice, ownerAddress }) => {
  if (state.v3CoreFactoryAddress === undefined) {
    throw new Error('Missing UniswapV3Factory')
  }

  const v3CoreFactory = new Contract(state.v3CoreFactoryAddress, UniswapV3Factory.abi, signer)

  const provider = new JsonRpcProvider({ url: "http://localhost:8545" }) 
  let currBlock = await provider.getBlockNumber()

  const owner = await v3CoreFactory.owner()
  if (owner === ownerAddress)
    return [
      {
        message: `UniswapV3Factory owned by ${ownerAddress} already`,
      },
    ]

  if (owner !== (await signer.getAddress())) {
    throw new Error('UniswapV3Factory.owner is not signer')
  }

  const tx = await v3CoreFactory.setOwner(ownerAddress, { gasPrice })

  // wait for transaction receipt
  while (true) {
    console.log("waiting for transaction")
    let receipt = await provider.getTransactionReceipt(tx.hash)
    if (receipt) {
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

  return [
    {
      message: `UniswapV3Factory ownership set to ${ownerAddress}`,
      hash: tx.hash,
    },
  ]
}

function stall(duration: number): Promise<void> {
  return new Promise((resolve) => {
      setTimeout(resolve, duration);
  });
}
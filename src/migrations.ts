import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { GenericMigrationStep } from './migrate'

export interface MigrationState {
  readonly v3CoreFactoryAddress?: string
  readonly swapRouter02?: string
  readonly nftDescriptorLibraryAddressV1_3_0?: string
  readonly nonfungibleTokenPositionDescriptorAddressV1_3_0?: string
  readonly descriptorProxyAddress?: string
  readonly multicall2Address?: string
  readonly proxyAdminAddress?: string
  readonly quoterV2Address?: string
  readonly tickLensAddress?: string
  readonly v3MigratorAddress?: string
  readonly v3StakerAddress?: string
  readonly nonfungibleTokenPositionManagerAddress?: string
}

export type StepOutput = { message: string; hash?: string; address?: string }

export type MigrationConfig = {
  signer: Signer
  gasPrice: BigNumber | undefined
  weth9Address: string
  nativeCurrencyLabelBytes: string
  v2CoreFactoryAddress: string
  ownerAddress: string
}

export type MigrationStep = GenericMigrationStep<MigrationState, MigrationConfig, StepOutput[]>

async function stall(duration: number): Promise<void> {
  return new Promise((resolve) => {
      setTimeout(resolve, duration);
  });
}

export async function waitForReceipt(hash: String, provider: any) {
  while (true) {
    console.log("waiting for transaction: hash", hash)
    let receipt = await provider.getTransactionReceipt(hash)
    if (receipt) {
      break
    }
    await stall(1000)
  }
}

export async function waitForNextBlock(currBlock: number, provider: any) {
  while (true) {
    console.log("waiting for next block")
    let block = await provider.getBlockNumber()
    if (block > currBlock) {
      break
    }
    await stall(1000)
  }
}
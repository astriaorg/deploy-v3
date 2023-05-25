import ProxyAdmin from '@openzeppelin/contracts/build/contracts/ProxyAdmin.json'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from "@ethersproject/providers";
import { MigrationStep, waitForReceipt } from '../migrations'

export const TRANSFER_PROXY_ADMIN: MigrationStep = async (state, { signer, gasPrice, ownerAddress, jsonRpcUrl }) => {
  if (state.proxyAdminAddress === undefined) {
    throw new Error('Missing ProxyAdmin')
  }

  const proxyAdmin = new Contract(state.proxyAdminAddress, ProxyAdmin.abi, signer)

  const owner = await proxyAdmin.owner()
  if (owner === ownerAddress)
    return [
      {
        message: `ProxyAdmin owned by ${ownerAddress} already`,
      },
    ]

  if (owner !== (await signer.getAddress())) {
    throw new Error('ProxyAdmin.owner is not signer')
  }

  const tx = await proxyAdmin.transferOwnership(ownerAddress, { gasPrice })
  const provider = new JsonRpcProvider({ url: jsonRpcUrl.toString() })
  await waitForReceipt(tx.hash, provider)

  return [
    {
      message: `ProxyAdmin ownership set to ${ownerAddress}`,
      hash: tx.hash,
    },
  ]
}

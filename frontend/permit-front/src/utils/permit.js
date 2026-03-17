import { keccak256, encodeAbiParameters, parseAbiParameters, toHex, concat, hexToBytes } from 'viem'

/**
 * 生成 EIP-2612 Permit 签名
 */
export async function signPermit(
  walletClient,
  account,
  tokenAddress,
  spenderAddress,
  value,
  nonce,
  deadline,
  domainSeparator,
  chainId
) {
  const PERMIT_TYPEHASH = keccak256(
    toHex('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
  )

  // 构建 structHash
  const structHash = keccak256(
    encodeAbiParameters(
      parseAbiParameters('bytes32, address, address, uint256, uint256, uint256'),
      [PERMIT_TYPEHASH, account, spenderAddress, value, nonce, deadline]
    )
  )

  // 构建最终的 digest (EIP-712)
  const digest = keccak256(
    concat([
      hexToBytes('0x1901'),
      hexToBytes(domainSeparator),
      hexToBytes(structHash)
    ])
  )

  // 使用钱包签名
  const signature = await walletClient.signMessage({
    account,
    message: { raw: digest }
  })

  console.log("signature:",signature)

  // 解析签名为 v, r, s
  const r = signature.slice(0, 66)
  const s = '0x' + signature.slice(66, 130)
  let v = parseInt(signature.slice(130, 132), 16)

  console.log("rsv:",r,s,v)

  // 确保 v 是 27 或 28
  if (v < 27) {
    v += 27
  }

  return { v, r, s, deadline }
}

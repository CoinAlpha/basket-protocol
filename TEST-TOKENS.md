# Token Replicas on Ropsten Ethereum Test Network
The CoinAlpha team has deployed a number of ERC20 token replicas on the Ropsten testnet, in order to simulate the use of the protocol with as close to real-world examples as possible.

## Obtaining Test Tokens
Users interested in trying out the protocol may obtain test tokens by calling the `faucet()` function of each token contract, or by sending test Ether to the token contract address.

## Test Token ABI

```
[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"destroy","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"faucetAmount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_recipient","type":"address"}],"name":"destroyAndSend","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_decimals","type":"uint256"},{"name":"_initialSupply","type":"uint256"},{"name":"_faucetAmount","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"recipient","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"LogFaucet","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"LogMint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"LogOwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":false,"inputs":[],"name":"faucet","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]
```

## Token Addresses

Token | Ropsten Address
---|---
EOS | [0x1306f63b69643769fab734ad8f124175d22abeaa](https://ropsten.etherscan.io/token/0x1306f63b69643769fab734ad8f124175d22abeaa)
TRX | [0x17308074b002151da05c627b3b5ecaf1051ddfc5](https://ropsten.etherscan.io/token/0x17308074b002151da05c627b3b5ecaf1051ddfc5)
QTM | [0x0a32df8ce98d84a681cff517ec03cdfc1a33cd32](https://ropsten.etherscan.io/token/0x0a32df8ce98d84a681cff517ec03cdfc1a33cd32)
OMG | [0x5d781dfa81df4cf27f2782c7e5cb6ddf2a29d2e9](https://ropsten.etherscan.io/token/0x5d781dfa81df4cf27f2782c7e5cb6ddf2a29d2e9)
BNB | [0xeaf3998fb6cd3ac9e85c4e159d545a90a040b0ae](https://ropsten.etherscan.io/token/0xeaf3998fb6cd3ac9e85c4e159d545a90a040b0ae)
PPT | [0xbff3ff566d794846868559d8f6cf59b77ca6cec3](https://ropsten.etherscan.io/token/0xbff3ff566d794846868559d8f6cf59b77ca6cec3)
SNT | [0x323322354f4f69235fe955a266d9c377782af06d](https://ropsten.etherscan.io/token/0x323322354f4f69235fe955a266d9c377782af06d)
MKR | [0x67330dc0ba317aa73634cd4e9c9e94edd3a615ba](https://ropsten.etherscan.io/token/0x67330dc0ba317aa73634cd4e9c9e94edd3a615ba)
REP | [0xc746e0ae4d43c4fedac0945180c287cb78bb4936](https://ropsten.etherscan.io/token/0xc746e0ae4d43c4fedac0945180c287cb78bb4936)
ZRX | [0x54b094b9188d5c78d2ab8a6c39cbaac8f0104c55](https://ropsten.etherscan.io/token/0x54b094b9188d5c78d2ab8a6c39cbaac8f0104c55)
DGD | [0xc9630043e4700d8be030ba648320637fbd144029](https://ropsten.etherscan.io/token/0xc9630043e4700d8be030ba648320637fbd144029)
BAT | [0x9b7a4a12cc329f9a812333acaf5067ad77618c83](https://ropsten.etherscan.io/token/0x9b7a4a12cc329f9a812333acaf5067ad77618c83)
GNT | [0xa4d9131c87cc67af95a7b529b358c31e48ce23d8](https://ropsten.etherscan.io/token/0xa4d9131c87cc67af95a7b529b358c31e48ce23d8)
KNC | [0x8acfdce20db04d4d30111ea2b41dbcf948cc95ed](https://ropsten.etherscan.io/token/0x8acfdce20db04d4d30111ea2b41dbcf948cc95ed)
QASH | [0x86da8055ce497f93cf92262d41f034a455c6896d](https://ropsten.etherscan.io/token/0x86da8055ce497f93cf92262d41f034a455c6896d)
ETHOS | [0x5def824c3b9bcca5318af5f3e15a0bcf6e0e1e71](https://ropsten.etherscan.io/token/0x5def824c3b9bcca5318af5f3e15a0bcf6e0e1e71)
FUN | [0xdcbeb21bc0478acb839797c3a8599a3faed4799e](https://ropsten.etherscan.io/token/0xdcbeb21bc0478acb839797c3a8599a3faed4799e)
SALT | [0x09d33c6dfb57f026bcba53affdb9139c469f7d3e](https://ropsten.etherscan.io/token/0x09d33c6dfb57f026bcba53affdb9139c469f7d3e)
BNT | [0x6215aaa664b7d9ddd0702ed0466ff152eaf589b7](https://ropsten.etherscan.io/token/0x6215aaa664b7d9ddd0702ed0466ff152eaf589b7)
REQ | [0x4d60c8c734bd9040e5238816e3ad44bf84da8773](https://ropsten.etherscan.io/token/0x4d60c8c734bd9040e5238816e3ad44bf84da8773)
TENX | [0xe8d333adc1842b459a6bf7e76635f5c009508c4d](https://ropsten.etherscan.io/token/0xe8d333adc1842b459a6bf7e76635f5c009508c4d)
QSP | [0xf723de82a77bc332cdaae57955a162a23e343f8e](https://ropsten.etherscan.io/token/0xf723de82a77bc332cdaae57955a162a23e343f8e)
ICN | [0xabd4c94df8d5e2a11610a54d3469392e826256cb](https://ropsten.etherscan.io/token/0xabd4c94df8d5e2a11610a54d3469392e826256cb)
GNO | [0x02da301ab117e92dd2963b8d117b54206ac8b13a](https://ropsten.etherscan.io/token/0x02da301ab117e92dd2963b8d117b54206ac8b13a)
SAN | [0xe679d68d146e0840e4981ab81cfa9393e9359ea7](https://ropsten.etherscan.io/token/0xe679d68d146e0840e4981ab81cfa9393e9359ea7)
CVC | [0xf2755ba31453381578371bc022d9ee1b69970684](https://ropsten.etherscan.io/token/0xf2755ba31453381578371bc022d9ee1b69970684)
STORJ | [0x7f89a4e98006967fa80745eedb0bb555a0d2c5f5](https://ropsten.etherscan.io/token/0x7f89a4e98006967fa80745eedb0bb555a0d2c5f5)
RDN | [0x1a4be0f4f13e76a4a68f683faaf2f3e65b47ed0f](https://ropsten.etherscan.io/token/0x1a4be0f4f13e76a4a68f683faaf2f3e65b47ed0f)
MANA | [0xf2ab12e5d0ee31ba01f16acda854107d8c2bc62d](https://ropsten.etherscan.io/token/0xf2ab12e5d0ee31ba01f16acda854107d8c2bc62d)
ENJ | [0xb1780e6ca2ad5f6e87d442d7662c180727624fff](https://ropsten.etherscan.io/token/0xb1780e6ca2ad5f6e87d442d7662c180727624fff)
ANT | [0xf448bcc0ecb0363ecc0f26fcc97d2c362c915c46](https://ropsten.etherscan.io/token/0xf448bcc0ecb0363ecc0f26fcc97d2c362c915c46)
RLC | [0x46e039e1e25e8feed56a058ea40d465f22f163fd](https://ropsten.etherscan.io/token/0x46e039e1e25e8feed56a058ea40d465f22f163fd)
MCO | [0x9069799da2b29e11b2c8302dab11e32ad5c8aef1](https://ropsten.etherscan.io/token/0x9069799da2b29e11b2c8302dab11e32ad5c8aef1)
RCN | [0x1d765f4e209772fb7f20efc9946c6844047bd9ca](https://ropsten.etherscan.io/token/0x1d765f4e209772fb7f20efc9946c6844047bd9ca)
AST | [0xdbee45f675549181b8d4b22331f8ef15feee17cf](https://ropsten.etherscan.io/token/0xdbee45f675549181b8d4b22331f8ef15feee17cf)
SNGLS | [0x9f21f995920db4357477b252c386e028c76d96f8](https://ropsten.etherscan.io/token/0x9f21f995920db4357477b252c386e028c76d96f8)
MTL | [0xa7051184cd9c71bd3189020b4882c3b0c298533e](https://ropsten.etherscan.io/token/0xa7051184cd9c71bd3189020b4882c3b0c298533e)
AMB | [0xacabb105f400b51d3988d30c8f401caa90305149](https://ropsten.etherscan.io/token/0xacabb105f400b51d3988d30c8f401caa90305149)
MLN | [0x3a5c69414eb35346307913744d9cbc4d9109a61e](https://ropsten.etherscan.io/token/0x3a5c69414eb35346307913744d9cbc4d9109a61e)
EDG | [0x14e0a1f96aad380a35f82ae5fcf24f2c976d3a42](https://ropsten.etherscan.io/token/0x14e0a1f96aad380a35f82ae5fcf24f2c976d3a42)
WINGS | [0x3b6aa36831165b7d13215a0e80bc814a7cefe323](https://ropsten.etherscan.io/token/0x3b6aa36831165b7d13215a0e80bc814a7cefe323)
DNT | [0xcbf75271185eccce77861542618979951b987d81](https://ropsten.etherscan.io/token/0xcbf75271185eccce77861542618979951b987d81)
CDT | [0xd02270ab8b3d8047f27b3588d903caae07a856ab](https://ropsten.etherscan.io/token/0xd02270ab8b3d8047f27b3588d903caae07a856ab)
TAAS | [0x5e65f876d78c127f5cc2b8f1a227ba80ca314594](https://ropsten.etherscan.io/token/0x5e65f876d78c127f5cc2b8f1a227ba80ca314594)
ADT | [0x59e834696b487abc41b596830ac96b008b8c51fd](https://ropsten.etherscan.io/token/0x59e834696b487abc41b596830ac96b008b8c51fd)
1ST | [0x420f23afadf73bc5217d1b7d19341d814e1dc1ff](https://ropsten.etherscan.io/token/0x420f23afadf73bc5217d1b7d19341d814e1dc1ff)
NET | [0x6daf7d34807e04638c94495fdc3b84051ec32a62](https://ropsten.etherscan.io/token/0x6daf7d34807e04638c94495fdc3b84051ec32a62)
LUN | [0x4a22d31a48cab43bb73810788b66d6c73865be98](https://ropsten.etherscan.io/token/0x4a22d31a48cab43bb73810788b66d6c73865be98)
TKN | [0x143c47f4dd79efabb8734edc89d3218d6c9ae426](https://ropsten.etherscan.io/token/0x143c47f4dd79efabb8734edc89d3218d6c9ae426)
HMQ | [0xaafbaccfc5e8fbddf92724363c1bb18599e39be2](https://ropsten.etherscan.io/token/0xaafbaccfc5e8fbddf92724363c1bb18599e39be2)
CFI | [0x3e7b2c2c29e082a8bfecc988105dede40fd99662](https://ropsten.etherscan.io/token/0x3e7b2c2c29e082a8bfecc988105dede40fd99662)
TRST | [0x37cdd3c17557869b93094afc581a06e4f22d7591](https://ropsten.etherscan.io/token/0x37cdd3c17557869b93094afc581a06e4f22d7591)
NMR | [0x8d95bf3cd686e0c16cb526786ca0375800f53b6b](https://ropsten.etherscan.io/token/0x8d95bf3cd686e0c16cb526786ca0375800f53b6b)
GUPPY | [0xc8a62dc54632ccae1a0117ccd84ca9e1dab31fbc](https://ropsten.etherscan.io/token/0xc8a62dc54632ccae1a0117ccd84ca9e1dab31fbc)
BCAP | [0x48c37da15b1d9632ddf8fc546dc58fb002fab9ce](https://ropsten.etherscan.io/token/0x48c37da15b1d9632ddf8fc546dc58fb002fab9ce)
SWT | [0x33258fd5ddc6907e3bc63c8443fe48de98f04bbf](https://ropsten.etherscan.io/token/0x33258fd5ddc6907e3bc63c8443fe48de98f04bbf)
HGT | [0xd14d8fb1b08a1819fff2150105501237b27eb4af](https://ropsten.etherscan.io/token/0xd14d8fb1b08a1819fff2150105501237b27eb4af)
DICE | [0x8edb2b9591ce801f4280a0d765d0c117395fa1ce](https://ropsten.etherscan.io/token/0x8edb2b9591ce801f4280a0d765d0c117395fa1ce)
XAUR | [0x36c002d24f21482a7abe93c01228c40a62ee00bb](https://ropsten.etherscan.io/token/0x36c002d24f21482a7abe93c01228c40a62ee00bb)
TIME | [0xb8abef0374729eb9690b16047af6802bfd965011](https://ropsten.etherscan.io/token/0xb8abef0374729eb9690b16047af6802bfd965011)
PLU | [0x3bb8bade906b59ebf33aa4ded62fc690b4e8668e](https://ropsten.etherscan.io/token/0x3bb8bade906b59ebf33aa4ded62fc690b4e8668e)
VSL | [0xa0632350ac8c3d99db1b6a1b4707103b3ffa44af](https://ropsten.etherscan.io/token/0xa0632350ac8c3d99db1b6a1b4707103b3ffa44af)
IND | [0x6bcc49edb623b3c7e32cd409a934fafb2d4a3dab](https://ropsten.etherscan.io/token/0x6bcc49edb623b3c7e32cd409a934fafb2d4a3dab)
FYN | [0x89227b2c07603541a36f434e75a273d4b2f6b520](https://ropsten.etherscan.io/token/0x89227b2c07603541a36f434e75a273d4b2f6b520)
export const TestMintTokenABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "allowance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "needed",
        "type": "uint256"
      }
    ],
    "name": "ERC20InsufficientAllowance",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "needed",
        "type": "uint256"
      }
    ],
    "name": "ERC20InsufficientBalance",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "approver",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidApprover",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidReceiver",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidSender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidSpender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "requested",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxAllowed",
        "type": "uint256"
      }
    ],
    "name": "ExceedsMaxMintPerCall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidMintAmount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddressRecipient",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "TestTokenMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MAX_MINT_PER_CALL",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const TestMintTokenBytecode = "0x608060405234801561000f575f80fd5b506040518060400160405280601681526020017f4e46544d696e74706f7274205465737420546f6b656e00000000000000000000815250604051806040016040528060048152602001631393551560e21b8152508160039081610072919061011f565b50600461007f828261011f565b5050506101de565b634e487b7160e01b5f52604160045260245ffd5b600181811c908216806100af57607f821691505b6020821081036100cd57634e487b7160e01b5f52602260045260245ffd5b50919050565b601f82111561011a57805f5260205f20601f840160051c810160208510156100f85750805b601f840160051c820191505b81811015610117575f8155600101610104565b50505b505050565b81516001600160401b0381111561013857610138610087565b61014c81610146845461009b565b846100d3565b602080601f83116001811461017f575f84156101685750858301515b5f19600386901b1c1916600185901b1785556101d6565b5f85815260208120601f198616915b828110156101ad5788860151825594840194600190910190840161018e565b50858210156101ca57878501515f19600388901b60f8161c191681555b505060018460011b0185555b505050505050565b610844806101eb5f395ff3fe608060405234801561000f575f80fd5b50600436106100a6575f3560e01c806340c10f191161006e57806340c10f191461011f57806370a082311461013457806395d89b411461015c578063a9059cbb14610164578063dd62ed3e14610177578063ed495642146101af575f80fd5b806306fdde03146100aa578063095ea7b3146100c857806318160ddd146100eb57806323b872dd146100fd578063313ce56714610110575b5f80fd5b6100b26101c0565b6040516100bf919061069e565b60405180910390f35b6100db6100d6366004610705565b610250565b60405190151581526020016100bf565b6002545b6040519081526020016100bf565b6100db61010b36600461072d565b610269565b604051601281526020016100bf565b61013261012d366004610705565b61028c565b005b6100ef610142366004610766565b6001600160a01b03165f9081526020819052604090205490565b6100b2610367565b6100db610172366004610705565b610376565b6100ef610185366004610786565b6001600160a01b039182165f90815260016020908152604080832093909416825291909152205490565b6100ef69d3c21bcecceda100000081565b6060600380546101cf906107b7565b80601f01602080910402602001604051908101604052809291908181526020018280546101fb906107b7565b80156102465780601f1061021d57610100808354040283529160200191610246565b820191905f5260205f20905b81548152906001019060200180831161022957829003601f168201915b5050505050905090565b5f3361025d818585610383565b60019150505b92915050565b5f33610276858285610395565b610281858585610411565b506001949350505050565b6001600160a01b0382166102b3576040516308c9926560e31b815260040160405180910390fd5b805f036102d35760405163199f5a0360e31b815260040160405180910390fd5b69d3c21bcecceda10000008111156103165760405163d5c2461760e01b81526004810182905269d3c21bcecceda100000060248201526044015b60405180910390fd5b610320828261046e565b816001600160a01b03167f1d04698a6dbf374136f42777ac79734bb996c66d2a6fca12e56889849a59fbb78260405161035b91815260200190565b60405180910390a25050565b6060600480546101cf906107b7565b5f3361025d818585610411565b61039083838360016104a6565b505050565b6001600160a01b038381165f908152600160209081526040808320938616835292905220545f1981101561040b57818110156103fd57604051637dc7a0d960e11b81526001600160a01b0384166004820152602481018290526044810183905260640161030d565b61040b84848484035f6104a6565b50505050565b6001600160a01b03831661043a57604051634b637e8f60e11b81525f600482015260240161030d565b6001600160a01b0382166104635760405163ec442f0560e01b81525f600482015260240161030d565b610390838383610578565b6001600160a01b0382166104975760405163ec442f0560e01b81525f600482015260240161030d565b6104a25f8383610578565b5050565b6001600160a01b0384166104cf5760405163e602df0560e01b81525f600482015260240161030d565b6001600160a01b0383166104f857604051634a1406b160e11b81525f600482015260240161030d565b6001600160a01b038085165f908152600160209081526040808320938716835292905220829055801561040b57826001600160a01b0316846001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258460405161056a91815260200190565b60405180910390a350505050565b6001600160a01b0383166105a2578060025f82825461059791906107ef565b909155506106129050565b6001600160a01b0383165f90815260208190526040902054818110156105f45760405163391434e360e21b81526001600160a01b0385166004820152602481018290526044810183905260640161030d565b6001600160a01b0384165f9081526020819052604090209082900390555b6001600160a01b03821661062e5760028054829003905561064c565b6001600160a01b0382165f9081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161069191815260200190565b60405180910390a3505050565b5f602080835283518060208501525f5b818110156106ca578581018301518582016040015282016106ae565b505f604082860101526040601f19601f8301168501019250505092915050565b80356001600160a01b0381168114610700575f80fd5b919050565b5f8060408385031215610716575f80fd5b61071f836106ea565b946020939093013593505050565b5f805f6060848603121561073f575f80fd5b610748846106ea565b9250610756602085016106ea565b9150604084013590509250925092565b5f60208284031215610776575f80fd5b61077f826106ea565b9392505050565b5f8060408385031215610797575f80fd5b6107a0836106ea565b91506107ae602084016106ea565b90509250929050565b600181811c908216806107cb57607f821691505b6020821081036107e957634e487b7160e01b5f52602260045260245ffd5b50919050565b8082018082111561026357634e487b7160e01b5f52601160045260245ffdfea26469706673582212200d94e12983c862267d3fe488b4e5b7a3a0506e16530007d08174c1975d563a7c64736f6c63430008180033" as const;

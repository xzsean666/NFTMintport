export const SEAPORT_V16_ADDRESS = "0x0000000000000068F116a894984e2DB1123eB395" as const;
export const CONDUIT_CONTROLLER_ADDRESS = "0x00000000F9490004C103FB2A09CE222342427011" as const;
export const NO_CONDUIT_KEY = "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

export const SeaportV16ABI = [
  {
    type: "error",
    name: "OrderNotYetActive",
    inputs: [],
  },
  {
    type: "error",
    name: "OrderExpired",
    inputs: [],
  },
  {
    type: "error",
    name: "OrderIsCancelled",
    inputs: [],
  },
  {
    type: "error",
    name: "OrderAlreadyFilled",
    inputs: [],
  },
  {
    type: "error",
    name: "InsufficientValue",
    inputs: [],
  },
  {
    type: "error",
    name: "TransferFailed",
    inputs: [],
  },
  {
    type: "error",
    name: "UnauthorizedCaller",
    inputs: [],
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "seaportName", type: "string" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "getCounter",
    inputs: [{ name: "offerer", type: "address" }],
    outputs: [{ name: "currentCounter", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "incrementCounter",
    inputs: [],
    outputs: [{ name: "newCounter", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getOrderStatus",
    inputs: [{ name: "orderHash", type: "bytes32" }],
    outputs: [
      { name: "isValidated", type: "bool" },
      { name: "isCancelled", type: "bool" },
      { name: "totalFilled", type: "uint256" },
      { name: "totalSize", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOrderHash",
    inputs: [
      {
        name: "order",
        type: "tuple",
        components: [
          { name: "offerer", type: "address" },
          { name: "zone", type: "address" },
          {
            name: "offer",
            type: "tuple[]",
            components: [
              { name: "itemType", type: "uint8" },
              { name: "token", type: "address" },
              { name: "identifierOrCriteria", type: "uint256" },
              { name: "startAmount", type: "uint256" },
              { name: "endAmount", type: "uint256" },
            ],
          },
          {
            name: "consideration",
            type: "tuple[]",
            components: [
              { name: "itemType", type: "uint8" },
              { name: "token", type: "address" },
              { name: "identifierOrCriteria", type: "uint256" },
              { name: "startAmount", type: "uint256" },
              { name: "endAmount", type: "uint256" },
              { name: "recipient", type: "address" },
            ],
          },
          { name: "orderType", type: "uint8" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "zoneHash", type: "bytes32" },
          { name: "salt", type: "uint256" },
          { name: "conduitKey", type: "bytes32" },
          { name: "counter", type: "uint256" },
        ],
      },
    ],
    outputs: [{ name: "orderHash", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "fulfillOrder",
    inputs: [
      {
        name: "order",
        type: "tuple",
        components: [
          {
            name: "parameters",
            type: "tuple",
            components: [
              { name: "offerer", type: "address" },
              { name: "zone", type: "address" },
              {
                name: "offer",
                type: "tuple[]",
                components: [
                  { name: "itemType", type: "uint8" },
                  { name: "token", type: "address" },
                  { name: "identifierOrCriteria", type: "uint256" },
                  { name: "startAmount", type: "uint256" },
                  { name: "endAmount", type: "uint256" },
                ],
              },
              {
                name: "consideration",
                type: "tuple[]",
                components: [
                  { name: "itemType", type: "uint8" },
                  { name: "token", type: "address" },
                  { name: "identifierOrCriteria", type: "uint256" },
                  { name: "startAmount", type: "uint256" },
                  { name: "endAmount", type: "uint256" },
                  { name: "recipient", type: "address" },
                ],
              },
              { name: "orderType", type: "uint8" },
              { name: "startTime", type: "uint256" },
              { name: "endTime", type: "uint256" },
              { name: "zoneHash", type: "bytes32" },
              { name: "salt", type: "uint256" },
              { name: "conduitKey", type: "bytes32" },
              { name: "totalOriginalConsiderationItems", type: "uint256" },
            ],
          },
          { name: "signature", type: "bytes" },
        ],
      },
      { name: "fulfillerConduitKey", type: "bytes32" },
    ],
    outputs: [{ name: "fulfilled", type: "bool" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "cancel",
    inputs: [
      {
        name: "orders",
        type: "tuple[]",
        components: [
          { name: "offerer", type: "address" },
          { name: "zone", type: "address" },
          {
            name: "offer",
            type: "tuple[]",
            components: [
              { name: "itemType", type: "uint8" },
              { name: "token", type: "address" },
              { name: "identifierOrCriteria", type: "uint256" },
              { name: "startAmount", type: "uint256" },
              { name: "endAmount", type: "uint256" },
            ],
          },
          {
            name: "consideration",
            type: "tuple[]",
            components: [
              { name: "itemType", type: "uint8" },
              { name: "token", type: "address" },
              { name: "identifierOrCriteria", type: "uint256" },
              { name: "startAmount", type: "uint256" },
              { name: "endAmount", type: "uint256" },
              { name: "recipient", type: "address" },
            ],
          },
          { name: "orderType", type: "uint8" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "zoneHash", type: "bytes32" },
          { name: "salt", type: "uint256" },
          { name: "conduitKey", type: "bytes32" },
          { name: "counter", type: "uint256" },
        ],
      },
    ],
    outputs: [{ name: "cancelled", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "OrderFulfilled",
    inputs: [
      { name: "orderHash", type: "bytes32", indexed: false },
      { name: "offerer", type: "address", indexed: true },
      { name: "zone", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: false },
      {
        name: "offer",
        type: "tuple[]",
        indexed: false,
        components: [
          { name: "itemType", type: "uint8" },
          { name: "token", type: "address" },
          { name: "identifierOrCriteria", type: "uint256" },
          { name: "amount", type: "uint256" },
        ],
      },
      {
        name: "consideration",
        type: "tuple[]",
        indexed: false,
        components: [
          { name: "itemType", type: "uint8" },
          { name: "token", type: "address" },
          { name: "identifierOrCriteria", type: "uint256" },
          { name: "amount", type: "uint256" },
          { name: "recipient", type: "address" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "OrderCancelled",
    inputs: [
      { name: "orderHash", type: "bytes32", indexed: false },
      { name: "offerer", type: "address", indexed: true },
      { name: "zone", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "CounterIncremented",
    inputs: [
      { name: "newCounter", type: "uint256", indexed: false },
      { name: "offerer", type: "address", indexed: true },
    ],
  },
] as const;

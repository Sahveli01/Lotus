import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CDSMKU7LVWNDTEM3QNK2WGQNP5TEXRMRQCBTUQUHZ6EY77GU6EX4OWMU",
  }
} as const

export type DataKey = {tag: "Admin", values: void} | {tag: "UsdcToken", values: void} | {tag: "BlendPool", values: void} | {tag: "TotalDeposits", values: void} | {tag: "PrizePool", values: void} | {tag: "NextDraw", values: void} | {tag: "DrawInterval", values: void} | {tag: "RoundNumber", values: void} | {tag: "LastWinner", values: void} | {tag: "LastPrize", values: void} | {tag: "TotalWinners", values: void} | {tag: "Deposit", values: readonly [string]} | {tag: "Nonce", values: void};

export interface Client {
  /**
   * Construct and simulate a deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Kullanıcı USDC yatırır. Anapara güvende kalır, yield prize pool'a gider.
   */
  deposit: ({user, amount}: {user: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Kullanıcı anaparasını geri çeker. Yield prize pool'da kalır.
   */
  withdraw: ({user, amount}: {user: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_admin: ({current_admin, new_admin}: {current_admin: string, new_admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_config: (options?: MethodOptions) => Promise<AssembledTransaction<readonly [string, string, u64]>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Kontratı başlatır. Sadece bir kez çağrılabilir.
   */
  initialize: ({admin, usdc_token, blend_pool, draw_interval}: {admin: string, usdc_token: string, blend_pool: string, draw_interval: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_deposit: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a accrue_yield transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin yield'i bildirir (Blend'den gelen faiz).
   * MVP: Admin manuel çağırır. V2'de otomatik Blend entegrasyonu.
   */
  accrue_yield: ({admin, yield_amount}: {admin: string, yield_amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a execute_draw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Çekilişi gerçekleştirir. Herkes çağırabilir ama zamanı geldiyse.
   * Kazananı pseudo-random seçer (MVP). V2'de Stellar VRF kullanır.
   */
  execute_draw: ({participants}: {participants: Array<string>}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_next_draw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_next_draw: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_last_prize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_last_prize: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_prize_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_prize_pool: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_win_chance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Kullanıcının kazanma şansını yüzde olarak döner (7 decimal)
   */
  get_win_chance: ({user}: {user: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_last_winner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_last_winner: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a get_round_number transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_round_number: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a get_total_winners transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_total_winners: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a set_draw_interval transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_draw_interval: ({admin, interval}: {admin: string, interval: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_total_deposits transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_total_deposits: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAE5LdWxsYW7EsWPEsSBVU0RDIHlhdMSxcsSxci4gQW5hcGFyYSBnw7x2ZW5kZSBrYWzEsXIsIHlpZWxkIHByaXplIHBvb2wnYSBnaWRlci4AAAAAAAdkZXBvc2l0AAAAAAIAAAAAAAAABHVzZXIAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAAEJLdWxsYW7EsWPEsSBhbmFwYXJhc8SxbsSxIGdlcmkgw6dla2VyLiBZaWVsZCBwcml6ZSBwb29sJ2RhIGthbMSxci4AAAAAAAh3aXRoZHJhdwAAAAIAAAAAAAAABHVzZXIAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAAAAAAAAJc2V0X2FkbWluAAAAAAAAAgAAAAAAAAANY3VycmVudF9hZG1pbgAAAAAAABMAAAAAAAAACW5ld19hZG1pbgAAAAAAABMAAAAA",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAADQAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAJVXNkY1Rva2VuAAAAAAAAAAAAAAAAAAAJQmxlbmRQb29sAAAAAAAAAAAAAAAAAAANVG90YWxEZXBvc2l0cwAAAAAAAAAAAAAAAAAACVByaXplUG9vbAAAAAAAAAAAAAAAAAAACE5leHREcmF3AAAAAAAAAAAAAAAMRHJhd0ludGVydmFsAAAAAAAAAAAAAAALUm91bmROdW1iZXIAAAAAAAAAAAAAAAAKTGFzdFdpbm5lcgAAAAAAAAAAAAAAAAAJTGFzdFByaXplAAAAAAAAAAAAAAAAAAAMVG90YWxXaW5uZXJzAAAAAQAAAAAAAAAHRGVwb3NpdAAAAAABAAAAEwAAAAAAAAAAAAAABU5vbmNlAAAA",
        "AAAAAAAAAAAAAAAKZ2V0X2NvbmZpZwAAAAAAAAAAAAEAAAPtAAAAAwAAABMAAAATAAAABg==",
        "AAAAAAAAADVLb250cmF0xLEgYmHFn2xhdMSxci4gU2FkZWNlIGJpciBrZXogw6dhxJ9yxLFsYWJpbGlyLgAAAAAAAAppbml0aWFsaXplAAAAAAAEAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAACnVzZGNfdG9rZW4AAAAAABMAAAAAAAAACmJsZW5kX3Bvb2wAAAAAABMAAAAAAAAADWRyYXdfaW50ZXJ2YWwAAAAAAAAGAAAAAA==",
        "AAAAAAAAAAAAAAALZ2V0X2RlcG9zaXQAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAACw==",
        "AAAAAAAAAHBBZG1pbiB5aWVsZCdpIGJpbGRpcmlyIChCbGVuZCdkZW4gZ2VsZW4gZmFpeikuCk1WUDogQWRtaW4gbWFudWVsIMOnYcSfxLFyxLFyLiBWMidkZSBvdG9tYXRpayBCbGVuZCBlbnRlZ3Jhc3lvbnUuAAAADGFjY3J1ZV95aWVsZAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAMeWllbGRfYW1vdW50AAAACwAAAAA=",
        "AAAAAAAAAIvDh2VraWxpxZ9pIGdlcsOnZWtsZcWfdGlyaXIuIEhlcmtlcyDDp2HEn8SxcmFiaWxpciBhbWEgemFtYW7EsSBnZWxkaXlzZS4KS2F6YW5hbsSxIHBzZXVkby1yYW5kb20gc2XDp2VyIChNVlApLiBWMidkZSBTdGVsbGFyIFZSRiBrdWxsYW7EsXIuAAAAAAxleGVjdXRlX2RyYXcAAAABAAAAAAAAAAxwYXJ0aWNpcGFudHMAAAPqAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAANZ2V0X25leHRfZHJhdwAAAAAAAAAAAAABAAAABg==",
        "AAAAAAAAAAAAAAAOZ2V0X2xhc3RfcHJpemUAAAAAAAAAAAABAAAACw==",
        "AAAAAAAAAAAAAAAOZ2V0X3ByaXplX3Bvb2wAAAAAAAAAAAABAAAACw==",
        "AAAAAAAAAENLdWxsYW7EsWPEsW7EsW4ga2F6YW5tYSDFn2Fuc8SxbsSxIHnDvHpkZSBvbGFyYWsgZMO2bmVyICg3IGRlY2ltYWwpAAAAAA5nZXRfd2luX2NoYW5jZQAAAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAACw==",
        "AAAAAAAAAAAAAAAPZ2V0X2xhc3Rfd2lubmVyAAAAAAAAAAABAAAD6AAAABM=",
        "AAAAAAAAAAAAAAAQZ2V0X3JvdW5kX251bWJlcgAAAAAAAAABAAAABA==",
        "AAAAAAAAAAAAAAARZ2V0X3RvdGFsX3dpbm5lcnMAAAAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAARc2V0X2RyYXdfaW50ZXJ2YWwAAAAAAAACAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAACGludGVydmFsAAAABgAAAAA=",
        "AAAAAAAAAAAAAAASZ2V0X3RvdGFsX2RlcG9zaXRzAAAAAAAAAAAAAQAAAAs=" ]),
      options
    )
  }
  public readonly fromJSON = {
    deposit: this.txFromJSON<null>,
        withdraw: this.txFromJSON<null>,
        set_admin: this.txFromJSON<null>,
        get_config: this.txFromJSON<readonly [string, string, u64]>,
        initialize: this.txFromJSON<null>,
        get_deposit: this.txFromJSON<i128>,
        accrue_yield: this.txFromJSON<null>,
        execute_draw: this.txFromJSON<null>,
        get_next_draw: this.txFromJSON<u64>,
        get_last_prize: this.txFromJSON<i128>,
        get_prize_pool: this.txFromJSON<i128>,
        get_win_chance: this.txFromJSON<i128>,
        get_last_winner: this.txFromJSON<Option<string>>,
        get_round_number: this.txFromJSON<u32>,
        get_total_winners: this.txFromJSON<u32>,
        set_draw_interval: this.txFromJSON<null>,
        get_total_deposits: this.txFromJSON<i128>
  }
}
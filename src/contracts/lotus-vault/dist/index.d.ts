import { Buffer } from "buffer";
import { AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions } from "@stellar/stellar-sdk/contract";
import type { u32, u64, i128, Option } from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";
export declare const networks: {
    readonly testnet: {
        readonly networkPassphrase: "Test SDF Network ; September 2015";
        readonly contractId: "CDSMKU7LVWNDTEM3QNK2WGQNP5TEXRMRQCBTUQUHZ6EY77GU6EX4OWMU";
    };
};
export type DataKey = {
    tag: "Admin";
    values: void;
} | {
    tag: "UsdcToken";
    values: void;
} | {
    tag: "BlendPool";
    values: void;
} | {
    tag: "TotalDeposits";
    values: void;
} | {
    tag: "PrizePool";
    values: void;
} | {
    tag: "NextDraw";
    values: void;
} | {
    tag: "DrawInterval";
    values: void;
} | {
    tag: "RoundNumber";
    values: void;
} | {
    tag: "LastWinner";
    values: void;
} | {
    tag: "LastPrize";
    values: void;
} | {
    tag: "TotalWinners";
    values: void;
} | {
    tag: "Deposit";
    values: readonly [string];
} | {
    tag: "Nonce";
    values: void;
};
export interface Client {
    /**
     * Construct and simulate a deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Kullanıcı USDC yatırır. Anapara güvende kalır, yield prize pool'a gider.
     */
    deposit: ({ user, amount }: {
        user: string;
        amount: i128;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Kullanıcı anaparasını geri çeker. Yield prize pool'da kalır.
     */
    withdraw: ({ user, amount }: {
        user: string;
        amount: i128;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a set_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    set_admin: ({ current_admin, new_admin }: {
        current_admin: string;
        new_admin: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_config: (options?: MethodOptions) => Promise<AssembledTransaction<readonly [string, string, u64]>>;
    /**
     * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Kontratı başlatır. Sadece bir kez çağrılabilir.
     */
    initialize: ({ admin, usdc_token, blend_pool, draw_interval }: {
        admin: string;
        usdc_token: string;
        blend_pool: string;
        draw_interval: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_deposit: ({ user }: {
        user: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a accrue_yield transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Admin yield'i bildirir (Blend'den gelen faiz).
     * MVP: Admin manuel çağırır. V2'de otomatik Blend entegrasyonu.
     */
    accrue_yield: ({ admin, yield_amount }: {
        admin: string;
        yield_amount: i128;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a execute_draw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Çekilişi gerçekleştirir. Herkes çağırabilir ama zamanı geldiyse.
     * Kazananı pseudo-random seçer (MVP). V2'de Stellar VRF kullanır.
     */
    execute_draw: ({ participants }: {
        participants: Array<string>;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_next_draw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_next_draw: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>;
    /**
     * Construct and simulate a get_last_prize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_last_prize: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a get_prize_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_prize_pool: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a get_win_chance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     * Kullanıcının kazanma şansını yüzde olarak döner (7 decimal)
     */
    get_win_chance: ({ user }: {
        user: string;
    }, options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
    /**
     * Construct and simulate a get_last_winner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_last_winner: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>;
    /**
     * Construct and simulate a get_round_number transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_round_number: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>;
    /**
     * Construct and simulate a get_total_winners transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_total_winners: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>;
    /**
     * Construct and simulate a set_draw_interval transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    set_draw_interval: ({ admin, interval }: {
        admin: string;
        interval: u64;
    }, options?: MethodOptions) => Promise<AssembledTransaction<null>>;
    /**
     * Construct and simulate a get_total_deposits transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
     */
    get_total_deposits: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>;
}
export declare class Client extends ContractClient {
    readonly options: ContractClientOptions;
    static deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions & Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
    }): Promise<AssembledTransaction<T>>;
    constructor(options: ContractClientOptions);
    readonly fromJSON: {
        deposit: (json: string) => AssembledTransaction<null>;
        withdraw: (json: string) => AssembledTransaction<null>;
        set_admin: (json: string) => AssembledTransaction<null>;
        get_config: (json: string) => AssembledTransaction<readonly [string, string, bigint]>;
        initialize: (json: string) => AssembledTransaction<null>;
        get_deposit: (json: string) => AssembledTransaction<bigint>;
        accrue_yield: (json: string) => AssembledTransaction<null>;
        execute_draw: (json: string) => AssembledTransaction<null>;
        get_next_draw: (json: string) => AssembledTransaction<bigint>;
        get_last_prize: (json: string) => AssembledTransaction<bigint>;
        get_prize_pool: (json: string) => AssembledTransaction<bigint>;
        get_win_chance: (json: string) => AssembledTransaction<bigint>;
        get_last_winner: (json: string) => AssembledTransaction<Option<string>>;
        get_round_number: (json: string) => AssembledTransaction<number>;
        get_total_winners: (json: string) => AssembledTransaction<number>;
        set_draw_interval: (json: string) => AssembledTransaction<null>;
        get_total_deposits: (json: string) => AssembledTransaction<bigint>;
    };
}

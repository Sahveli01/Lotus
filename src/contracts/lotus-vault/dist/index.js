import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from "@stellar/stellar-sdk/contract";
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
};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAAAAAE5LdWxsYW7EsWPEsSBVU0RDIHlhdMSxcsSxci4gQW5hcGFyYSBnw7x2ZW5kZSBrYWzEsXIsIHlpZWxkIHByaXplIHBvb2wnYSBnaWRlci4AAAAAAAdkZXBvc2l0AAAAAAIAAAAAAAAABHVzZXIAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
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
            "AAAAAAAAAAAAAAASZ2V0X3RvdGFsX2RlcG9zaXRzAAAAAAAAAAAAAQAAAAs="]), options);
        this.options = options;
    }
    fromJSON = {
        deposit: (this.txFromJSON),
        withdraw: (this.txFromJSON),
        set_admin: (this.txFromJSON),
        get_config: (this.txFromJSON),
        initialize: (this.txFromJSON),
        get_deposit: (this.txFromJSON),
        accrue_yield: (this.txFromJSON),
        execute_draw: (this.txFromJSON),
        get_next_draw: (this.txFromJSON),
        get_last_prize: (this.txFromJSON),
        get_prize_pool: (this.txFromJSON),
        get_win_chance: (this.txFromJSON),
        get_last_winner: (this.txFromJSON),
        get_round_number: (this.txFromJSON),
        get_total_winners: (this.txFromJSON),
        set_draw_interval: (this.txFromJSON),
        get_total_deposits: (this.txFromJSON)
    };
}

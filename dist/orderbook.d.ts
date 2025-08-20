interface Order {
    price: number;
    quantity: number;
    orderId: string;
}
export declare enum Side {
    Bid = "bid",
    Ask = "ask"
}
interface Bid extends Order {
    side: Side.Bid;
}
interface Ask extends Order {
    side: Side.Ask;
}
interface Orderbook {
    bids: Bid[];
    asks: Ask[];
}
export declare const orderbook: Orderbook;
type PriceQuantityMap = {
    [price: number]: number;
};
export declare const bookWithQuantity: {
    bids: PriceQuantityMap;
    asks: PriceQuantityMap;
};
export {};
//# sourceMappingURL=orderbook.d.ts.map
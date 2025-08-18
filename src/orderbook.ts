interface Order {
    price: number,
    quantity: number;
    orderId: string;
}

enum Side {
    Bid = 'bid',
    Ask = 'ask'
}

interface Bid extends Order {
    side: Side.Bid
}

interface Ask extends Order {
    side: Side.Ask
}

interface Orderbook {
    bids: Bid[],
    asks: Ask[]
}

export const orderbook: Orderbook = {
    bids: [

    ],
    asks: [

    ]
}

type PriceQuantityMap = { [price: number]: number };

export const bookWithQuantity: { bids: PriceQuantityMap; asks: PriceQuantityMap } = {
    bids: {},
    asks: {}
};

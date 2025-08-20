import express from "express";
import { OrderInputSchema } from "./types.js";
import { orderbook, bookWithQuantity, Side } from "./orderbook.js";
const BASE_ASSET = 'BTC';
const QUOTE_ASSET = 'USD';
const app = express();
app.use(express.json());
let GLOBAL_TRADE_ID = 0;
app.post('/api/v1/order', (req, res) => {
    const order = OrderInputSchema.safeParse(req.body);
    if (!order.success) {
        res.status(400).send(order.error.message);
        return;
    }
    const { baseAsset, quoteAsset, price, quantity, side, kind } = order.data;
    const orderId = getOrderId();
    if (baseAsset !== BASE_ASSET || quoteAsset !== QUOTE_ASSET) {
        res.status(400).send('Invalid base or quote asset');
        return;
    }
    const { executedQty, fills } = fillOrder(orderId, price, quantity, side, kind);
    res.send({
        orderId,
        executedQty,
        fills
    });
});
// Get the full orderbook (all bids and asks)
app.get('/api/v1/orderbook', (req, res) => {
    res.json(orderbook);
});
// Get the price-level summary (total quantity at each price for bids and asks)
app.get('/api/v1/orderbook/summary', (req, res) => {
    res.json(bookWithQuantity);
});
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
function getOrderId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
function fillOrder(orderId, price, quantity, side, type) {
    const fills = [];
    const maxFillQuantity = getFillAmount(price, quantity, side); //tells the maximum that can be executed right now, based on the current orderbook.
    let executedQty = 0;
    //immediate or cancel
    if (type === 'ioc' && maxFillQuantity < quantity) {
        return { status: 'rejected', executedQty: maxFillQuantity, fills: [] };
    }
    if (side === 'buy') {
        orderbook.asks.forEach(o => {
            if (o.price <= price && quantity > 0) {
                console.log("filling ask");
                const filledQuantity = Math.min(quantity, o.quantity); // take the min quantity 
                console.log(filledQuantity);
                // Log the trade
                console.log(`TRADE: price=${o.price}, qty=${filledQuantity}, tradeId=${GLOBAL_TRADE_ID}`);
                // update the orderbook 
                o.quantity -= filledQuantity;
                bookWithQuantity.asks[o.price] = (bookWithQuantity.asks[o.price] || 0) - filledQuantity;
                //actual trade 
                fills.push({
                    price: o.price,
                    qty: filledQuantity,
                    tradeId: GLOBAL_TRADE_ID++
                });
                executedQty += filledQuantity;
                quantity -= filledQuantity;
                // If the seller's order is now fully filled (quantity is zero), remove it from the orderbook
                if (o.quantity === 0) {
                    orderbook.asks.splice(orderbook.asks.indexOf(o), 1);
                }
                // If there are no more stocks left at this price level in the summary, remove the price entry
                if (bookWithQuantity.asks[o.price] === 0) {
                    delete bookWithQuantity.asks[o.price];
                }
            }
        });
        // Place on the book if order not filled
        if (quantity !== 0) {
            orderbook.bids.push({
                price,
                quantity: quantity - executedQty,
                side: Side.Bid,
                orderId
            });
            //If your buy order wasn’t fully filled, the remaining part is placed on the orderbook as a new bid.
            bookWithQuantity.bids[price] = (bookWithQuantity.bids[price] || 0) + (quantity - executedQty);
        }
    }
    else {
        orderbook.bids.forEach(o => {
            if (o.price >= price && quantity > 0) { //checks if buyer's price is higher or equal to sellers
                const filledQuantity = Math.min(quantity, o.quantity); // take the min quantity b/w buyer and seller 
                // Log the trade
                console.log(`TRADE: price=${o.price}, qty=${filledQuantity}, tradeId=${GLOBAL_TRADE_ID}`);
                o.quantity -= filledQuantity;
                bookWithQuantity.bids[price] = (bookWithQuantity.bids[price] || 0) - filledQuantity;
                //actual trade
                fills.push({
                    price: o.price,
                    qty: filledQuantity,
                    tradeId: GLOBAL_TRADE_ID++
                });
                //update the quantity
                executedQty += filledQuantity;
                quantity -= filledQuantity;
                //Removes the individual buy order from the orderbook if it is fully filled.
                if (o.quantity === 0) {
                    orderbook.bids.splice(orderbook.bids.indexOf(o), 1);
                }
                //Removes the price level from the summary if there are no more buy orders at that price.
                if (bookWithQuantity.bids[price] === 0) {
                    delete bookWithQuantity.bids[price];
                }
            }
        });
        // Place on the book if order not filled
        if (quantity !== 0) {
            orderbook.asks.push({
                price,
                quantity: quantity,
                side: Side.Ask,
                orderId
            });
            bookWithQuantity.asks[price] = (bookWithQuantity.asks[price] || 0) + (quantity);
        }
    }
    return {
        status: 'accepted',
        executedQty,
        fills
    };
}
//Calculates the maximum quantity of an order that can be immediately filled
function getFillAmount(price, quantity, side) {
    let filled = 0;
    if (side === 'buy') {
        orderbook.asks.forEach(o => {
            if (o.price < price) {
                filled += Math.min(quantity, o.quantity);
            }
        });
    }
    else {
        orderbook.bids.forEach(o => {
            if (o.price > price) {
                filled += Math.min(quantity, o.quantity);
            }
        });
    }
    return filled;
}
//# sourceMappingURL=index.js.map
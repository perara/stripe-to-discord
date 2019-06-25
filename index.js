// Set your secret key: remember to change this to your live secret key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')(process.env.API_KEY);

// Find your endpoint's secret in your Dashboard's webhook settings
const endpointSecret = process.env.ENDPOINT_SECRET;

// This example uses Express to receive webhooks
const app = require('express')();

// Use body-parser to retrieve the raw body as a buffer
const bodyParser = require('body-parser');

// Match the raw body to content type application/json
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (request, response) => {
    const sig = request.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    }
    catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'charge.succeeded':
            const paymentIntent = event.data.object;
            console.log(paymentIntent);
            handlePaymentIntentSucceeded(paymentIntent);
            break;
        default:
            // Unexpected event type
            return response.status(400).end();
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Express Server is now running on port ${port}`);
});
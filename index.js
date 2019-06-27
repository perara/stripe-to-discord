// includes
require('dotenv').config();
const crypto = require('crypto');
const app = require('express')();
const bodyParser = require('body-parser');

// stripe settings & includes
// Find your endpoint's secret in your Dashboard's webhook settings
const stripe = require('stripe')(process.env.API_KEY);
const endpointSecret = process.env.ENDPOINT_SECRET;

// discord settings & includes
const Discord = require('discord.js');
const { RichEmbed } = require('discord.js');

// convert webhook link to id/token pair
let webhookArray = process.env.PAYMENT_HOOK.split('/');
const hook = new Discord.WebhookClient(
	webhookArray[webhookArray.length - 2],
	webhookArray[webhookArray.length - 1],
);

app.get('/', (request, response) => {
	response.status(200).json({
		response: true,
		description: 'stripe to discord by @darroneggins',
	});
});

app.get('/test', (request, response) => {
	let paymentIntent = {
		email: 'darron@copped.io',
		billing_details: {
			email: 'darron@copped.io',
			name: 'Darron Eggins',
		},
		amount: '10000',
		currency: 'usd',
		id: 'ch_123131313121',
	};

	let avatarImage = `https://www.gravatar.com/avatar/${crypto
		.createHash('md5')
		.update(paymentIntent.billing_details.email)
		.digest('hex')}?s=512&d=${encodeURIComponent(
		'https://stripe.com/img/v3/home/twitter.png',
	)}`;

	const testEmbed = new RichEmbed()
		.setTitle('View Payment')
		.setURL(`https://dashboard.stripe.com/payments/${paymentIntent.id}`)
		.addField(`New Payment`, `${paymentIntent.billing_details.name}`, true)
		.addField(
			`Amount`,
			`$${(paymentIntent.amount / 100).toFixed(
				2,
			)} ${paymentIntent.currency.toUpperCase()} `,
			true,
		)
		.addField(`Email`, `${paymentIntent.billing_details.email} `)
		.setThumbnail(avatarImage)
		.setTimestamp()
		.setColor('#32CD32');

	hook.send(testEmbed);

	response.status(200).json({ success: true });
});

// Match the raw body to content type application/json
app.post(
	'/webhook',
	bodyParser.raw({ type: 'application/json' }),
	(request, response) => {
		const sig = request.headers['stripe-signature'];

		let event;

		try {
			event = stripe.webhooks.constructEvent(
				request.body,
				sig,
				endpointSecret,
			);
		} catch (err) {
			response.status(400).send(`Webhook Error: ${err.message} `);
		}

		// Handle the event
		switch (event.type) {
			case 'charge.succeeded':
				const paymentIntent = event.data.object;

				let avatarImage = `https://www.gravatar.com/avatar/${crypto
					.createHash('md5')
					.update(paymentIntent.billing_details.email)
					.digest('hex')}?s=512&d=${encodeURIComponent(
					'https://stripe.com/img/v3/home/twitter.png',
				)}`;

				const successEmbed = new RichEmbed()
					.setTitle('View Payment')
					.setURL(
						`https://dashboard.stripe.com/payments/${paymentIntent.id}`,
					)
					.addField(
						`New Payment`,
						`${paymentIntent.billing_details.name}`,
						true,
					)
					.addField(
						`Amount`,
						`$${(paymentIntent.amount / 100).toFixed(
							2,
						)} ${paymentIntent.currency.toUpperCase()} `,
						true,
					)
					.addField(
						`Email`,
						`${paymentIntent.billing_details.email} `,
					)
					.setThumbnail(avatarImage)
					.setTimestamp()
					.setColor('#32CD32');

				hook.send(successEmbed);

				return response.status(200).send(paymentIntent);

			case 'charge.failed':
				const paymentIntentFailed = event.data.object;

				let avatarImageFailed = `https://www.gravatar.com/avatar/${crypto
					.createHash('md5')
					.update(paymentIntentFailed.billing_details.email)
					.digest('hex')}?s=512&d=${encodeURIComponent(
					'https://stripe.com/img/v3/home/twitter.png',
				)}`;

				const failedEmbed = new RichEmbed()
					.setTitle('View Payment')
					.setURL(
						`https://dashboard.stripe.com/payments/${paymentIntentFailed.id}`,
					)
					.addField(
						`Failed Payment`,
						`${paymentIntentFailed.billing_details.name}`,
						true,
					)
					.addField(
						`Amount`,
						`$${(paymentIntentFailed.amount / 100).toFixed(
							2,
						)} ${paymentIntentFailed.currency.toUpperCase()} `,
						true,
					)
					.addField(
						`Email`,
						`${paymentIntentFailed.billing_details.email} `,
					)
					.setThumbnail(avatarImageFailed)
					.setTimestamp()
					.setColor('red');

				hook.send(failedEmbed);

				return response.status(200).send(paymentIntentFailed);
			default:
				// Unexpected event type
				return response.status(400).end();
		}

		// Return a response to acknowledge receipt of the event
		response.json({ received: true });
	},
);

const port = process.env.PORT || 5000;

app.listen(port, () => {
	console.log(`Express Server is now running on port ${port} `);
});

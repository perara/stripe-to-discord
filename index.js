// includes
require('dotenv').config();
const gravatar = require('gravatar');
const app = require('express')();
const bodyParser = require('body-parser');

const Sentry = require('@sentry/node');
Sentry.init({
	dsn: 'https://0a2dcb73e2e64bde8d007d4e6cd06702@sentry.io/1491411',
});

// stripe settings & includes
// Find your endpoint's secret in your Dashboard's webhook settings
const stripe = require('stripe')(process.env.API_KEY);
const endpointSecret = process.env.ENDPOINT_SECRET;

// discord settings & includes
const Discord = require('discord.js');

// convert webhook link to id/token pair
const [webhookId, webhookSecret] = process.env.PAYMENT_HOOK.split('/').slice(5);
const hook = new Discord.WebhookClient(webhookId, webhookSecret);

app.get('/', (request, response) => {
	response.status(200).json({
		response: true,
		description: 'Stripe to discord by @darroneggins',
	});
});

app.get('/test', (request, response) => {
	const paymentIntentTest = {
		email: 'darron@copped.io',
		billing_details: {
			email: 'darron@copped.io',
			name: 'Darron Eggins',
		},
		description: 'darron@copped.io',
		amount: '10000',
		currency: 'usd',
		id: 'ch_123131313121',
	};

	// const avatarImage = `https://www.gravatar.com/avatar/${crypto
	// 	.createHash('md5')
	// 	.update(paymentIntent.description)
	// 	.digest('hex')}?s=512&d=${encodeURIComponent(
	// 	'https://stripe.com/img/v3/home/twitter.png',
	// )}`;

	const testAvatarURL = gravatar.url(paymentIntentTest.description, {
		protocol: 'https',
		s: '512',
	});

	console.log(testAvatarURL);

	const testEmbed = new Discord.RichEmbed()
		.setTitle('View Payment')
		.setURL(`https://dashboard.stripe.com/payments/${paymentIntentTest.id}`)
		.addField(`New Payment`, paymentIntentTest.billing_details.name, true)
		.addField(
			`Amount`,
			new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: paymentIntentTest.currency,
			}).format(paymentIntentTest.amount / 100),
			true,
		)
		.addField(`Email`, paymentIntentTest.description)
		.setThumbnail(testAvatarURL)
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

				console.log(paymentIntent);

				// const avatarImage = `https://www.gravatar.com/avatar/${crypto
				// 	.createHash('md5')
				// 	.update(paymentIntent.description)
				// 	.digest('hex')}?s=512&d=${encodeURIComponent(
				// 	'https://stripe.com/img/v3/home/twitter.png',
				// )}`;

				const successEmbed = new Discord.RichEmbed()
					.setTitle('View Payment')
					.setURL(
						`https://dashboard.stripe.com/payments/${paymentIntent.id}`,
					)
					.addField(
						`New Payment`,
						paymentIntent.billing_details.name,
						true,
					)
					.addField(
						`Amount`,
						new Intl.NumberFormat('en-US', {
							style: 'currency',
							currency: paymentIntent.currency,
						}).format(paymentIntent.amount / 100),
						true,
					)
					.addField(`Email`, paymentIntent.description)
					// .setThumbnail(avatarImage)
					.setTimestamp()
					.setColor('#32CD32');

				hook.send(successEmbed);

				return response.status(200).send(paymentIntent);

			case 'charge.failed':
				const paymentIntentFailed = event.data.object;

				// const avatarImageFailed = `https://www.gravatar.com/avatar/${crypto
				// 	.createHash('md5')
				// 	.update(paymentIntentFailed.description)
				// 	.digest('hex')}?s=512&d=${encodeURIComponent(
				// 	'https://stripe.com/img/v3/home/twitter.png',
				// )}`;

				const failedEmbed = new Discord.RichEmbed()
					.setTitle('View Payment')
					.setURL(
						`https://dashboard.stripe.com/payments/${paymentIntentFailed.id}`,
					)
					.addField(
						`Failed Payment`,
						paymentIntentFailed.billing_details.name,
						true,
					)
					.addField(
						`Amount`,
						new Intl.NumberFormat('en-US', {
							style: 'currency',
							currency: paymentIntentFailed.currency,
						}).format(paymentIntentFailed.amount / 100),
						true,
					)
					.addField(`Email`, paymentIntentFailed.description)
					// .setThumbnail(avatarImageFailed)
					.setTimestamp()
					.setColor('red');

				hook.send(failedEmbed);

				return response.status(200).send(paymentIntentFailed);

			default:
				// Unexpected event type
				return response.status(400).end();
		}
	},
);

const port = process.env.PORT || 5000;

app.listen(port, () => {
	console.log(`Express Server is now running on port ${port} `);
});

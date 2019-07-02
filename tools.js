const Discord = require('discord.js');
const gravatar = require('gravatar');

let tools = {};

tools.makeEmbed = () => {
	return new Discord.RichEmbed()
		.setTitle('View Details')
		.setFooter(
			`Stripe Notification`,
			'https://stripe.com/img/v3/home/twitter.png',
		)
		.setTimestamp();
};

tools.gravatar = email => {
	return gravatar.url(email, {
		protocol: 'https',
		s: '512',
		default: 'https://stripe.com/img/v3/home/twitter.png',
	});
};

module.exports = tools;

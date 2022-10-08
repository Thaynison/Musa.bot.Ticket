require('dotenv').config();
const { DiscordAPIError } = require('discord.js');
const discord = require('discord.js');
const { config } = require('dotenv');
const { ticketChannelId, adminChannelId, ticketPrefix } = require('./config.json');

const musa = new discord.Client({
	intents: [
		discord.GatewayIntentBits.DirectMessages,
		discord.GatewayIntentBits.Guilds,
		discord.GatewayIntentBits.GuildBans,
		discord.GatewayIntentBits.GuildMessages,
		discord.GatewayIntentBits.MessageContent,
	],
	partials: [discord.Partials.Channel],
});

musa.on('ready', () => {
	const status = [
		'Por favor abrir ticket. ',
	];
	i = 0;
	musa.user.setActivity(status[0]);
	setInterval(() => musa.user.setActivity(`${status[i++ % status.length]}`, {
		type: 'PLAYING',
	}), 1000 * 60*  15);
	musa.user.setStatus('online');
	console.log('😍 ' + musa.user.username + ' iniciada com sucesso!');
});

musa.on('messageCreate', async (msg) => {
	if (msg.author.bot) return;
	if (!msg.member.permissions.has('ADMINISTRATOR')) return;
	if (msg.channel.type === 'dm') return;

	const prefix = ticketPrefix;

	if (!msg.content.startsWith(prefix)) return;
	const ticketChannel = musa.channels.cache.find(channel => channel.id === ticketChannelId);
	msg.delete();
	const row = new discord.ActionRowBuilder()
		.addComponents(
			new discord.ButtonBuilder()
				.setCustomId('ticket')
				.setLabel('Criar Ticket')
				.setStyle('Secondary'),
		);

	const embed = new discord.EmbedBuilder()
		.setColor('#2f3136')
		.setImage('https://media.discordapp.net/attachments/1018022846372511754/1027448721388097576/DACBD98C-596E-4DD8-8B44-062F66E26969.gif')
		.setAuthor({ name: 'Criar ticket de atendimento | Musa', iconURL: 'https://media.discordapp.net/attachments/1018022846372511754/1027448747896090675/FA6EC4D5-AC1F-458B-8493-83C409C7B230.gif', url: 'https://discord.gg/Pbnn4EAAkZ' })
		.setURL('https://discord.gg/Pbnn4EAAkZ')
		.setDescription('Para dúvidas, suporte, contato profissional, orçamentos e compras.')
		.setFooter({ text: 'Musa © 2022', iconURL: 'https://media.discordapp.net/attachments/1018022846372511754/1027448747896090675/FA6EC4D5-AC1F-458B-8493-83C409C7B230.gif' });

	ticketChannel.send({ ephemeral: true, embeds: [embed], components: [row] });
});

musa.on('interactionCreate', async interaction => {
	if (interaction.customId === 'ticket') {
		if (!interaction.isButton()) return;
		const guild = musa.guilds.cache.get(interaction.guild.id);
		const guildChannels = guild.channels.cache;
		const userFirstName = interaction.user.username.split(' ')[0].toLowerCase();
		const interactionChannelName = `ticket-${userFirstName}`;
		const adminAlertChannel = musa.channels.cache.find(channel => channel.id === adminChannelId);

		const errorEmbed = new discord.EmbedBuilder()
			.setDescription('❌ Você já possui um ticket aberto! Encerre o ticket atual para poder abrir um novo.')
			.setColor('#2f3136')
			.setFooter({ text: 'Musa © 2022', iconURL: 'https://media.discordapp.net/attachments/1018022846372511754/1027448747896090675/FA6EC4D5-AC1F-458B-8493-83C409C7B230.gif' });

		const sucessEmbed = new discord.EmbedBuilder()
			.setDescription('✅ Você foi mencionado no canal correspondente ao seu ticket.')
			.setColor('#2f3136')
			.setFooter({ text: 'Musa © 2022', iconURL: 'https://media.discordapp.net/attachments/1018022846372511754/1027448747896090675/FA6EC4D5-AC1F-458B-8493-83C409C7B230.gif' });
			
		const adminMessage = new discord.EmbedBuilder()
			.setDescription(`☄️ Um ticket foi aberto! ${interaction.user.id}`)
			.addFields([
				{
					name: '😀 Usuário:',
					value: `${interaction.user.username}`,
					inline: true
				}
			])
			.setColor('#2f3136')
			.setFooter({ text: 'Musa © 2022', iconURL: 'https://media.discordapp.net/attachments/1018022846372511754/1027448747896090675/FA6EC4D5-AC1F-458B-8493-83C409C7B230.gif' });

		for (const channel of guildChannels.values()) {
			if(channel.name.startsWith('ticket')) {
				if(channel.topic === interaction.user.id) {
					return interaction.reply({ ephemeral: true, embeds: [errorEmbed] });
				}
			}
		}

		adminAlertChannel.send({ ephemeral: true, embeds: [adminMessage] });

		guild.channels.create({
			name: interactionChannelName,
			permissionOverwrites: [
				{
					id: interaction.user.id,
					allow: [discord.PermissionFlagsBits.SendMessages, discord.PermissionFlagsBits.ViewChannel],
				},
				{
					id: interaction.guild.roles.everyone,
					deny: [discord.PermissionFlagsBits.ViewChannel],
				}
			],
			type: discord.ChannelType.GuildText,
			//parent: 'xxx',
		}).then(async channel => {
			channel.setTopic(interaction.user.id);
			const embed = new discord.EmbedBuilder()
				.setDescription('☄️ Você solicitou um ticket. Entraremos em contato o mais rápido possível, aguarde. Clique no botão vermelho para encerrar o ticket.')
				.setColor('#2f3136')
				.setFooter({ text: 'Musa © 2022', iconURL: 'https://media.discordapp.net/attachments/1018022846372511754/1027448747896090675/FA6EC4D5-AC1F-458B-8493-83C409C7B230.gif' });

			const deleteButton = new discord.ActionRowBuilder()
				.addComponents(
					new discord.ButtonBuilder()
						.setCustomId('delete')
						.setLabel('Cancelar Ticket')
						.setStyle('Danger'),
				);

			await channel.send({ ephemeral: true, embeds: [embed], components: [deleteButton], content: `||<@${interaction.user.id}>||` });
			interaction.reply({ ephemeral: true, embeds: [sucessEmbed] });
		})
	}
	if (interaction.customId === 'delete') {
		interaction.channel.delete();
		const adminAlertChannel = musa.channels.cache.find(channel => channel.id === adminChannelId);
		const deleteMessage = new discord.EmbedBuilder()
			.setDescription(`❌ Ticket encerrado! ${interaction.user.id}`)
			.addFields([
				{
					name: '😀 Usuário:',
					value: `${interaction.user.username}`,
					inline: true
				}
			])
			.setColor('#2f3136')
			.setFooter({ text: 'Musa © 2022', iconURL: 'https://media.discordapp.net/attachments/1018022846372511754/1027448747896090675/FA6EC4D5-AC1F-458B-8493-83C409C7B230.gif' });

		await interaction.user.send({ ephemeral: true, embeds: [deleteMessage] }).catch(() => {
			adminAlertChannel.send({ ephemeral: true, embeds: [deleteMessage] });
			return false;
		});
		adminAlertChannel.send({ ephemeral: true, embeds: [deleteMessage] });
	}
});

musa.login(process.env.TOKEN);

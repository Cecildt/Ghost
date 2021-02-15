const {createIrreversibleMigration} = require('../../utils');
const logging = require('../../../../../shared/logging');
const ObjectID = require('bson-objectid');

module.exports = createIrreversibleMigration(
    async function up(knex) {
        logging.info('Resolving the orphaned webhooks');

        const orphanedWebhooks = await knex('webhooks')
            .select('webhooks.id')
            .leftJoin('integrations', 'integrations.id', 'webhooks.integration_id')
            .where('integrations.id', null);

        for (let i = 0; i < orphanedWebhooks.length; i++) {
            // Create new integration

            const webhook = orphanedWebhooks[i];
            const now = knex.raw('CURRENT_TIMESTAMP');
            const id = ObjectID.generate();

            const integration = {
                id: id,
                type: 'custom',
                name: `Generated integration ${id}`,
                slug: `generated-integration-${id}`,
                icon_image: null,
                description: `TODO`,
                created_at: now,
                created_by: 1,
                updated_at: now,
                updated_by: 1
            };

            await knex('integrations')
                .insert(integration);

            // Assign webhook to integration

            await knex('webhooks')
                .update({
                    integration_id: integration.id
                })
                .where({
                    id: webhook.id
                });
        }
    }
);

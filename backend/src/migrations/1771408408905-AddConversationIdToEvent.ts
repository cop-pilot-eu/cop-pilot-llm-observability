import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConversationIdToEvent1771408408905 implements MigrationInterface {
    name = 'AddConversationIdToEvent1771408408905'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "agent_events" ADD "conversation_id" uuid NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "agent_events" DROP COLUMN "conversation_id"`);
    }

}

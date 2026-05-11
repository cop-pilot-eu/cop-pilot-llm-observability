import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConversations1774863384560 implements MigrationInterface {
    name = 'AddConversations1774863384560'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "judgements" DROP CONSTRAINT "FK_56ff1b412e6e06b996300f6b0cf"`);
        await queryRunner.query(`ALTER TABLE "judgements" RENAME COLUMN "agent_event_id" TO "conversation_id"`);
        await queryRunner.query(`ALTER TABLE "judgements" RENAME CONSTRAINT "UQ_56ff1b412e6e06b996300f6b0cf" TO "UQ_825d5b4d784c3b33be7298f847b"`);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "agent_events" ADD CONSTRAINT "FK_17dd156f3822d1b1238eb355e34" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "judgements" ADD CONSTRAINT "FK_825d5b4d784c3b33be7298f847b" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "judgements" DROP CONSTRAINT "FK_825d5b4d784c3b33be7298f847b"`);
        await queryRunner.query(`ALTER TABLE "agent_events" DROP CONSTRAINT "FK_17dd156f3822d1b1238eb355e34"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`ALTER TABLE "judgements" RENAME CONSTRAINT "UQ_825d5b4d784c3b33be7298f847b" TO "UQ_56ff1b412e6e06b996300f6b0cf"`);
        await queryRunner.query(`ALTER TABLE "judgements" RENAME COLUMN "conversation_id" TO "agent_event_id"`);
        await queryRunner.query(`ALTER TABLE "judgements" ADD CONSTRAINT "FK_56ff1b412e6e06b996300f6b0cf" FOREIGN KEY ("agent_event_id") REFERENCES "agent_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

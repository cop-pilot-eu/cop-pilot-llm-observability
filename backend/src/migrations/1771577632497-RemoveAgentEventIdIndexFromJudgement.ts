import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveAgentEventIdIndexFromJudgement1771577632497 implements MigrationInterface {
    name = 'RemoveAgentEventIdIndexFromJudgement1771577632497'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_56ff1b412e6e06b996300f6b0c"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_56ff1b412e6e06b996300f6b0c" ON "judgements" ("agent_event_id") `);
    }

}

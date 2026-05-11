import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDateTypeToTimestampzAgentEvent1771412115492 implements MigrationInterface {
    name = 'UpdateDateTypeToTimestampzAgentEvent1771412115492'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "agent_events" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "agent_events" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "agent_events" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "agent_events" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "agent_events" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "agent_events" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "agent_events" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "agent_events" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

}

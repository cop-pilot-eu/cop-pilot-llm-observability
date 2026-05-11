import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLatencyOfJugdeLMMResponseToJudgement1771408795178 implements MigrationInterface {
    name = 'AddLatencyOfJugdeLMMResponseToJudgement1771408795178'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "judgements" ADD "latency_ms" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "judgements" DROP COLUMN "latency_ms"`);
    }

}

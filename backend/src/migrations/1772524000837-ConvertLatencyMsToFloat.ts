import { MigrationInterface, QueryRunner } from "typeorm";

export class ConvertLatencyMsToFloat1772524000837 implements MigrationInterface {
    name = 'ConvertLatencyMsToFloat1772524000837'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "judgements" DROP COLUMN "latency_ms"`);
        await queryRunner.query(`ALTER TABLE "judgements" ADD "latency_ms" double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "judgements" DROP COLUMN "latency_ms"`);
        await queryRunner.query(`ALTER TABLE "judgements" ADD "latency_ms" integer`);
    }

}

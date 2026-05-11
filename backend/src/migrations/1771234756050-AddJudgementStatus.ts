import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJudgementStatus1771234756050 implements MigrationInterface {
    name = 'AddJudgementStatus1771234756050'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "judgements" DROP COLUMN "judge_reasoning"`);
        await queryRunner.query(`ALTER TABLE "judgements" DROP COLUMN "judge_output"`);
        await queryRunner.query(`ALTER TABLE "judgements" ADD "output" text`);
        await queryRunner.query(`ALTER TABLE "judgements" ADD "reasoning" text`);
        await queryRunner.query(`CREATE TYPE "public"."judgements_status_enum" AS ENUM('PENDING', 'FAILED', 'COMPLETED')`);
        await queryRunner.query(`ALTER TABLE "judgements" ADD "status" "public"."judgements_status_enum" NOT NULL DEFAULT 'PENDING'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "judgements" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."judgements_status_enum"`);
        await queryRunner.query(`ALTER TABLE "judgements" DROP COLUMN "reasoning"`);
        await queryRunner.query(`ALTER TABLE "judgements" DROP COLUMN "output"`);
        await queryRunner.query(`ALTER TABLE "judgements" ADD "judge_output" text`);
        await queryRunner.query(`ALTER TABLE "judgements" ADD "judge_reasoning" text`);
    }

}
